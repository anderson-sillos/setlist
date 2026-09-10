export type EntityId = string;
export type IsoDateTime = string;

export type BandRole = 'owner' | 'editor' | 'member';

export interface Band {
  readonly id: EntityId;
  readonly name: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export interface BandMember {
  readonly id: EntityId;
  readonly bandId: EntityId;
  readonly userId: EntityId;
  readonly displayName: string;
  readonly role: BandRole;
  readonly joinedAt: IsoDateTime;
}

export interface UserBand {
  readonly band: Band;
  readonly membership: BandMember;
}

export interface LyricLine {
  readonly id: EntityId;
  readonly text: string;
  readonly startTimeMs: number | null;
}

export interface LyricBlock {
  readonly id: EntityId;
  readonly name: string | null;
  readonly lines: readonly LyricLine[];
}

export interface LyricDocument {
  readonly blocks: readonly LyricBlock[];
}

export type LyricStatus = 'missing' | 'static' | 'incomplete' | 'synchronized';

export interface Song {
  readonly id: EntityId;
  readonly bandId: EntityId;
  readonly title: string;
  readonly originalArtist: string | null;
  readonly musicalKey: string | null;
  readonly bpm: number | null;
  readonly estimatedDurationMs: number | null;
  readonly youtubeReference: string | null;
  readonly lyrics: LyricDocument;
  readonly lyricStatus: LyricStatus;
  readonly notes: string | null;
  readonly archivedAt: IsoDateTime | null;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export type ShowStatus = 'draft' | 'ready' | 'cancelled';

export interface ShowSongSetlistItem {
  readonly id: EntityId;
  readonly type: 'song';
  readonly songId: EntityId;
  readonly notes: string | null;
}

export interface ShowPlanningSetlistItem {
  readonly id: EntityId;
  readonly type: 'planning';
  readonly description: string;
  readonly estimatedDurationMs: number | null;
}

export interface ShowSeparatorSetlistItem {
  readonly id: EntityId;
  readonly type: 'separator';
}

export type ShowSetlistItem =
  ShowPlanningSetlistItem | ShowSeparatorSetlistItem | ShowSongSetlistItem;

export interface ShowSetlistBlock {
  readonly id: EntityId;
  readonly name: string;
  readonly items: readonly ShowSetlistItem[];
}

export interface Show {
  readonly id: EntityId;
  readonly bandId: EntityId;
  readonly name: string;
  readonly startsAt: IsoDateTime;
  readonly venue: string;
  readonly notes: string | null;
  readonly status: ShowStatus;
  readonly blocks: readonly ShowSetlistBlock[];
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}
