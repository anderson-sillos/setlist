export interface LrclibTrack {
  readonly recordId: number;
  readonly trackName: string;
  readonly artistName: string;
  readonly albumName: string | null;
  readonly durationMs: number | null;
  readonly plainLyrics: string | null;
  readonly syncedLyrics: string | null;
  readonly instrumental?: boolean;
}

export type LrclibFailureReason =
  'timeout' | 'invalid-response' | 'rate-limited' | 'unavailable';

export interface LrclibRetryWait {
  readonly nextAttempt: number;
  readonly totalAttempts: number;
  readonly retryAt: number;
  readonly reason: LrclibFailureReason;
  readonly httpStatus?: number;
}
