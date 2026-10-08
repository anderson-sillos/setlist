import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import { useRepertoireCollections, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getRepertoireCollectionCreateHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionHref,
  getRepertoireCollectionsHref,
} from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatSongDuration } from '@/utils/duration';

interface RepertoireCollectionsScreenProps {
  readonly bandId: EntityId;
}

export function RepertoireCollectionsScreen({
  bandId,
}: RepertoireCollectionsScreenProps) {
  const router = useRouter();
  const collectionsQuery = useRepertoireCollections(bandId);
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionsQuery,
    userBandsQuery,
  ]);
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const createCollection = () =>
    router.push(getRepertoireCollectionCreateHref(bandId));

  return (
    <BandAreaLayout
      activeSection="repertoire"
      backHref={getBandSectionHref(bandId, 'repertoire')}
      bandId={bandId}
      currentRoute={getRepertoireCollectionsHref(bandId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Criar coleção de músicas',
              icon: 'add',
              label: 'Criar coleção',
              onPress: createCollection,
            }
          : undefined
      }
      screenKind="detail"
      title="Coleções"
    >
      {collectionsQuery.isPending || userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {collectionsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void collectionsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      {!collectionsQuery.isPending &&
      !collectionsQuery.isError &&
      !userBandsQuery.isPending &&
      !userBandsQuery.isError ? (
        collectionsQuery.data?.length ? (
          <View style={styles.list} testID="repertoire-collections-list">
            {collectionsQuery.data.map((summary) => (
              <View key={summary.collection.id} style={styles.rowFrame}>
                <Link
                  href={
                    canEdit
                      ? getRepertoireCollectionEditHref(
                          bandId,
                          summary.collection.id,
                          'collections',
                        )
                      : getRepertoireCollectionHref(
                          bandId,
                          summary.collection.id,
                        )
                  }
                  asChild
                >
                  <Pressable
                    accessibilityLabel={`${canEdit ? 'Editar' : 'Abrir'} coleção ${summary.collection.name}`}
                    accessibilityRole="link"
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Card style={styles.card}>
                      <AppIcon
                        color={colors.text.secondary}
                        name="repertoire"
                        size={28}
                      />
                      <View style={styles.rowCopy}>
                        <AppText variant="heading">
                          {summary.collection.name}
                        </AppText>
                        <View style={styles.rowMetadata}>
                          <AppText tone="muted" variant="caption">
                            {summary.songCount === 1
                              ? '1 música'
                              : `${summary.songCount} músicas`}
                            {' · '}
                            {summary.estimatedDurationMs === null
                              ? 'Duração não informada'
                              : formatSongDuration(summary.estimatedDurationMs)}
                          </AppText>
                          {summary.archivedSongCount > 0 ? (
                            <StatusPill
                              accessibilityLabel={`${summary.archivedSongCount} ${summary.archivedSongCount === 1 ? 'música arquivada' : 'músicas arquivadas'}`}
                              icon="archive"
                              tone="warning"
                            >
                              {summary.archivedSongCount === 1
                                ? '1 arquivada'
                                : `${summary.archivedSongCount} arquivadas`}
                            </StatusPill>
                          ) : null}
                        </View>
                      </View>
                      <AppIcon
                        color={colors.text.secondary}
                        name="forward"
                        size={20}
                      />
                    </Card>
                  </Pressable>
                </Link>
              </View>
            ))}
          </View>
        ) : (
          <ListEmptyState
            actionIcon={canEdit ? 'add' : undefined}
            actionLabel={canEdit ? 'Criar coleção' : undefined}
            message={
              canEdit
                ? 'Agrupe músicas por ocasião ou estilo. Essa organização é opcional e não altera o repertório.'
                : 'Ainda não há coleções para esta banda. Você pode usar o repertório normalmente.'
            }
            onAction={canEdit ? createCollection : undefined}
            title="Nenhuma coleção"
          />
        )
      ) : null}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    width: '100%',
  },
  rowFrame: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  row: {
    borderRadius: radii.lg,
  },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowMetadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
