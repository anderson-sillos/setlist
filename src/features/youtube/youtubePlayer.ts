export const YOUTUBE_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';
export const DEFAULT_YOUTUBE_REFERENCE =
  'https://www.youtube.com/watch?v=M7lc1UVf-VE';

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export type YouTubePlayerState =
  'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

export interface YouTubePlayer {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}

export interface YouTubePlayerEvent {
  readonly data: number;
  readonly target: YouTubePlayer;
}

export interface YouTubePlayerOptions {
  readonly events?: {
    readonly onError?: (event: { readonly data: number }) => void;
    readonly onReady?: (event: YouTubePlayerEvent) => void;
    readonly onStateChange?: (event: YouTubePlayerEvent) => void;
  };
  readonly height?: number | string;
  readonly playerVars?: Readonly<Record<string, number | string>>;
  readonly videoId: string;
  readonly width?: number | string;
}

export interface YouTubeApi {
  readonly Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerOptions,
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | undefined;

export function extractYouTubeVideoId(reference: string | null | undefined) {
  const value = reference?.trim() ?? '';

  if (YOUTUBE_VIDEO_ID.test(value)) {
    return value;
  }

  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#/]|$)/i,
  );

  return match?.[1] ?? null;
}

export function formatYouTubeTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function getYouTubePlayerState(state: number): YouTubePlayerState {
  switch (state) {
    case 0:
      return 'ended';
    case 1:
      return 'playing';
    case 2:
      return 'paused';
    case 3:
      return 'buffering';
    case 5:
      return 'cued';
    default:
      return 'unstarted';
  }
}

export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('A API do YouTube IFrame só está disponível no navegador.'),
    );
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const resolveApi = () => {
      try {
        previousReady?.();
      } finally {
        if (window.YT?.Player) {
          resolve(window.YT);
        } else {
          reject(new Error('A API do YouTube carregou sem expor o player.'));
        }
      }
    };

    window.onYouTubeIframeAPIReady = resolveApi;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-setlist-youtube-iframe-api]',
    );

    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Não foi possível carregar a API do YouTube.')),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.dataset.setlistYoutubeIframeApi = 'true';
    script.src = YOUTUBE_IFRAME_API_SRC;
    script.addEventListener(
      'error',
      () => reject(new Error('Não foi possível carregar a API do YouTube.')),
      {
        once: true,
      },
    );
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}
