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
  source: {
    provider: 'lrclib',
    recordId: 42,
    title: 'Canção',
    artist: 'Artista',
    album: null,
    recordingDurationMs: 180_000,
    importedAt: '2026-10-24T12:00:00.000Z',
    format: 'lrc',
  },
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

  it('preserva a origem ao adicionar, remover ou mover conteúdo', () => {
    expect(addLyricBlock(initialDocument, 'bridge').source).toEqual(
      initialDocument.source,
    );
    expect(removeLyricBlock(initialDocument, 'verse').source).toEqual(
      initialDocument.source,
    );
    expect(moveLyricBlock(initialDocument, 'chorus', 'up').source).toEqual(
      initialDocument.source,
    );
    expect(addLyricLine(initialDocument, 'verse', 'line-4').source).toEqual(
      initialDocument.source,
    );
  });

  it('remove o tempo de uma linha sincronizada quando seu texto é alterado', () => {
    const edited = updateLyricLine(
      initialDocument,
      'verse',
      'line-1',
      'Texto novo',
    );

    expect(edited.blocks[0]?.lines[0]).toEqual({
      id: 'line-1',
      text: 'Texto novo',
      startTimeMs: null,
    });
    expect(edited.source).toEqual(initialDocument.source);
  });
});
