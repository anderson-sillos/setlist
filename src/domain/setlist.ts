import type { EntityId, ShowSetlistBlock } from '@/domain/entities';

interface MoveSetlistItemInput {
  readonly itemId: EntityId;
  readonly sourceBlockId: EntityId;
  readonly targetBlockId: EntityId;
  readonly targetIndex: number;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

export function reorderSetlistBlocks(
  blocks: readonly ShowSetlistBlock[],
  sourceIndex: number,
  targetIndex: number,
): readonly ShowSetlistBlock[] {
  if (
    sourceIndex < 0 ||
    sourceIndex >= blocks.length ||
    targetIndex < 0 ||
    targetIndex >= blocks.length ||
    sourceIndex === targetIndex
  ) {
    return blocks;
  }

  const reordered = [...blocks];
  const [block] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, block);
  return reordered;
}

export function moveSetlistItem(
  blocks: readonly ShowSetlistBlock[],
  input: MoveSetlistItemInput,
): readonly ShowSetlistBlock[] {
  const sourceBlockIndex = blocks.findIndex(
    (block) => block.id === input.sourceBlockId,
  );
  const targetBlockIndex = blocks.findIndex(
    (block) => block.id === input.targetBlockId,
  );

  if (sourceBlockIndex < 0 || targetBlockIndex < 0) {
    return blocks;
  }

  const sourceItemIndex = blocks[sourceBlockIndex].items.findIndex(
    (item) => item.id === input.itemId,
  );

  if (sourceItemIndex < 0) {
    return blocks;
  }

  const nextBlocks = blocks.map((block) => ({
    ...block,
    items: [...block.items],
  }));
  const sourceItems = nextBlocks[sourceBlockIndex].items;
  const [item] = sourceItems.splice(sourceItemIndex, 1);
  const targetItems = nextBlocks[targetBlockIndex].items;
  const insertionIndex = clampIndex(input.targetIndex, targetItems.length);
  targetItems.splice(insertionIndex, 0, item);

  return nextBlocks;
}
