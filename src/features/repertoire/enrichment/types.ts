import type { LrclibFailureReason } from '@/data/lrclib/types';

/** Metadados consumidos da busca; lyrics são mantidas apenas no fluxo local. */
export interface EnrichmentCandidate {
  readonly recordId: number;
  readonly title: string;
  readonly artist: string;
  readonly album: string | null;
  readonly durationMs: number | null;
  readonly plainLyrics: string | null;
  readonly syncedLyrics: string | null;
  readonly instrumental?: boolean;
}

export type EnrichmentDurationDecision =
  'use-recording-duration-and-sync' | 'keep-current-duration-and-import-static';

export type EnrichmentOperationState =
  | { readonly status: 'idle' }
  | { readonly status: 'preparing' }
  | {
      readonly status: 'searching';
      readonly attempt: number;
      readonly total: number;
    }
  | {
      readonly status: 'retry-wait';
      readonly attempt: number;
      readonly total: number;
      readonly retryAt: number;
      readonly reason: LrclibFailureReason;
      readonly httpStatus?: number;
      readonly retryAfterMs?: number;
    }
  | { readonly status: 'ranking' }
  | {
      readonly status: 'selecting';
      readonly candidates: readonly EnrichmentCandidate[];
    }
  | {
      readonly status: 'duration-choice';
      readonly candidate: EnrichmentCandidate;
      readonly currentDurationMs: number;
      readonly recordingDurationMs: number;
    }
  | { readonly status: 'validating' }
  | { readonly status: 'applying' }
  | { readonly status: 'completed'; readonly summary: string }
  | { readonly status: 'empty' }
  | {
      readonly status: 'failed';
      readonly reason: LrclibFailureReason;
      readonly httpStatus?: number;
      readonly retryAt?: number;
    };
