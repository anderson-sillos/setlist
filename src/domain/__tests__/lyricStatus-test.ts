import type { LyricDocument } from '@/domain';
import { deriveLyricStatus } from '@/domain/lyricStatus';

describe('estado derivado da letra', () => {
  it('classifica documento vazio ou sem linhas preenchidas como sem letra', () => {
    expect(deriveLyricStatus({ blocks: [] })).toBe('missing');
    expect(
      deriveLyricStatus({
        blocks: [
          {
            id: 'block',
            name: null,
            lines: [{ id: 'line', text: '  ', startTimeMs: null }],
          },
        ],
      }),
    ).toBe('missing');
  });

  it('classifica letra estática, incompleta e sincronizada pela ordem', () => {
    const block = (lines: LyricDocument['blocks'][number]['lines']) => ({
      blocks: [{ id: 'block', name: null, lines }],
    });

    expect(
      deriveLyricStatus(
        block([{ id: 'line-1', text: 'Verso', startTimeMs: null }]),
      ),
    ).toBe('static');
    expect(
      deriveLyricStatus(
        block([
          { id: 'line-1', text: 'Verso', startTimeMs: 2000 },
          { id: 'line-2', text: 'Refrão', startTimeMs: null },
        ]),
      ),
    ).toBe('incomplete');
    expect(
      deriveLyricStatus(
        block([
          { id: 'line-1', text: 'Verso', startTimeMs: 1000 },
          { id: 'line-2', text: 'Refrão', startTimeMs: 2000 },
        ]),
      ),
    ).toBe('synchronized');
    expect(
      deriveLyricStatus(
        block([
          { id: 'line-1', text: 'Verso', startTimeMs: 2000 },
          { id: 'line-2', text: 'Refrão', startTimeMs: 1000 },
        ]),
      ),
    ).toBe('incomplete');
  });
});
