import type { LyricBlock, LyricDocument, LyricLine } from '@/domain';

export type LyricMoveDirection = 'up' | 'down';

function moveItem<T>(
  items: readonly T[],
  itemIndex: number,
  direction: LyricMoveDirection,
): readonly T[] {
  const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;

  if (
    itemIndex < 0 ||
    itemIndex >= items.length ||
    targetIndex < 0 ||
    targetIndex >= items.length
  ) {
    return items;
  }

  const reordered = [...items];
  [reordered[itemIndex], reordered[targetIndex]] = [
    reordered[targetIndex]!,
    reordered[itemIndex]!,
  ];

  return reordered;
}

function updateBlock(
  document: LyricDocument,
  blockId: string,
  update: (block: LyricBlock) => LyricBlock,
): LyricDocument {
  return {
    blocks: document.blocks.map((block) =>
      block.id === blockId ? update(block) : block,
    ),
  };
}

export function addLyricBlock(
  document: LyricDocument,
  blockId: string,
): LyricDocument {
  return {
    blocks: [...document.blocks, { id: blockId, name: null, lines: [] }],
  };
}

export function removeLyricBlock(
  document: LyricDocument,
  blockId: string,
): LyricDocument {
  return {
    blocks: document.blocks.filter((block) => block.id !== blockId),
  };
}

export function renameLyricBlock(
  document: LyricDocument,
  blockId: string,
  name: string,
): LyricDocument {
  const normalizedName = name.trim() || null;

  return updateBlock(document, blockId, (block) => ({
    ...block,
    name: normalizedName,
  }));
}

export function moveLyricBlock(
  document: LyricDocument,
  blockId: string,
  direction: LyricMoveDirection,
): LyricDocument {
  const itemIndex = document.blocks.findIndex((block) => block.id === blockId);

  return { blocks: moveItem(document.blocks, itemIndex, direction) };
}

export function addLyricLine(
  document: LyricDocument,
  blockId: string,
  lineId: string,
): LyricDocument {
  const newLine: LyricLine = { id: lineId, startTimeMs: null, text: '' };

  return updateBlock(document, blockId, (block) => ({
    ...block,
    lines: [...block.lines, newLine],
  }));
}

export function updateLyricLine(
  document: LyricDocument,
  blockId: string,
  lineId: string,
  text: string,
): LyricDocument {
  return updateBlock(document, blockId, (block) => ({
    ...block,
    lines: block.lines.map((line) =>
      line.id === lineId ? { ...line, text } : line,
    ),
  }));
}

export function removeLyricLine(
  document: LyricDocument,
  blockId: string,
  lineId: string,
): LyricDocument {
  return updateBlock(document, blockId, (block) => ({
    ...block,
    lines: block.lines.filter((line) => line.id !== lineId),
  }));
}

export function moveLyricLine(
  document: LyricDocument,
  blockId: string,
  lineId: string,
  direction: LyricMoveDirection,
): LyricDocument {
  return updateBlock(document, blockId, (block) => {
    const itemIndex = block.lines.findIndex((line) => line.id === lineId);

    return { ...block, lines: moveItem(block.lines, itemIndex, direction) };
  });
}
