import { getShowLyricIssues } from '@/domain/showReadiness';

describe('getShowLyricIssues', () => {
  it('lista letras sem letra, estáticas e incompletas, sem bloquear sincronizadas', () => {
    const show = {
      blocks: [
        {
          id: 'block-1',
          name: 'Principal',
          items: [
            {
              id: 'item-1',
              type: 'song' as const,
              songId: 'missing',
              notes: null,
            },
            {
              id: 'item-2',
              type: 'song' as const,
              songId: 'static',
              notes: null,
            },
            {
              id: 'item-3',
              type: 'song' as const,
              songId: 'incomplete',
              notes: null,
            },
            {
              id: 'item-4',
              type: 'song' as const,
              songId: 'synced',
              notes: null,
            },
          ],
        },
      ],
    };

    const issues = getShowLyricIssues(
      show,
      new Map([
        [
          'static',
          { id: 'static', title: 'Estática', lyricStatus: 'static' as const },
        ],
        [
          'incomplete',
          {
            id: 'incomplete',
            title: 'Incompleta',
            lyricStatus: 'incomplete' as const,
          },
        ],
        [
          'synced',
          {
            id: 'synced',
            title: 'Sincronizada',
            lyricStatus: 'synchronized' as const,
          },
        ],
      ]),
    );

    expect(issues).toEqual([
      { songId: 'missing', status: 'missing', title: 'Música indisponível' },
      { songId: 'static', status: 'static', title: 'Estática' },
      { songId: 'incomplete', status: 'incomplete', title: 'Incompleta' },
    ]);
  });

  it('não repete a mesma música quando ela aparece mais de uma vez', () => {
    const show = {
      blocks: [
        {
          id: 'block-1',
          name: 'Principal',
          items: [
            {
              id: 'item-1',
              type: 'song' as const,
              songId: 'song-1',
              notes: null,
            },
            {
              id: 'item-2',
              type: 'song' as const,
              songId: 'song-1',
              notes: null,
            },
          ],
        },
      ],
    };

    expect(
      getShowLyricIssues(
        show,
        new Map([
          [
            'song-1',
            { id: 'song-1', title: 'Repetida', lyricStatus: 'static' as const },
          ],
        ]),
      ),
    ).toHaveLength(1);
  });
});
