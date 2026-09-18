import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { YouTubeMobilePlayer } from '@/features/youtube/YouTubeMobilePlayer';
import {
  DEFAULT_YOUTUBE_REFERENCE,
  extractYouTubeVideoId,
  formatYouTubeTime,
  getYouTubePlayerState,
  loadYouTubeIframeApi,
  type YouTubePlayer,
  type YouTubePlayerState,
} from '@/features/youtube/youtubePlayer';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface YouTubeIframePrototypeProps {
  readonly reference?: string | null;
}

const stateLabels: Record<YouTubePlayerState, string> = {
  buffering: 'carregando o vídeo',
  cued: 'pronto para reproduzir',
  ended: 'vídeo encerrado',
  paused: 'pausado',
  playing: 'reproduzindo',
  unstarted: 'aguardando o player',
};

export function YouTubeIframePrototype({
  reference = DEFAULT_YOUTUBE_REFERENCE,
}: YouTubeIframePrototypeProps) {
  const videoId = extractYouTubeVideoId(reference);
  const { width } = useWindowDimensions();

  return (
    <Screen testID="youtube-iframe-prototype">
      <View style={styles.header}>
        <Link href="/" replace asChild>
          <AppButton
            icon="back"
            label="Fechar protótipo"
            style={styles.closeButton}
            variant="secondary"
          />
        </Link>
        <AppText tone="accent" variant="eyebrow">
          Tarefa{' '}
          {Platform.OS === 'web'
            ? '3.1 · protótipo web'
            : '3.2 · protótipo WebView'}
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Player de referência
        </AppText>
        <AppText tone="muted">
          Um ensaio pequeno para validar reprodução, busca e leitura do tempo
          antes de levar o player para as telas de música.
        </AppText>
      </View>

      {!videoId ? (
        <Card tone="accent" testID="youtube-invalid-reference">
          <AppText variant="heading">Referência inválida</AppText>
          <AppText tone="muted">
            Informe um link do YouTube ou o identificador de um vídeo para
            continuar.
          </AppText>
        </Card>
      ) : Platform.OS !== 'web' ? (
        <YouTubeMobilePlayer videoId={videoId} viewportWidth={width} />
      ) : (
        <YouTubeWebPlayer videoId={videoId} viewportWidth={width} />
      )}
    </Screen>
  );
}

interface YouTubeWebPlayerProps {
  readonly videoId: string;
  readonly viewportWidth: number;
}

function YouTubeWebPlayer({ videoId, viewportWidth }: YouTubeWebPlayerProps) {
  const containerId = 'setlist-youtube-player';
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] =
    useState<YouTubePlayerState>('unstarted');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;

    const refreshTime = (player: YouTubePlayer) => {
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    };

    void loadYouTubeIframeApi()
      .then((youtube) => {
        if (disposed) {
          return;
        }

        const player = new youtube.Player(containerId, {
          events: {
            onError: () => {
              setError('O YouTube não conseguiu abrir este vídeo.');
            },
            onReady: ({ target }) => {
              if (disposed) {
                target.destroy();
                return;
              }

              playerRef.current = target;
              setError(null);
              setReady(true);
              setPlayerState('cued');
              refreshTime(target);
              refreshTimer = setInterval(() => refreshTime(target), 250);
            },
            onStateChange: ({ data, target }) => {
              setPlayerState(getYouTubePlayerState(data));
              refreshTime(target);
            },
          },
          height: '100%',
          playerVars: {
            enablejsapi: 1,
            playsinline: 1,
            ...(window.location?.origin
              ? { origin: window.location.origin }
              : {}),
          },
          videoId,
          width: '100%',
        });

        playerRef.current = player;
      })
      .catch((reason: unknown) => {
        if (!disposed) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar o player do YouTube.',
          );
        }
      });

    return () => {
      disposed = true;
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, videoId]);

  const seek = (offset: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const nextTime = Math.max(
      0,
      duration > 0
        ? Math.min(duration, currentTime + offset)
        : currentTime + offset,
    );
    player.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  const playerWidth = Math.min(
    Math.max(viewportWidth - spacing.xl * 2, 280),
    layout.contentMaxWidth - spacing.xl * 2,
  );

  return (
    <Card style={styles.playerCard} testID="youtube-player-card">
      <View
        nativeID={containerId}
        style={[styles.playerHost, { width: playerWidth }]}
        testID="youtube-player-host"
      />
      <View style={styles.statusRow}>
        <AppText
          accessibilityLiveRegion="polite"
          tone="muted"
          variant="caption"
        >
          Estado: {error ?? (ready ? stateLabels[playerState] : 'conectando')}
        </AppText>
        <AppText
          accessibilityLabel={`Tempo atual ${formatYouTubeTime(currentTime)} de ${formatYouTubeTime(duration)}`}
          accessibilityLiveRegion="polite"
          testID="youtube-current-time"
          variant="heading"
        >
          {formatYouTubeTime(currentTime)} / {formatYouTubeTime(duration)}
        </AppText>
      </View>
      <View style={styles.controls}>
        <AppButton
          disabled={!ready}
          label="Reproduzir"
          onPress={() => playerRef.current?.playVideo()}
          style={styles.control}
        />
        <AppButton
          disabled={!ready}
          label="Pausar"
          onPress={() => playerRef.current?.pauseVideo()}
          style={styles.control}
          variant="secondary"
        />
        <AppButton
          disabled={!ready}
          label="−10 s"
          onPress={() => seek(-10)}
          style={styles.control}
          variant="secondary"
        />
        <AppButton
          disabled={!ready}
          label="+10 s"
          onPress={() => seek(10)}
          style={styles.control}
          variant="secondary"
        />
      </View>
      <AppText tone="muted" variant="caption">
        A leitura do tempo é atualizada a cada 250 ms. O áudio continua sendo
        reproduzido exclusivamente pelo player visível do YouTube.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  playerCard: {
    gap: spacing.lg,
  },
  playerHost: {
    alignSelf: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  control: {
    flexGrow: 1,
    minWidth: 120,
  },
});
