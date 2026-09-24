import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

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
import {
  archiveSong,
  removeSong,
  restoreSong,
  SongLifecycleMutationError,
} from '@/data/supabase/songLifecycleMutations';
import { useSong, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getSongEditHref,
  getSongHref,
  getSongLyricsHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, spacing } from '@/theme/tokens';
import { formatRelativeUpdate } from '@/utils/dateTime';
import { formatSongDuration } from '@/utils/duration';
import { normalizeYoutubeReference } from '@/utils/youtubeReference';
import { SongLifecycleDialog } from './SongLifecycleDialog';
import { SongLyricsContent } from './SongLyricsContent';
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const dimensions = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? dimensions.width);
  const songQuery = useSong(bandId, songId);
  const userBandsQuery = useUserBands();
  const [lifecycleDialogVisible, setLifecycleDialogVisible] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [lifecycleNotice, setLifecycleNotice] = useState<string | null>(null);
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const song = songQuery.data;
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const isDemoBand =
    bandId === demoIds.primaryBand || bandId === demoIds.secondaryBand;
  const youtubeReference = normalizeYoutubeReference(song?.youtubeReference);
  const openYoutubeReference = () => {
    if (!youtubeReference) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(youtubeReference, '_blank', 'noopener,noreferrer');
      return;
    }

    void Linking.openURL(youtubeReference);
  };
  const closeLifecycleDialog = () => {
    if (lifecycleSubmitting) {
      return;
    }

    setLifecycleDialogVisible(false);
    setLifecycleError(null);
  };
  const invalidateSongQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['bands', bandId, 'songs'],
    });
    await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
  };
  const handleLifecycleError = (error: unknown) => {
    setLifecycleError(
      error instanceof SongLifecycleMutationError
        ? error.message
        : 'Não foi possível atualizar a música agora. Tente novamente.',
    );
  };
  const handleArchive = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      await archiveSong({ bandId, songId });
      await invalidateSongQueries();
      setLifecycleNotice(
        'Música arquivada. Ela não aparecerá em novas setlists, mas os shows existentes continuam intactos.',
      );
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };
  const handleRestore = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      await restoreSong({ bandId, songId });
      await invalidateSongQueries();
      setLifecycleNotice('Música restaurada e disponível para novas setlists.');
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };
  const handleRemove = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      const result = await removeSong({ bandId, songId });
      await invalidateSongQueries();
      if (result === 'deleted') {
        router.replace(getBandSectionHref(bandId, 'repertoire'));
        return;
      }

      setLifecycleNotice(
        'A música está em um show existente, então foi arquivada para preservar a setlist.',
      );
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      backHref={getBandSectionHref(bandId, 'repertoire')}
      bandId={bandId}
      currentRoute={getSongHref(bandId, songId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Editar música',
              icon: 'edit',
              label: 'Editar música',
              onPress: () =>
                isDemoBand
                  ? setDemoNotice(
                      'As músicas de demonstração são só para consulta. Selecione uma banda conectada para editar o repertório.',
                    )
                  : router.push(getSongEditHref(bandId, songId)),
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
      <SongLifecycleDialog
        errorMessage={lifecycleError}
        isSubmitting={lifecycleSubmitting}
        onArchive={handleArchive}
        onClose={closeLifecycleDialog}
        onRemove={handleRemove}
        onRestore={handleRestore}
        song={song ?? null}
        visible={lifecycleDialogVisible}
      />

      {song ? (
        <View style={styles.detail} testID={`song-detail-${layoutMode}`}>
          <Card style={styles.compactHeader}>
            <View style={styles.titleLine}>
              <View style={styles.titleCopy}>
                <AppText
                  accessibilityRole="header"
                  style={styles.songTitle}
                  variant="title"
                >
                  {song.title}
                </AppText>
                <AppText tone="muted">
                  {song.originalArtist ?? 'Artista/Banda não informado'}
                </AppText>
              </View>
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
            <View style={styles.simpleMetadata}>
              <AppText tone="muted" variant="caption">
                Tom · {song.musicalKey ?? '—'}
              </AppText>
              <AppText tone="muted" variant="caption">
                BPM · {song.bpm ?? '—'}
              </AppText>
            </View>
          </Card>

          <Card style={styles.secondaryCard}>
            {lifecycleNotice ? (
              <AppText accessibilityRole="alert" style={styles.lifecycleNotice}>
                {lifecycleNotice}
              </AppText>
            ) : null}
            {canEdit ? (
              <AppButton
                accessibilityLabel="Mais opções da música"
                icon="more"
                label="Mais opções"
                onPress={() => {
                  if (isDemoBand) {
                    setDemoNotice(
                      'As músicas de demonstração são só para consulta. Selecione uma banda conectada para administrar o repertório.',
                    );
                    return;
                  }

                  setLifecycleError(null);
                  setLifecycleDialogVisible(true);
                }}
                style={styles.lifecycleButton}
                variant="secondary"
              />
            ) : null}
            {song.notes ? (
              <View style={styles.notes}>
                <AppText accessibilityRole="header" variant="heading">
                  Observações
                </AppText>
                <AppText>{song.notes}</AppText>
              </View>
            ) : null}

            {youtubeReference ? (
              <AppButton
                accessibilityLabel="Abrir referência no YouTube"
                icon="externalLink"
                label="Abrir no YouTube"
                onPress={openYoutubeReference}
                style={styles.youtubeButton}
                variant="secondary"
              />
            ) : null}
          </Card>

          <Card style={styles.lyricCard} tone="dark">
            <View style={styles.lyricHeader}>
              <AppText
                accessibilityRole="header"
                tone="inverse"
                variant="eyebrow"
              >
                Letra
              </AppText>
              {song.lyricStatus !== 'missing' ? (
                <AppButton
                  accessibilityLabel="Abrir letra em tela cheia"
                  icon="expand"
                  label="Tela cheia"
                  onPress={() => router.push(getSongLyricsHref(bandId, songId))}
                  style={styles.fullscreenButton}
                  variant="secondary"
                />
              ) : null}
            </View>
            <SongLyricsContent lyrics={song.lyrics} />
          </Card>
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
  songTitle: {
    fontSize: 20,
    lineHeight: 34,
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
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  simpleMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  lyricCard: {
    gap: spacing.xl,
    minWidth: 0,
    width: '100%',
  },
  lyricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  fullscreenButton: {
    paddingHorizontal: spacing.md,
  },
  secondaryCard: {
    gap: spacing.lg,
    minWidth: 0,
    width: '100%',
  },
  notes: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  lifecycleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  lifecycleNotice: {
    color: colors.violetDark,
  },
  youtubeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
});
