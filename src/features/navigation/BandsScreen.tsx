import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { ListControls, SearchField } from '@/components/ui/ListControls';
import { demoIds } from '@/data/demo';
import { useUserBandSummaries } from '@/data/queries';
import type { BandRole, Show } from '@/domain';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import {
  formatShowDate,
  normalizeForSearch,
} from '@/features/navigation/display';
import { getBandSectionHref } from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

interface BandsScreenProps {
  readonly now?: Date;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

function getNextShow(shows: readonly Show[], now: Date): Show | null {
  return (
    [...shows]
      .filter(
        (show) => show.status !== 'cancelled' && new Date(show.startsAt) >= now,
      )
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0] ??
    null
  );
}

export default function BandsScreen({
  now = new Date(),
  viewportHeight,
  viewportWidth,
}: BandsScreenProps) {
  const bandsQuery = useUserBandSummaries();
  const [search, setSearch] = useState('');
  const [creationNoticeVisible, setCreationNoticeVisible] = useState(false);
  const normalizedSearch = normalizeForSearch(search);
  const bands = useMemo(
    () =>
      [...(bandsQuery.data ?? [])]
        .filter(({ band }) =>
          normalizeForSearch(band.name).includes(normalizedSearch),
        )
        .sort((left, right) => {
          if (left.band.id === demoIds.primaryBand) return -1;
          if (right.band.id === demoIds.primaryBand) return 1;
          return left.band.name.localeCompare(right.band.name, 'pt-BR');
        }),
    [bandsQuery.data, normalizedSearch],
  );

  return (
    <AppNavigationShell
      currentRoute="/"
      fixedContent={
        <ListControls>
          <SearchField
            accessibilityLabel="Buscar banda pelo nome"
            onChangeText={setSearch}
            placeholder="Buscar banda"
            value={search}
          />
        </ListControls>
      }
      headerAction={{
        accessibilityLabel: 'Criar banda',
        label: 'Criar banda',
        onPress: () => setCreationNoticeVisible(true),
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

      {creationNoticeVisible ? (
        <View accessibilityLiveRegion="polite" style={styles.demoNotice}>
          <AppText>
            A criação entra junto com o login. Por enquanto, o palco é de
            demonstração.
          </AppText>
          <Pressable
            accessibilityLabel="Fechar aviso de demonstração"
            accessibilityRole="button"
            onPress={() => setCreationNoticeVisible(false)}
          >
            <AppText tone="accent">Fechar</AppText>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={bands}
        keyboardShouldPersistTaps="handled"
        keyExtractor={({ band }) => band.id}
        ListEmptyComponent={
          !bandsQuery.isPending && !bandsQuery.isError ? (
            normalizedSearch ? (
              <ListEmptyState
                actionLabel="Limpar filtros"
                message="Nem o roadie encontrou essa. Tente outra busca."
                onAction={() => setSearch('')}
                title="Nenhuma banda encontrada"
              />
            ) : (
              <ListEmptyState
                actionLabel="Criar banda"
                message="Crie uma banda ou abra o link de convite que você recebeu."
                onAction={() => setCreationNoticeVisible(true)}
                title="Seu palco ainda está vazio"
              />
            )
          ) : null
        }
        renderItem={({ item: { band, membership, shows } }) => {
          const nextShow = getNextShow(shows, now);
          const isLastAccessed = band.id === demoIds.primaryBand;

          return (
            <View style={styles.rowFrame}>
              <Link href={getBandSectionHref(band.id, 'shows')} asChild>
                <Pressable
                  accessibilityLabel={`Abrir ${band.name}`}
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.bandRow,
                    isLastAccessed && styles.lastAccessedRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.bandAvatar}>
                    <AppText tone="inverse" variant="heading">
                      {band.name.slice(0, 1).toLocaleUpperCase('pt-BR')}
                    </AppText>
                  </View>
                  <View style={styles.bandCopy}>
                    <View style={styles.titleLine}>
                      <AppText variant="heading">{band.name}</AppText>
                      {isLastAccessed ? (
                        <View style={styles.lastAccessedBadge}>
                          <AppText tone="accent" variant="caption">
                            Última acessada
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText tone="muted" variant="caption">
                      {roleLabels[membership.role]}
                    </AppText>
                    <AppText variant="caption">
                      {nextShow
                        ? `Próximo show · ${formatShowDate(nextShow.startsAt)}`
                        : 'Nenhum próximo show'}
                    </AppText>
                  </View>
                  <AppText tone="accent">›</AppText>
                </Pressable>
              </Link>
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
  demoNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.md,
    width: '90%',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  rowFrame: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  bandRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 84,
    padding: spacing.md,
  },
  lastAccessedRow: {
    borderColor: colors.violet,
    borderWidth: 2,
  },
  bandAvatar: {
    alignItems: 'center',
    backgroundColor: colors.violet,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  lastAccessedBadge: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
