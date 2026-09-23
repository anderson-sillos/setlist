import { Link, type Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  DemoActionNotice,
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { demoIds } from '@/data/demo';
import { useSong, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getSongEditHref,
  getSongHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';
import { formatRelativeUpdate } from '@/utils/dateTime';
import { formatSongDuration } from '@/utils/duration';
import { normalizeYoutubeReference } from '@/utils/youtubeReference';
import { lyricStatusLabels } from './songPresentation';

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
  const router = useRouter();
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
  const isDemoBand =
    bandId === demoIds.primaryBand || bandId === demoIds.secondaryBand;
  const youtubeReference = normalizeYoutubeReference(song?.youtubeReference);

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
                  accessibilityLabel="Editar música"
                  icon="edit"
                  label="Editar"
                  onPress={() =>
                    isDemoBand
                      ? setDemoNotice(
                          'As músicas de demonstração são só para consulta. Selecione uma banda conectada para editar o repertório.',
                        )
                      : router.push(getSongEditHref(bandId, songId))
                  }
                  style={styles.editButton}
                  variant="secondary"
                />
              ) : null}
            </View>
            <View style={styles.summaryLine}>
              <StatusPill
                tone={
                  song.lyricStatus === 'synchronized'
                    ? 'ready'
                    : song.lyricStatus === 'missing'
                      ? 'warning'
                      : 'default'
                }
              >
                {lyricStatusLabels[song.lyricStatus]}
              </StatusPill>
              {song.archivedAt ? (
                <StatusPill tone="warning">Arquivada</StatusPill>
              ) : null}
              <View
                accessibilityLabel={`Duração ${formatSongDuration(song.estimatedDurationMs)}`}
                accessible
                style={styles.durationMeta}
              >
                <AppIcon color={colors.violet} name="duration" size={14} />
                <AppText variant="caption">
                  Duração · {formatSongDuration(song.estimatedDurationMs)}
                </AppText>
              </View>
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
              <AppText
                accessibilityRole="header"
                tone="inverse"
                variant="eyebrow"
              >
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
                  {block.lines.map((line) =>
                    line.kind === 'separator' ? (
                      <View
                        accessibilityLabel="Linha de separação"
                        accessible
                        key={line.id}
                        style={styles.lyricSeparator}
                        testID={`lyric-separator-${line.id}`}
                      />
                    ) : (
                      <AppText
                        key={line.id}
                        style={[
                          styles.lyricLine,
                          line.text.length === 0 && styles.lyricBlankLine,
                          line.bold && styles.lyricLineBold,
                        ]}
                        tone="inverse"
                      >
                        {line.text}
                      </AppText>
                    ),
                  )}
                </View>
              ))}
            </Card>

            <Card style={styles.secondaryCard}>
              <AppText accessibilityRole="header" variant="heading">
                Informações
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
              </View>

              {song.notes ? (
                <View style={styles.notes}>
                  <AppText accessibilityRole="header" variant="heading">
                    Observações
                  </AppText>
                  <AppText>{song.notes}</AppText>
                </View>
              ) : null}

              {youtubeReference ? (
                <Link href={youtubeReference as Href} target="_blank" asChild>
                  <AppButton
                    accessibilityLabel="Abrir referência no YouTube"
                    icon="externalLink"
                    label="Abrir no YouTube"
                    style={styles.youtubeButton}
                    variant="secondary"
                  />
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
  editButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
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
    opacity: 0.55,
  },
  lyricLine: {
    minHeight: 24,
  },
  lyricBlankLine: {
    minHeight: spacing.md,
  },
  lyricLineBold: {
    fontWeight: '800',
  },
  lyricSeparator: {
    borderTopColor: colors.muted,
    borderTopWidth: 1,
    marginVertical: spacing.sm,
    minHeight: 1,
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
  youtubeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
});
