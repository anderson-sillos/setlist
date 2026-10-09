import type { EntityId } from '@/domain';

export interface CollectionSongLayout {
  readonly height: number;
  readonly songId: EntityId;
  readonly y: number;
}

export function moveCollectionSong(
  orderedSongIds: readonly EntityId[],
  songId: EntityId,
  targetIndex: number,
): readonly EntityId[] {
  const sourceIndex = orderedSongIds.indexOf(songId);
  if (
    sourceIndex < 0 ||
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= orderedSongIds.length ||
    sourceIndex === targetIndex
  ) {
    return orderedSongIds;
  }

  const next = [...orderedSongIds];
  next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, songId);
  return next;
}

export function getCollectionSongInsertionIndex(
  layouts: readonly CollectionSongLayout[],
  draggedSongId: EntityId,
  targetCenterY: number,
): number {
  const remaining = layouts
    .filter(({ songId }) => songId !== draggedSongId)
    .sort((left, right) => left.y - right.y);
  const target = remaining.findIndex(
    ({ height, y }) => targetCenterY < y + height / 2,
  );

  return target < 0 ? remaining.length : target;
}
