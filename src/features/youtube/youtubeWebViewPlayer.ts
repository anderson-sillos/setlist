import type { YouTubePlayerState } from '@/features/youtube/youtubePlayer';

/**
 * Canonical origin used by the inline document and the YouTube API. Replace
 * it with the production web origin before distributing the native app.
 */
export const YOUTUBE_WEBVIEW_ORIGIN = 'https://setlist.app';

export type YouTubeWebViewCommand =
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'seek'; readonly seconds: number };

export type YouTubeWebViewMessage =
  | {
      readonly type: 'ready';
      readonly state: YouTubePlayerState;
      readonly currentTime: number;
      readonly duration: number;
    }
  | {
      readonly type: 'time';
      readonly currentTime: number;
      readonly duration: number;
    }
  | {
      readonly type: 'state';
      readonly state: YouTubePlayerState;
      readonly currentTime: number;
      readonly duration: number;
    }
  | { readonly type: 'error'; readonly code: number };

const playerStates: YouTubePlayerState[] = [
  'unstarted',
  'ended',
  'playing',
  'paused',
  'buffering',
  'cued',
];

function isPlayerState(value: unknown): value is YouTubePlayerState {
  return (
    typeof value === 'string' &&
    playerStates.includes(value as YouTubePlayerState)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseTime(value: unknown) {
  return isFiniteNumber(value) ? Math.max(0, value) : 0;
}

function parseMessageValue(value: unknown): YouTubeWebViewMessage | null {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return null;
  }

  const message = value as Record<string, unknown>;

  if (message.type === 'error' && isFiniteNumber(message.code)) {
    return { code: message.code, type: 'error' };
  }

  const currentTime = parseTime(message.currentTime);
  const duration = parseTime(message.duration);

  if (
    (message.type === 'ready' || message.type === 'state') &&
    isPlayerState(message.state)
  ) {
    return {
      currentTime,
      duration,
      state: message.state,
      type: message.type,
    };
  }

  if (message.type === 'time') {
    return { currentTime, duration, type: 'time' };
  }

  return null;
}

export function parseYouTubeWebViewMessage(
  rawMessage: string,
): YouTubeWebViewMessage | null {
  try {
    return parseMessageValue(JSON.parse(rawMessage) as unknown);
  } catch {
    return null;
  }
}

export function buildYouTubeWebViewCommand(command: YouTubeWebViewCommand) {
  const serializedCommand = JSON.stringify(command);

  return `if (window.__setlistYouTubeCommand) { window.__setlistYouTubeCommand(${serializedCommand}); } true;`;
}

export function createYouTubeWebViewHtml(
  videoId: string,
  origin = YOUTUBE_WEBVIEW_ORIGIN,
) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body, #player { width: 100%; height: 100%; margin: 0; background: #101827; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script>
      (function () {
        var player;
        var timer;
        var stateNames = { '-1': 'unstarted', '0': 'ended', '1': 'playing', '2': 'paused', '3': 'buffering', '5': 'cued' };

        function send(message) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }

        function snapshot(type) {
          return {
            type: type,
            currentTime: player ? player.getCurrentTime() || 0 : 0,
            duration: player ? player.getDuration() || 0 : 0
          };
        }

        function sendTime() {
          send(snapshot('time'));
        }

        window.__setlistYouTubeCommand = function (command) {
          if (!player || !command) return;
          if (command.type === 'play') player.playVideo();
          if (command.type === 'pause') player.pauseVideo();
          if (command.type === 'seek') player.seekTo(command.seconds || 0, true);
        };

        window.onYouTubeIframeAPIReady = function () {
          player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: ${JSON.stringify(videoId)},
            playerVars: {
              enablejsapi: 1,
              origin: ${JSON.stringify(origin)},
              playsinline: 1,
              rel: 0
            },
            events: {
              onReady: function () {
                var message = snapshot('ready');
                message.state = 'cued';
                send(message);
                sendTime();
                timer = window.setInterval(sendTime, 250);
              },
              onStateChange: function (event) {
                var message = snapshot('state');
                message.state = stateNames[String(event.data)] || 'unstarted';
                send(message);
              },
              onError: function (event) {
                send({ type: 'error', code: event.data });
              }
            }
          });
        };

        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);

        window.addEventListener('beforeunload', function () {
          if (timer) window.clearInterval(timer);
          if (player) player.destroy();
        });
      })();
    </script>
  </body>
</html>`;
}
