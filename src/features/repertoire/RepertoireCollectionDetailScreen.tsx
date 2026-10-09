import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import { useRepertoireCollection, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getRepertoireCollectionAddSongsHref,
  getRepertoireCollectionHref,
  getRepertoireCollectionsHref,
  getSongHref,
} from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatSongDuration } from '@/utils/duration';
import { RepertoireCollectionEditorScreen } from './RepertoireCollectionEditorScreen';

interface RepertoireCollectionDetailScreenProps {
  readonly bandId: EntityId;
  readonly collectionId: EntityId;
}

export function RepertoireCollectionDetailScreen({
  bandId,
  collectionId,
}: RepertoireCollectionDetailScreenProps) {
  const router = useRouter();
  const collectionQuery = useRepertoireCollection(bandId, collectionId);
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionQuery,
    userBandsQuery,
  ]);
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const summary = collectionQuery.data;

  if (!userBandsQuery.isPending && canEdit) {
    return (
      <RepertoireCollectionEditorScreen
        bandId={bandId}
        collectionId={collectionId}
        returnTo="collections"
      />
    );
  }

  return (
    <BandAreaLayout
      activeSection="repertoire"
      backHref={getRepertoireCollectionsHref(bandId)}
      bandId={bandId}
      currentRoute={getRepertoireCollectionHref(bandId, collectionId) as string}
      screenKind="detail"
      title="Coleção"
    >
      {collectionQuery.isPending || userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {collectionQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void collectionQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      {!collectionQuery.isPending &&
      !collectionQuery.isError &&
      !userBandsQuery.isPending &&
      !userBandsQuery.isError &&
      !summary ? (
        <UnavailableFeedback title="Coleção indisponível" />
      ) : null}
      <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />

      {summary ? (
        <View style={styles.content}>
          <Card style={styles.summaryCard}>
            <AppText accessibilityRole="header" variant="title">
              {summary.collection.name}
            </AppText>
            <View style={styles.metadata}>
              <AppText tone="muted">
                {summary.songCount === 1
                  ? '1 música'
                  : `${summary.songCount} músicas`}
              </AppText>
              <AppText tone="muted">
                Duração conhecida ·{' '}
                {summary.estimatedDurationMs === null
                  ? '—'
                  : formatSongDuration(summary.estimatedDurationMs)}
              </AppText>
              {summary.archivedSongCount > 0 ? (
                <StatusPill
                  accessibilityLabel={`${summary.archivedSongCount} ${summary.archivedSongCount === 1 ? 'música arquivada' : 'músicas arquivadas'}`}
                  icon="archive"
                  tone="warning"
                >
                  {summary.archivedSongCount === 1
                    ? '1 música arquivada'
                    : `${summary.archivedSongCount} músicas arquivadas`}
                </StatusPill>
              ) : null}
            </View>
          </Card>

          {summary.songs.length ? (
            <View style={styles.songList}>
              {summary.songs.map((song, index) => (
                <Link href={getSongHref(bandId, song.id)} asChild key={song.id}>
                  <Pressable
                    accessibilityLabel={`Abrir música ${song.title}${song.archivedAt === null ? '' : ', arquivada'}`}
                    accessibilityRole="link"
                    style={({ pressed }) => [
                      styles.songRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Card style={styles.songCard}>
                      <AppText style={styles.position} tone="muted">
                        {index + 1}
                      </AppText>
                      <View style={styles.songCopy}>
                        <AppText variant="heading">{song.title}</AppText>
                        <AppText numberOfLines={1} tone="muted">
                          {song.originalArtist ?? 'Artista/Banda não informado'}
                        </AppText>
                      </View>
                      {song.archivedAt !== null ? (
                        <StatusPill
                          accessible={false}
                          icon="archive"
                          tone="warning"
                        >
                          Arquivada
                        </StatusPill>
                      ) : null}
                      <AppIcon
                        color={colors.text.secondary}
                        name="forward"
                        size={20}
                      />
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          ) : (
            <ListEmptyState
              actionIcon={canEdit ? 'musicAdd' : undefined}
              actionLabel={canEdit ? 'Adicionar músicas' : undefined}
              message={
                canEdit
                  ? 'Inclua músicas do repertório quando quiser. A coleção pode continuar vazia.'
                  : 'Esta coleção ainda não tem músicas disponíveis.'
              }
              onAction={
                canEdit
                  ? () =>
                      router.push(
                        getRepertoireCollectionAddSongsHref(
                          bandId,
                          collectionId,
                        ),
                      )
                  : undefined
              }
              title="Coleção vazia"
            />
          )}
          {summary.songsWithoutDurationCount > 0 ? (
            <AppText style={styles.durationNote} tone="muted" variant="caption">
              {summary.songsWithoutDurationCount === 1
                ? 'A duração de 1 música não foi informada.'
                : `A duração de ${summary.songsWithoutDurationCount} músicas não foi informada.`}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  summaryCard: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  songList: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  songRow: {
    alignSelf: 'center',
    borderRadius: radii.lg,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  songCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
  },
  position: {
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    textAlign: 'right',
  },
  songCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  durationNote: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});
