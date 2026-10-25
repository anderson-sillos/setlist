import type { LyricDocument } from '@/domain';
import {
  lyricDocumentToText,
  parseLyricText,
} from '@/features/repertoire/lyricEditorText';

describe('texto da letra estruturada', () => {
  it('serializa blocos e linhas vazias com a sintaxe documentada', () => {
    const document: LyricDocument = {
      blocks: [
        {
          id: 'verse',
          name: 'Verso',
          lines: [
            { id: 'line-1', text: 'Primeira', startTimeMs: null },
            { id: 'line-2', text: '', startTimeMs: null },
          ],
        },
      ],
    };

    expect(lyricDocumentToText(document)).toBe('# Verso\nPrimeira\n---');
  });

  it('usa um bloco padrão quando a letra não informa cabeçalho', () => {
    expect(parseLyricText('Primeira\nSegunda', { blocks: [] })).toMatchObject({
      blocks: [
        {
          name: null,
          lines: [
            { text: 'Primeira', startTimeMs: null },
            { text: 'Segunda', startTimeMs: null },
          ],
        },
      ],
    });
  });

  it('ignora linhas vazias acidentais e preserva somente o marcador explícito', () => {
    expect(
      parseLyricText('# Refrão\n\nUma linha\n---\nOutra linha', {
        blocks: [],
      }),
    ).toMatchObject({
      blocks: [
        {
          name: 'Refrão',
          lines: [{ text: 'Uma linha' }, { text: '' }, { text: 'Outra linha' }],
        },
      ],
    });
  });

  it('serializa e interpreta destaque em negrito e linhas de separação', () => {
    const document: LyricDocument = {
      blocks: [
        {
          id: 'verse',
          name: 'Verso',
          lines: [
            {
              bold: true,
              id: 'line-1',
              startTimeMs: null,
              text: 'Linha importante',
            },
            {
              id: 'separator-1',
              kind: 'separator',
              startTimeMs: null,
              text: '',
            },
          ],
        },
      ],
    };

    const serialized = lyricDocumentToText(document);

    expect(serialized).toBe('# Verso\n**Linha importante**\n***');
    expect(parseLyricText(serialized, { blocks: [] })).toMatchObject({
      blocks: [
        {
          lines: [
            { bold: true, text: 'Linha importante' },
            { kind: 'separator', text: '' },
          ],
        },
      ],
    });
  });

  it('preserva a origem, mas remove o tempo quando o texto da linha mudou', () => {
    const imported: LyricDocument = {
      blocks: [
        {
          id: 'imported-block',
          name: null,
          lines: [
            { id: 'timed-line', text: 'Texto original', startTimeMs: 12_000 },
          ],
        },
      ],
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
    };

    const unchanged = parseLyricText(lyricDocumentToText(imported), imported);
    expect(unchanged.blocks[0]?.lines[0]).toEqual({
      id: 'timed-line',
      text: 'Texto original',
      startTimeMs: 12_000,
    });
    expect(unchanged.source).toEqual(imported.source);

    const changed = parseLyricText('#\nOutro texto', imported);
    expect(changed.blocks[0]?.lines[0]?.text).toBe('Outro texto');
    expect(changed.blocks[0]?.lines[0]?.startTimeMs).toBeNull();
    expect(changed.blocks[0]?.lines[0]?.id).not.toBe('timed-line');
    expect(changed.source).toEqual(imported.source);
  });
});
