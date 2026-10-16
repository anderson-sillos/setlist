import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { ListControls, SearchField } from '@/components/ui/ListControls';
import {
  getListRefreshControl,
  WebRefreshButton,
} from '@/components/ui/ScreenDataRefresh';
import { createBand, BandCreationError } from '@/data/supabase/bandMutations';
import { useUserBandSummaries } from '@/data/queries';
import { invalidateBandReadData } from '@/data/queryInvalidations';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import type { BandRole } from '@/domain';
import {
  BandCreationDialog,
  type BandCreationDialogStatus,
} from '@/features/bands/BandCreationDialog';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { CURRENT_BAND_TERM } from '@/features/bands/legalTerm';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { getBandSectionHref } from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatCompactShowListDate } from '@/utils/dateTime';
import { normalizeForSearch } from '@/utils/text';

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

interface BandsScreenProps {
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

export function BandsScreen({
  viewportHeight,
  viewportWidth,
}: BandsScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bandsQuery = useUserBandSummaries();
  const { onRefresh, refreshing } = useScreenDataRefresh([bandsQuery]);
  const { clearLastBand, isHydrated, lastBandId, setLastBand } =
    useLastBandSelection();
  const [search, setSearch] = useState('');
  const [creationDialogVisible, setCreationDialogVisible] = useState(false);
  const [creationStatus, setCreationStatus] =
    useState<BandCreationDialogStatus>('idle');
  const [creationDirty, setCreationDirty] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const unsavedChanges = useUnsavedChangesGuard({
    dirty: creationDirty,
    saving: creationStatus === 'submitting',
  });
  const normalizedSearch = normalizeForSearch(search);

  const openBand = async (bandId: string) => {
    await setLastBand(bandId);
    router.push(getBandSectionHref(bandId, 'shows'));
  };

  const openCreationDialog = () => {
    setCreationError(null);
    setCreationStatus('idle');
    setCreationDirty(false);
    setCreationDialogVisible(true);
  };

  const resetCreationDialog = () => {
    setCreationDialogVisible(false);
    setCreationDirty(false);
    setCreationError(null);
    setCreationStatus('idle');
  };

  const closeCreationDialog = () => {
    if (creationStatus === 'submitting') return;
    if (creationDirty) {
      unsavedChanges.requestConfirmation(resetCreationDialog);
      return;
    }

    resetCreationDialog();
  };

  const discardCreationChanges = () => {
    resetCreationDialog();
    unsavedChanges.discardAndLeave();
  };

  const handleCreateBand = async ({
    acceptedTerm,
    name,
  }: {
    readonly acceptedTerm: boolean;
    readonly name: string;
  }) => {
    setCreationError(null);
    setCreationStatus('submitting');

    try {
      const createdBandId = await createBand({
        acceptedTerm,
        name,
        termVersion: CURRENT_BAND_TERM.version,
      });
      void invalidateBandReadData(queryClient, {
        type: 'band-created',
        bandId: createdBandId,
      }).catch(() => undefined);
      setCreationDialogVisible(false);
      setCreationDirty(false);
      setCreationStatus('idle');
      await setLastBand(createdBandId);
      router.push(getBandSectionHref(createdBandId, 'repertoire'));
    } catch (error) {
      setCreationStatus('error');
      setCreationError(
        error instanceof BandCreationError
          ? error.message
          : 'Não foi possível criar a banda agora. Tente novamente.',
      );
    }
  };

  useEffect(() => {
    if (!isHydrated || !bandsQuery.data || !lastBandId) {
      return;
    }

    if (!bandsQuery.data.some(({ bandId }) => bandId === lastBandId)) {
      void clearLastBand();
    }
  }, [bandsQuery.data, clearLastBand, isHydrated, lastBandId]);

  const bands = useMemo(
    () =>
      [...(bandsQuery.data ?? [])]
        .filter(({ bandName }) =>
          normalizeForSearch(bandName).includes(normalizedSearch),
        )
        .sort((left, right) => {
          if (lastBandId && left.bandId === lastBandId) return -1;
          if (lastBandId && right.bandId === lastBandId) return 1;
          return left.bandName.localeCompare(right.bandName, 'pt-BR');
        }),
    [bandsQuery.data, lastBandId, normalizedSearch],
  );

  return (
    <AppNavigationShell
      currentRoute="/"
      fixedContent={
        <ListControls>
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <SearchField
                accessibilityLabel="Buscar banda pelo nome"
                onChangeText={setSearch}
                placeholder="Buscar banda"
                value={search}
              />
            </View>
            <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
          </View>
        </ListControls>
      }
      headerAction={{
        accessibilityLabel: 'Criar banda',
        icon: 'add',
        label: 'Criar banda',
        onPress: openCreationDialog,
      }}
      scrollable={false}
      testID="bands-screen"
      title="Minhas bandas"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {bandsQuery.isPending ? <LoadingFeedback /> : null}

      {bandsQuery.isError ? (
        <ErrorFeedback onRetry={() => void bandsQuery.refetch()} />
      ) : null}

      {creationDialogVisible ? (
        <BandCreationDialog
          discardPrompt={
            Platform.OS === 'ios'
              ? {
                  onContinue: unsavedChanges.continueEditing,
                  onDiscard: discardCreationChanges,
                  visible: unsavedChanges.confirmationVisible,
                }
              : undefined
          }
          errorMessage={creationError}
          onClose={closeCreationDialog}
          onDirtyChange={setCreationDirty}
          onSubmit={(input) => void handleCreateBand(input)}
          status={creationStatus}
          visible
        />
      ) : null}
      {Platform.OS !== 'ios' || !creationDialogVisible ? (
        <UnsavedChangesPrompt
          onContinue={unsavedChanges.continueEditing}
          onDiscard={discardCreationChanges}
          visible={unsavedChanges.confirmationVisible}
        />
      ) : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={bands}
        keyboardShouldPersistTaps="handled"
        keyExtractor={({ bandId }) => bandId}
        refreshControl={getListRefreshControl({ onRefresh, refreshing })}
        ListEmptyComponent={
          !bandsQuery.isPending && !bandsQuery.isError ? (
            normalizedSearch ? (
              <ListEmptyState
                actionLabel="Limpar busca"
                message="Nem o roadie encontrou essa. Tente outra busca."
                onAction={() => setSearch('')}
                title="Nenhuma banda encontrada"
              />
            ) : (
              <ListEmptyState
                actionIcon="add"
                actionLabel="Criar banda"
                message="Crie uma banda ou abra o link de convite que você recebeu."
                onAction={openCreationDialog}
                title="Seu palco ainda está vazio"
              />
            )
          ) : null
        }
        renderItem={({ item: band }) => {
          const nextShowLabel = band.nextShowStartsAt
            ? `Próximo show · ${formatCompactShowListDate(band.nextShowStartsAt)}`
            : 'Nenhum próximo show';
          const isLastAccessed = band.bandId === lastBandId;
          return (
            <View style={styles.rowFrame}>
              <Pressable
                accessibilityLabel={`Abrir ${band.bandName}`}
                accessibilityRole="link"
                onPress={() => void openBand(band.bandId)}
                style={({ pressed }) => [
                  styles.bandRow,
                  isLastAccessed && styles.lastAccessedRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.bandRowLayout}>
                  <View style={styles.bandRowContent}>
                    <View style={styles.bandAvatar}>
                      <AppText tone="onAccent" variant="heading">
                        {band.bandName.slice(0, 1).toLocaleUpperCase('pt-BR')}
                      </AppText>
                    </View>
                    <View style={styles.bandCopy}>
                      <View style={styles.titleLine}>
                        <AppText
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          style={styles.bandName}
                          variant="heading"
                        >
                          {band.bandName}
                        </AppText>
                        {isLastAccessed ? (
                          <View style={styles.lastAccessedBadge}>
                            <AppText tone="accent" variant="caption">
                              Última acessada
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText tone="muted" variant="caption">
                        {roleLabels[band.role]}
                      </AppText>
                      <AppText variant="caption">{nextShowLabel}</AppText>
                    </View>
                  </View>
                  <View style={styles.bandRowNavigation}>
                    <AppIcon
                      color={colors.text.secondary}
                      name="forward"
                      size={20}
                    />
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        testID="bands-list"
      />
    </AppNavigationShell>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  searchField: {
    flex: 1,
    minWidth: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  bandRow: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 84,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  bandRowLayout: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
  },
  bandRowContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  bandRowNavigation: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 20,
  },
  lastAccessedRow: {
    borderColor: colors.action.primary,
    borderWidth: 2,
  },
  bandAvatar: {
    alignItems: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  bandCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.xs,
    minWidth: 0,
  },
  bandName: {
    flexShrink: 1,
    minWidth: 0,
  },
  lastAccessedBadge: {
    backgroundColor: colors.background.selected,
    borderRadius: radii.pill,
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});

export default BandsScreen;
