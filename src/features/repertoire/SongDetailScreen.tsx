import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  DemoActionNotice,
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useSong, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatDuration,
  formatRelativeUpdate,
  lyricStatusLabels,
} from '@/features/navigation/display';
import { getBandSectionHref, getSongHref } from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';

interface SongDetailScreenProps {
  readonly bandId: EntityId;
  readonly now?: Date;
  readonly songId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
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
              icon: 'more',
              label: 'Mais opções',
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
        <LoadingFeedback />
      ) : null}
      {songQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void songQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      {!songQuery.isPending && !songQuery.isError && !song ? (
        <UnavailableFeedback title="Música indisponível" />
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

const styles = StyleSheet.create({
  detail: {
    gap: spacing.lg,
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
  pressed: {
    opacity: 0.72,
  },
});
