import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import {
  buildYouTubeWebViewCommand,
  createYouTubeWebViewHtml,
  parseYouTubeWebViewMessage,
  YOUTUBE_WEBVIEW_ORIGIN,
  type YouTubeWebViewCommand,
} from '@/features/youtube/youtubeMobilePlayer';
import {
  formatYouTubeTime,
  type YouTubePlayerState,
} from '@/features/youtube/youtubePlayer';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface YouTubeMobilePlayerProps {
  readonly videoId: string;
  readonly viewportWidth: number;
}

const stateLabels: Record<YouTubePlayerState, string> = {
  buffering: 'carregando o vídeo',
  cued: 'pronto para reproduzir',
  ended: 'vídeo encerrado',
  paused: 'pausado',
  playing: 'reproduzindo',
  unstarted: 'aguardando o player',
};

export function YouTubeMobilePlayer({
  videoId,
  viewportWidth,
}: YouTubeMobilePlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] =
    useState<YouTubePlayerState>('unstarted');
  const [ready, setReady] = useState(false);
  const [playerWidth, setPlayerWidth] = useState(
    Math.min(
      Math.max(viewportWidth - spacing.xl * 2, 280),
      layout.contentMaxWidth - spacing.xl * 2,
    ),
  );
  const html = useMemo(() => createYouTubeWebViewHtml(videoId), [videoId]);

  const handlePlayerLayout = useCallback((event: LayoutChangeEvent) => {
    setPlayerWidth(event.nativeEvent.layout.width);
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    const message = parseYouTubeWebViewMessage(event.nativeEvent.data);

    if (!message) {
      return;
    }

    if (message.type === 'error') {
      setError(
        message.code === 101 || message.code === 150
          ? 'Este vídeo não permite reprodução incorporada.'
          : 'O YouTube não conseguiu abrir este vídeo.',
      );
      setReady(false);
      return;
    }

    setError(null);
    setCurrentTime(message.currentTime);
    setDuration(message.duration);

    if (message.type === 'ready') {
      setReady(true);
      setPlayerState(message.state);
    }

    if (message.type === 'state') {
      setPlayerState(message.state);
    }
  }, []);

  const sendCommand = useCallback((command: YouTubeWebViewCommand) => {
    webViewRef.current?.injectJavaScript(buildYouTubeWebViewCommand(command));
  }, []);

  const seek = useCallback(
    (offset: number) => {
      const nextTime = Math.max(
        0,
        duration > 0
          ? Math.min(duration, currentTime + offset)
          : currentTime + offset,
      );
      setCurrentTime(nextTime);
      sendCommand({ seconds: nextTime, type: 'seek' });
    },
    [currentTime, duration, sendCommand],
  );

  return (
    <Card style={styles.playerCard} testID="youtube-mobile-player-card">
      <View
        onLayout={handlePlayerLayout}
        style={[styles.playerHost, { width: playerWidth }]}
        testID="youtube-mobile-player-host"
      >
        <WebView
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          domStorageEnabled
          javaScriptEnabled
          mediaPlaybackRequiresUserAction
          onError={() => {
            setError('Não foi possível carregar o player do YouTube.');
            setReady(false);
          }}
          onHttpError={() => {
            setError('O YouTube não respondeu ao carregar este vídeo.');
            setReady(false);
          }}
          onMessage={handleMessage}
          originWhitelist={['*']}
          ref={webViewRef}
          source={{ baseUrl: YOUTUBE_WEBVIEW_ORIGIN, html }}
          startInLoadingState
          style={styles.webView}
          testID="youtube-mobile-webview"
        />
      </View>
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
          testID="youtube-mobile-current-time"
          variant="heading"
        >
          {formatYouTubeTime(currentTime)} / {formatYouTubeTime(duration)}
        </AppText>
      </View>
      <View style={styles.controls}>
        <AppButton
          disabled={!ready}
          label="Reproduzir"
          onPress={() => sendCommand({ type: 'play' })}
          style={styles.control}
        />
        <AppButton
          disabled={!ready}
          label="Pausar"
          onPress={() => sendCommand({ type: 'pause' })}
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
        Player visível do YouTube em WebView. O tempo chega ao app pela ponte
        JavaScript e não há download ou reprodução em segundo plano.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  control: {
    flexGrow: 1,
    minWidth: 120,
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
  webView: {
    backgroundColor: colors.navy,
    flex: 1,
  },
});
