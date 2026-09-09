import { Link } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useShow, useSong, useSongs } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatShowDate,
  lyricStatusLabels,
  showStatusLabels,
} from '@/features/navigation/BandSectionScreens';
import { getBandSectionHref } from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';

interface SongDetailScreenProps {
  readonly bandId: EntityId;
  readonly songId: EntityId;
  readonly viewportWidth?: number;
}

interface ShowDetailScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
  readonly viewportWidth?: number;
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) {
    return 'Não informada';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function BackLink({
  bandId,
  section,
}: {
  bandId: EntityId;
  section: 'shows' | 'repertoire';
}) {
  const label =
    section === 'shows' ? 'Voltar para Shows' : 'Voltar para Repertório';

  return (
    <Link href={getBandSectionHref(bandId, section)} asChild>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="link"
        style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
      >
        <AppText tone="accent">← {label}</AppText>
      </Pressable>
    </Link>
  );
}

export function SongDetailScreen({
  bandId,
  songId,
  viewportWidth,
}: SongDetailScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const songQuery = useSong(bandId, songId);
  const song = songQuery.data;

  return (
    <BandAreaLayout activeSection="repertoire" bandId={bandId}>
      <BackLink bandId={bandId} section="repertoire" />

      {songQuery.isPending ? (
        <AppText accessibilityLiveRegion="polite">Carregando música…</AppText>
      ) : null}
      {songQuery.isError ? (
        <AppText accessibilityRole="alert">
          Não foi possível carregar a música.
        </AppText>
      ) : null}
      {!songQuery.isPending && !song ? (
        <AppText accessibilityRole="alert">Música não encontrada.</AppText>
      ) : null}

      {song ? (
        <View
          style={[styles.detail, layoutMode !== 'phone' && styles.detailWide]}
          testID={`song-detail-${layoutMode}`}
        >
          <Card style={styles.primaryCard}>
            <AppText tone="accent" variant="eyebrow">
              {lyricStatusLabels[song.lyricStatus]}
            </AppText>
            <AppText accessibilityRole="header" variant="title">
              {song.title}
            </AppText>
            <AppText tone="muted">
              {song.originalArtist ?? 'Artista não informado'}
            </AppText>

            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <AppText tone="muted" variant="caption">
                  Tom
                </AppText>
                <AppText>{song.musicalKey ?? '—'}</AppText>
              </View>
              <View style={styles.metadataItem}>
                <AppText tone="muted" variant="caption">
                  BPM
                </AppText>
                <AppText>{song.bpm ?? '—'}</AppText>
              </View>
              <View style={styles.metadataItem}>
                <AppText tone="muted" variant="caption">
                  Duração
                </AppText>
                <AppText>{formatDuration(song.estimatedDurationMs)}</AppText>
              </View>
            </View>

            {song.notes ? (
              <View style={styles.notes}>
                <AppText variant="heading">Observações</AppText>
                <AppText>{song.notes}</AppText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.lyricCard} tone="dark">
            <AppText tone="inverse" variant="eyebrow">
              Letra vigente
            </AppText>
            {song.lyrics.blocks.length === 0 ? (
              <AppText tone="inverse">Sem letra cadastrada</AppText>
            ) : null}
            {song.lyrics.blocks.map((block) => (
              <View key={block.id} style={styles.lyricBlock}>
                {block.name ? (
                  <AppText tone="inverse" variant="caption">
                    {block.name}
                  </AppText>
                ) : null}
                {block.lines.map((line) => (
                  <AppText key={line.id} tone="inverse">
                    {line.text}
                  </AppText>
                ))}
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

export function ShowDetailScreen({
  bandId,
  showId,
  viewportWidth,
}: ShowDetailScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const show = showQuery.data;
  const songsById = new Map(songsQuery.data?.map((song) => [song.id, song]));

  return (
    <BandAreaLayout activeSection="shows" bandId={bandId}>
      <BackLink bandId={bandId} section="shows" />

      {showQuery.isPending ? (
        <AppText accessibilityLiveRegion="polite">Carregando show…</AppText>
      ) : null}
      {showQuery.isError || songsQuery.isError ? (
        <AppText accessibilityRole="alert">
          Não foi possível carregar o show.
        </AppText>
      ) : null}
      {!showQuery.isPending && !show ? (
        <AppText accessibilityRole="alert">Show não encontrado.</AppText>
      ) : null}

      {show ? (
        <View
          style={[styles.detail, layoutMode !== 'phone' && styles.detailWide]}
          testID={`show-detail-${layoutMode}`}
        >
          <Card style={styles.primaryCard}>
            <AppText tone="accent" variant="eyebrow">
              {showStatusLabels[show.status]}
            </AppText>
            <AppText accessibilityRole="header" variant="title">
              {show.name}
            </AppText>
            <AppText tone="muted">{formatShowDate(show.startsAt)}</AppText>
            <AppText>{show.venue}</AppText>
            {show.notes ? (
              <View style={styles.notes}>
                <AppText variant="heading">Observações</AppText>
                <AppText>{show.notes}</AppText>
              </View>
            ) : null}
          </Card>

          <View style={styles.setlist}>
            <AppText accessibilityRole="header" variant="heading">
              Setlist
            </AppText>
            {show.blocks.map((block) => (
              <Card key={block.id} style={styles.blockCard}>
                <AppText tone="accent" variant="eyebrow">
                  {block.name}
                </AppText>
                {block.items.map((item, index) => {
                  const song = songsById.get(item.songId);

                  return (
                    <View key={item.id} style={styles.setlistItem}>
                      <AppText style={styles.itemNumber} tone="muted">
                        {index + 1}.
                      </AppText>
                      <View style={styles.itemCopy}>
                        <AppText>
                          {song?.title ?? 'Música indisponível'}
                        </AppText>
                        {item.notes ? (
                          <AppText tone="muted" variant="caption">
                            {item.notes}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

export { formatDuration };

const styles = StyleSheet.create({
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  detail: {
    gap: spacing.lg,
  },
  detailWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  primaryCard: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  lyricCard: {
    flex: 1.4,
    gap: spacing.lg,
    minWidth: 0,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  metadataItem: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.md,
    gap: spacing.xs,
    minWidth: 80,
    padding: spacing.md,
  },
  notes: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
  },
  lyricBlock: {
    gap: spacing.sm,
  },
  setlist: {
    flex: 1.4,
    gap: spacing.md,
    minWidth: 0,
  },
  blockCard: {
    gap: spacing.md,
  },
  setlistItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  itemNumber: {
    width: 24,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
