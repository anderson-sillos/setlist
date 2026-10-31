import { getAppReleaseInfo } from '@/config/appRelease';

import type {
  LrclibFailureReason,
  LrclibRetryWait,
  LrclibTrack,
} from './types';

const API_BASE_URL = 'https://lrclib.net/api/search';
const MAX_ATTEMPTS = 5;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_DELAYS_MS = [5_000, 10_000, 15_000, 20_000] as const;

export class LrclibRequestError extends Error {
  readonly reason: LrclibFailureReason;
  readonly httpStatus?: number;
  readonly retryAfterMs?: number;
  readonly attemptCount: number;

  constructor({
    reason,
    httpStatus,
    retryAfterMs,
    attemptCount,
  }: {
    readonly reason: LrclibFailureReason;
    readonly httpStatus?: number;
    readonly retryAfterMs?: number;
    readonly attemptCount: number;
  }) {
    super('Não foi possível concluir a busca de música.');
    this.name = 'LrclibRequestError';
    this.reason = reason;
    this.httpStatus = httpStatus;
    this.retryAfterMs = retryAfterMs;
    this.attemptCount = attemptCount;
  }
}

export class LrclibRequestCancelledError extends Error {
  constructor() {
    super('Busca cancelada.');
    this.name = 'AbortError';
  }
}

export interface SearchLrclibOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
  readonly sleep?: (
    milliseconds: number,
    signal?: AbortSignal,
  ) => Promise<void>;
  readonly onAttempt?: (attempt: number, totalAttempts: number) => void;
  readonly onRetryWait?: (wait: LrclibRetryWait) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : undefined;
}

function parseTrack(value: unknown): LrclibTrack | null {
  if (!isRecord(value)) return null;

  const { id, trackName, artistName } = value;
  const albumName = optionalString(value.albumName);
  const plainLyrics = optionalString(value.plainLyrics);
  const syncedLyrics = optionalString(value.syncedLyrics);
  const instrumental = value.instrumental;
  const duration = value.duration;

  if (
    typeof id !== 'number' ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof trackName !== 'string' ||
    !trackName.trim() ||
    typeof artistName !== 'string' ||
    !artistName.trim() ||
    albumName === undefined ||
    plainLyrics === undefined ||
    syncedLyrics === undefined ||
    (instrumental !== undefined && typeof instrumental !== 'boolean') ||
    (duration !== null &&
      duration !== undefined &&
      (typeof duration !== 'number' ||
        !Number.isFinite(duration) ||
        duration <= 0))
  ) {
    return null;
  }

  const durationMs =
    typeof duration === 'number' ? Math.round(duration * 1_000) : null;

  return {
    recordId: id,
    trackName: trackName.trim(),
    artistName: artistName.trim(),
    albumName: albumName?.trim() || null,
    durationMs:
      durationMs !== null && Number.isSafeInteger(durationMs)
        ? durationMs
        : null,
    plainLyrics,
    syncedLyrics,
    instrumental: instrumental === true,
  };
}

function getRetryAfterMs(value: string | null, now: number): number | null {
  if (!value?.trim()) return null;

  const normalized = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return Math.max(0, Math.ceil(Number(normalized) * 1_000));
  }

  const retryAt = Date.parse(normalized);
  return Number.isFinite(retryAt) ? Math.max(0, retryAt - now) : null;
}

function createAbortError(): LrclibRequestCancelledError {
  return new LrclibRequestCancelledError();
}

function abortableSleep(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return Promise.reject(createAbortError());

  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(createAbortError());
    };

    signal?.addEventListener('abort', abort, { once: true });
  });
}

type TimedResponse =
  | { readonly response: Response; readonly bodyState: 'not-read' }
  | {
      readonly response: Response;
      readonly bodyState: 'valid';
      readonly payload: unknown;
    }
  | { readonly response: Response; readonly bodyState: 'invalid' };

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  headers: Readonly<Record<string, string>>,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<TimedResponse> {
  if (externalSignal?.aborted) throw createAbortError();

  const controller = new AbortController();
  let didTimeout = false;
  const abortFromCaller = () => controller.abort();
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
      reject(new LrclibRequestError({ reason: 'timeout', attemptCount: 1 }));
    }, timeoutMs);
  });
  let rejectCancelled: ((reason?: unknown) => void) | undefined;
  const cancelFromCaller = () => rejectCancelled?.(createAbortError());
  const cancelled = new Promise<never>((_, reject) => {
    rejectCancelled = reject;
    if (externalSignal) {
      externalSignal.addEventListener('abort', cancelFromCaller, {
        once: true,
      });
    }
  });

  try {
    const requestAndReadBody = fetchImpl(url, {
      credentials: 'omit',
      headers,
      method: 'GET',
      signal: controller.signal,
    }).then(async (response): Promise<TimedResponse> => {
      if (!response.ok) return { response, bodyState: 'not-read' };

      try {
        return {
          response,
          bodyState: 'valid',
          payload: await response.json(),
        };
      } catch {
        return { response, bodyState: 'invalid' };
      }
    });

    return await Promise.race([requestAndReadBody, timeout, cancelled]);
  } catch (error) {
    if (externalSignal?.aborted) throw createAbortError();
    if (didTimeout) {
      throw new LrclibRequestError({ reason: 'timeout', attemptCount: 1 });
    }
    if (error instanceof LrclibRequestError) throw error;
    throw new LrclibRequestError({ reason: 'unavailable', attemptCount: 1 });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromCaller);
    externalSignal?.removeEventListener('abort', cancelFromCaller);
  }
}

function buildHeaders(): Record<string, string> {
  const { version } = getAppReleaseInfo();
  const headers: Record<string, string> = {
    'Lrclib-Client': `Setlist/${version} (https://setlistbr.app.br)`,
  };
  const configuredAppId = process.env.EXPO_PUBLIC_LRCLIB_APP_ID?.trim();

  if (configuredAppId) {
    headers['Lrclib-App-Id'] = configuredAppId;
  }

  return headers;
}

export async function searchLrclibTracks(
  {
    title,
    artist,
  }: {
    readonly title: string;
    readonly artist?: string;
  },
  options: SearchLrclibOptions = {},
): Promise<readonly LrclibTrack[]> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return [];
  if (options.signal?.aborted) throw createAbortError();

  const url = new URL(API_BASE_URL);
  url.searchParams.set('track_name', normalizedTitle);
  const normalizedArtist = artist?.trim();
  if (normalizedArtist) url.searchParams.set('artist_name', normalizedArtist);

  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? abortableSleep;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headers = buildHeaders();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) throw createAbortError();
    options.onAttempt?.(attempt, MAX_ATTEMPTS);

    let failure: LrclibRequestError | null = null;
    try {
      const result = await fetchWithTimeout(
        fetchImpl,
        url.toString(),
        headers,
        timeoutMs,
        options.signal,
      );
      const { response } = result;

      if (!response.ok) {
        const retryAfterMs = getRetryAfterMs(
          response.headers.get('Retry-After'),
          now(),
        );
        failure = new LrclibRequestError({
          reason: response.status === 429 ? 'rate-limited' : 'unavailable',
          httpStatus: response.status,
          ...(retryAfterMs !== null ? { retryAfterMs } : {}),
          attemptCount: attempt,
        });
      } else if (result.bodyState === 'invalid') {
        failure = new LrclibRequestError({
          reason: 'invalid-response',
          httpStatus: response.status,
          attemptCount: attempt,
        });
      } else {
        if (result.bodyState !== 'valid' || !Array.isArray(result.payload)) {
          failure = new LrclibRequestError({
            reason: 'invalid-response',
            httpStatus: response.status,
            attemptCount: attempt,
          });
        } else if (result.payload.length === 0) {
          return [];
        } else {
          const candidates = result.payload
            .map(parseTrack)
            .filter((track) => track !== null);
          if (candidates.length === 0) {
            failure = new LrclibRequestError({
              reason: 'invalid-response',
              httpStatus: response.status,
              attemptCount: attempt,
            });
          } else {
            return candidates;
          }
        }
      }
    } catch (error) {
      if (error instanceof LrclibRequestCancelledError) throw error;
      if (error instanceof LrclibRequestError) {
        failure = new LrclibRequestError({
          reason: error.reason,
          httpStatus: error.httpStatus,
          retryAfterMs: error.retryAfterMs,
          attemptCount: attempt,
        });
      } else {
        failure = new LrclibRequestError({
          reason: 'unavailable',
          attemptCount: attempt,
        });
      }
    }

    const attemptFailure =
      failure ??
      new LrclibRequestError({ reason: 'unavailable', attemptCount: attempt });
    if (attempt === MAX_ATTEMPTS) throw attemptFailure;

    const waitMs =
      attemptFailure.retryAfterMs ?? DEFAULT_RETRY_DELAYS_MS[attempt - 1]!;
    const retryAt = now() + waitMs;
    options.onRetryWait?.({
      nextAttempt: attempt + 1,
      totalAttempts: MAX_ATTEMPTS,
      retryAt,
      reason: attemptFailure.reason,
      ...(attemptFailure.httpStatus !== undefined
        ? { httpStatus: attemptFailure.httpStatus }
        : {}),
    });
    try {
      await sleep(waitMs, options.signal);
    } catch {
      if (options.signal?.aborted) throw createAbortError();
      throw new LrclibRequestError({
        reason: 'unavailable',
        httpStatus: attemptFailure.httpStatus,
        attemptCount: attempt,
      });
    }
  }

  throw new LrclibRequestError({
    reason: 'unavailable',
    attemptCount: MAX_ATTEMPTS,
  });
}
