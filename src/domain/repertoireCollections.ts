export type RepertoireCollectionErrorCode =
  | 'invalid_input'
  | 'invalid_name'
  | 'duplicate_name'
  | 'not_found'
  | 'stale_revision'
  | 'unavailable_song'
  | 'permission_denied'
  | 'request_failed';

export class RepertoireCollectionError extends Error {
  readonly code: RepertoireCollectionErrorCode;

  constructor(code: RepertoireCollectionErrorCode, message: string) {
    super(message);
    this.name = 'RepertoireCollectionError';
    this.code = code;
  }
}
