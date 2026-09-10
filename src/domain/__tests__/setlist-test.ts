import type { ShowSetlistBlock } from '@/domain';
import { moveSetlistItem, reorderSetlistBlocks } from '@/domain';

const blocks: readonly ShowSetlistBlock[] = [
  {
    id: 'block-1',
    name: 'Primeiro Set',
    items: [
      { id: 'song-1', type: 'song', songId: 'song-a', notes: null },
      {
        id: 'planning-1',
        type: 'planning',
        description: 'Troca de instrumento',
        estimatedDurationMs: 90_000,
      },
      { id: 'separator-1', type: 'separator' },
    ],
  },
  {
    id: 'block-2',
    name: 'Segundo Set',
    items: [{ id: 'song-2', type: 'song', songId: 'song-b', notes: null }],
  },
];

describe('organização local da setlist', () => {
  it('reordena blocos sem alterar a coleção original', () => {
    const reordered = reorderSetlistBlocks(blocks, 0, 1);

    expect(reordered.map(({ id }) => id)).toEqual(['block-2', 'block-1']);
    expect(blocks.map(({ id }) => id)).toEqual(['block-1', 'block-2']);
  });

  it('move qualquer tipo de item entre blocos e preserva o id', () => {
    const moved = moveSetlistItem(blocks, {
      itemId: 'planning-1',
      sourceBlockId: 'block-1',
      targetBlockId: 'block-2',
      targetIndex: 0,
    });

    expect(moved[0]?.items.map(({ id }) => id)).toEqual([
      'song-1',
      'separator-1',
    ]);
    expect(moved[1]?.items.map(({ id }) => id)).toEqual([
      'planning-1',
      'song-2',
    ]);
    expect(blocks[0]?.items.map(({ id }) => id)).toEqual([
      'song-1',
      'planning-1',
      'separator-1',
    ]);
  });

  it('reordena itens dentro do mesmo bloco e limita o destino', () => {
    const moved = moveSetlistItem(blocks, {
      itemId: 'song-1',
      sourceBlockId: 'block-1',
      targetBlockId: 'block-1',
      targetIndex: 99,
    });

    expect(moved[0]?.items.map(({ id }) => id)).toEqual([
      'planning-1',
      'separator-1',
      'song-1',
    ]);
  });

  it('mantém a coleção quando a origem ou o destino não existe', () => {
    expect(reorderSetlistBlocks(blocks, -1, 1)).toBe(blocks);
    expect(reorderSetlistBlocks(blocks, 0, 0)).toBe(blocks);
    expect(
      moveSetlistItem(blocks, {
        itemId: 'unknown',
        sourceBlockId: 'block-1',
        targetBlockId: 'block-2',
        targetIndex: 0,
      }),
    ).toBe(blocks);
    expect(
      moveSetlistItem(blocks, {
        itemId: 'song-1',
        sourceBlockId: 'block-1',
        targetBlockId: 'unknown',
        targetIndex: 0,
      }),
    ).toBe(blocks);
  });
});
