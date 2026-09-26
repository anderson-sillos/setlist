import type { EntityId, LyricStatus, Show, Song } from '@/domain/entities';

export type ShowLyricIssueStatus = Exclude<LyricStatus, 'synchronized'>;

export interface ShowLyricIssue {
  readonly songId: EntityId;
  readonly status: ShowLyricIssueStatus;
  readonly title: string;
}

type ShowReadinessData = Pick<Show, 'blocks'>;
type SongReadinessData = Pick<Song, 'id' | 'lyricStatus' | 'title'>;

/**
 * Finds lyric statuses that deserve attention before a show is marked Ready.
 * The result is intentionally advisory: callers may still confirm the status.
 */
export function getShowLyricIssues(
  show: ShowReadinessData,
  songsById: ReadonlyMap<EntityId, SongReadinessData>,
): readonly ShowLyricIssue[] {
  const seenSongIds = new Set<EntityId>();
  const issues: ShowLyricIssue[] = [];

  for (const block of show.blocks) {
    for (const item of block.items) {
      if (item.type !== 'song' || seenSongIds.has(item.songId)) continue;

      seenSongIds.add(item.songId);
      const song = songsById.get(item.songId);
      const status = song?.lyricStatus ?? 'missing';

      if (status !== 'synchronized') {
        issues.push({
          songId: item.songId,
          status,
          title: song?.title ?? 'Música indisponível',
        });
      }
    }
  }

  return issues;
}
