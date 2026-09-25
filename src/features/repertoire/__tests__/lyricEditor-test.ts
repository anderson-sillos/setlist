import type { LyricDocument } from '@/domain';
import {
  addLyricBlock,
  addLyricLine,
  moveLyricBlock,
  moveLyricLine,
  removeLyricBlock,
  removeLyricLine,
  renameLyricBlock,
  updateLyricLine,
} from '@/features/repertoire/lyricEditor';

const initialDocument: LyricDocument = {
  blocks: [
    {
      id: 'verse',
      name: 'Verso',
      lines: [
        { id: 'line-1', text: 'Primeira', startTimeMs: 1000 },
        { id: 'line-2', text: 'Segunda', startTimeMs: 2000 },
      ],
    },
    {
      id: 'chorus',
      name: 'Refrão',
      lines: [{ id: 'line-3', text: 'Refrão', startTimeMs: 3000 }],
    },
  ],
};

describe('edição estrutural da letra', () => {
  it('adiciona e remove blocos e linhas sem alterar os demais identificadores', () => {
    const withBlock = addLyricBlock(initialDocument, 'bridge');
    const withLine = addLyricLine(withBlock, 'bridge', 'line-4');
    const editedLine = updateLyricLine(
      withLine,
      'bridge',
      'line-4',
      'Ponte nova',
    );

    expect(editedLine.blocks[2]).toEqual({
      id: 'bridge',
      name: null,
      lines: [{ id: 'line-4', text: 'Ponte nova', startTimeMs: null }],
    });
    expect(
      removeLyricLine(editedLine, 'bridge', 'line-4').blocks[2]?.lines,
    ).toHaveLength(0);
    expect(removeLyricBlock(editedLine, 'bridge').blocks).toHaveLength(2);
  });

  it('renomeia e reordena blocos e linhas preservando identidade e tempo', () => {
    const renamed = renameLyricBlock(initialDocument, 'verse', '  Estrofe 1 ');
    const movedBlock = moveLyricBlock(renamed, 'chorus', 'up');
    const movedLine = moveLyricLine(movedBlock, 'verse', 'line-2', 'up');

    expect(movedLine.blocks.map(({ id }) => id)).toEqual(['chorus', 'verse']);
    expect(movedLine.blocks[1]).toEqual({
      id: 'verse',
      name: 'Estrofe 1',
      lines: [
        { id: 'line-2', text: 'Segunda', startTimeMs: 2000 },
        { id: 'line-1', text: 'Primeira', startTimeMs: 1000 },
      ],
    });
  });

  it('mantém a ordem quando o movimento alcança o limite do bloco', () => {
    expect(moveLyricLine(initialDocument, 'verse', 'line-1', 'up')).toEqual(
      initialDocument,
    );
    expect(moveLyricBlock(initialDocument, 'chorus', 'down')).toEqual(
      initialDocument,
    );
  });
});
