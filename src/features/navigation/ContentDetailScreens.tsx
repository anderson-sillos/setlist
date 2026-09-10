import { Link, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useShow, useSong, useSongs, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatDuration,
  formatRelativeUpdate,
  formatShowDate,
  getShowDurationMs,
  lyricStatusLabels,
  showStatusLabels,
} from '@/features/navigation/display';
import {
  getBandSectionHref,
  getShowHref,
  getSongHref,
  getStageHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';

interface SongDetailScreenProps {
  readonly bandId: EntityId;
  readonly now?: Date;
  readonly songId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

interface ShowDetailScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

function DemoActionNotice({
  message,
  onClose,
}: {
  readonly message: string | null;
  readonly onClose: () => void;
}) {
  return message ? (
    <View accessibilityLiveRegion="polite" style={styles.demoNotice}>
      <AppText>{message}</AppText>
      <Pressable
        accessibilityLabel="Fechar aviso de demonstração"
        accessibilityRole="button"
        onPress={onClose}
      >
        <AppText tone="accent">Fechar</AppText>
      </Pressable>
    </View>
  ) : null;
}

export function SongDetailScreen({
  bandId,
  now = new Date(),
  songId,
  viewportHeight,
  viewportWidth,
}: SongDetailScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const songQuery = useSong(bandId, songId);
  const userBandsQuery = useUserBands();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const song = songQuery.data;
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';

  return (
    <BandAreaLayout
      activeSection="repertoire"
      backHref={getBandSectionHref(bandId, 'repertoire')}
      bandId={bandId}
      currentRoute={getSongHref(bandId, songId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Mais opções da música',
              label: '•••',
              onPress: () =>
                setDemoNotice(
                  'Arquivar e restaurar entram no incremento do repertório.',
                ),
            }
          : undefined
      }
      screenKind="detail"
      title="Detalhes da música"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {songQuery.isPending || userBandsQuery.isPending ? (
        <AppText accessibilityLiveRegion="polite">Afinando a letra…</AppText>
      ) : null}
      {songQuery.isError || userBandsQuery.isError ? (
        <AppText accessibilityRole="alert">
          Essa música saiu do tom. Não foi possível carregar os detalhes.
        </AppText>
      ) : null}
      {!songQuery.isPending && !song ? (
        <AppText accessibilityRole="alert">Música não encontrada.</AppText>
      ) : null}

      <DemoActionNotice
        message={demoNotice}
        onClose={() => setDemoNotice(null)}
      />

      {song ? (
        <View style={styles.detail} testID={`song-detail-${layoutMode}`}>
          <Card style={styles.compactHeader}>
            <View style={styles.titleLine}>
              <View style={styles.titleCopy}>
                <AppText accessibilityRole="header" variant="title">
                  {song.title}
                </AppText>
                <AppText tone="muted">
                  {song.originalArtist ?? 'Artista/Banda não informado'}
                </AppText>
              </View>
              {canEdit ? (
                <AppButton
                  label="Editar"
                  onPress={() =>
                    setDemoNotice(
                      'O editor chega no incremento do repertório. A permissão já está conferida.',
                    )
                  }
                />
              ) : null}
            </View>
            <View style={styles.summaryLine}>
              <View style={styles.statusPill}>
                <AppText tone="accent" variant="caption">
                  {lyricStatusLabels[song.lyricStatus]}
                </AppText>
              </View>
              {song.archivedAt ? (
                <View style={styles.archivedPill}>
                  <AppText variant="caption">Arquivada</AppText>
                </View>
              ) : null}
              <AppText variant="caption">
                Duração · {formatDuration(song.estimatedDurationMs)}
              </AppText>
              <AppText tone="muted" variant="caption">
                Atualizada {formatRelativeUpdate(song.updatedAt, now)}
              </AppText>
            </View>
          </Card>

          <View
            style={[
              styles.detailColumns,
              layoutMode !== 'phone' && styles.detailColumnsWide,
            ]}
          >
            <Card style={styles.lyricCard} tone="dark">
              <AppText tone="inverse" variant="eyebrow">
                Letra
              </AppText>
              {song.lyrics.blocks.length === 0 ? (
                <AppText tone="inverse">Sem letra cadastrada</AppText>
              ) : null}
              {song.lyrics.blocks.map((block) => (
                <View key={block.id} style={styles.lyricBlock}>
                  {block.name ? (
                    <AppText style={styles.lyricBlockName} tone="inverse">
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

            <Card style={styles.secondaryCard}>
              <AppText variant="heading">Informações</AppText>
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
              </View>

              {song.notes ? (
                <View style={styles.notes}>
                  <AppText variant="heading">Observações</AppText>
                  <AppText>{song.notes}</AppText>
                </View>
              ) : null}

              {song.youtubeReference ? (
                <Link
                  href={song.youtubeReference as Href}
                  target="_blank"
                  asChild
                >
                  <Pressable
                    accessibilityLabel="Abrir referência no YouTube"
                    accessibilityRole="link"
                    style={({ pressed }) => [
                      styles.externalLink,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText tone="accent">Abrir no YouTube ↗</AppText>
                  </Pressable>
                </Link>
              ) : null}
            </Card>
          </View>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

export function ShowDetailScreen({
  bandId,
  showId,
  viewportHeight,
  viewportWidth,
}: ShowDetailScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const show = showQuery.data;
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const totalDurationMs = show ? getShowDurationMs(show, songsById) : null;

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getBandSectionHref(bandId, 'shows')}
      bandId={bandId}
      currentRoute={getShowHref(bandId, showId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Mais opções do show',
              label: '•••',
              onPress: () =>
                setDemoNotice(
                  'Duplicar e alterar o estado entram no incremento de shows.',
                ),
            }
          : undefined
      }
      screenKind="detail"
      title="Detalhes do show"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {showQuery.isPending ||
      songsQuery.isPending ||
      userBandsQuery.isPending ? (
        <AppText accessibilityLiveRegion="polite">Montando a setlist…</AppText>
      ) : null}
      {showQuery.isError || songsQuery.isError || userBandsQuery.isError ? (
        <AppText accessibilityRole="alert">
          Esse show perdeu a entrada. Não foi possível carregar os detalhes.
        </AppText>
      ) : null}
      {!showQuery.isPending && !show ? (
        <AppText accessibilityRole="alert">Show não encontrado.</AppText>
      ) : null}

      <DemoActionNotice
        message={demoNotice}
        onClose={() => setDemoNotice(null)}
      />

      {show ? (
        <View
          style={[styles.detail, layoutMode !== 'phone' && styles.detailWide]}
          testID={`show-detail-${layoutMode}`}
        >
          <Card style={styles.showSummary}>
            <View style={styles.summaryLine}>
              <View style={styles.statusPill}>
                <AppText tone="accent" variant="caption">
                  {showStatusLabels[show.status]}
                </AppText>
              </View>
            </View>
            <AppText accessibilityRole="header" variant="title">
              {show.name}
            </AppText>
            <AppText tone="muted">{formatShowDate(show.startsAt)}</AppText>
            <AppText>{show.venue}</AppText>

            <View style={styles.durationSummary}>
              <AppText tone="muted" variant="caption">
                Tempo total estimado
              </AppText>
              <AppText variant="heading">
                {totalDurationMs === null
                  ? 'Duração não informada'
                  : formatDuration(totalDurationMs)}
              </AppText>
              {totalDurationMs !== null ? (
                <AppText tone="muted" variant="caption">
                  Músicas {formatDuration(totalDurationMs)} · Planejamento 0:00
                </AppText>
              ) : null}
            </View>

            {show.notes ? (
              <View style={styles.notes}>
                <AppText variant="heading">Observações</AppText>
                <AppText>{show.notes}</AppText>
              </View>
            ) : null}

            {canEdit && show.status === 'draft' ? (
              <AppButton
                label="Editar setlist"
                onPress={() =>
                  setDemoNotice(
                    'A edição completa chega no incremento de shows. A permissão já está conferida.',
                  )
                }
              />
            ) : null}

            {show.status !== 'cancelled' ? (
              <Link href={getStageHref(bandId, show.id)} asChild>
                <Pressable
                  accessibilityLabel="Abrir modo palco"
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.stageLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText tone="inverse">Abrir modo palco</AppText>
                </Pressable>
              </Link>
            ) : null}
          </Card>

          <View style={styles.setlist}>
            <AppText accessibilityRole="header" variant="heading">
              Setlist
            </AppText>
            {show.blocks.map((block) => {
              const blockDuration = block.items.reduce((total, item) => {
                return (
                  total + (songsById.get(item.songId)?.estimatedDurationMs ?? 0)
                );
              }, 0);
              const blockHasDuration = block.items.some(
                (item) =>
                  songsById.get(item.songId)?.estimatedDurationMs != null,
              );

              return (
                <Card key={block.id} style={styles.blockCard}>
                  <View style={styles.blockHeader}>
                    <AppText tone="accent" variant="eyebrow">
                      {block.name}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {blockHasDuration ? formatDuration(blockDuration) : '—'}
                    </AppText>
                  </View>
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
                        <AppText tone="muted" variant="caption">
                          {song?.estimatedDurationMs == null
                            ? '—'
                            : formatDuration(song.estimatedDurationMs)}
                        </AppText>
                      </View>
                    );
                  })}
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

export { formatDuration };

const styles = StyleSheet.create({
  detail: {
    gap: spacing.lg,
  },
  detailWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  compactHeader: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusPill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  archivedPill: {
    backgroundColor: '#fef3c7',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailColumns: {
    gap: spacing.lg,
  },
  detailColumnsWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  lyricCard: {
    flex: 1.45,
    gap: spacing.xl,
    minWidth: 0,
  },
  lyricBlock: {
    gap: spacing.sm,
  },
  lyricBlockName: {
    fontWeight: '800',
    marginBottom: spacing.xs,
    opacity: 0.72,
  },
  secondaryCard: {
    flex: 0.75,
    gap: spacing.lg,
    minWidth: 0,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
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
    paddingTop: spacing.lg,
  },
  externalLink: {
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingVertical: spacing.md,
  },
  showSummary: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  durationSummary: {
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  setlist: {
    flex: 1.4,
    gap: spacing.md,
    minWidth: 0,
  },
  blockCard: {
    gap: spacing.md,
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setlistItem: {
    alignItems: 'flex-start',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  itemNumber: {
    width: 24,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  stageLink: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  demoNotice: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
