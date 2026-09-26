import { getSupabaseClient } from '@/data/supabase/client';
import { replaceShowBlockItems } from '@/data/supabase/showSetlistMutations';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('mutações de itens da setlist', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('substitui itens preservando a ordem e os payloads específicos', async () => {
    const deleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    const insertQuery = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    from.mockReturnValueOnce(deleteQuery).mockReturnValueOnce(insertQuery);

    await expect(
      replaceShowBlockItems({
        blockId: 'block-1',
        items: [
          {
            id: 'song-item',
            notes: 'Entrar no refrão',
            songId: 'song-1',
            type: 'song',
          },
          {
            description: 'Troca de instrumento',
            estimatedDurationMs: 90_000,
            id: 'planning-item',
            type: 'planning',
          },
          { id: 'separator-item', type: 'separator' },
        ],
      }),
    ).resolves.toBeUndefined();

    expect(deleteQuery.eq).toHaveBeenCalledWith('block_id', 'block-1');
    expect(insertQuery.insert).toHaveBeenCalledWith([
      {
        block_id: 'block-1',
        item_type: 'song',
        notes: 'Entrar no refrão',
        position: 0,
        song_id: 'song-1',
      },
      {
        block_id: 'block-1',
        description: 'Troca de instrumento',
        estimated_duration_ms: 90_000,
        item_type: 'planning',
        position: 1,
      },
      {
        block_id: 'block-1',
        item_type: 'separator',
        position: 2,
      },
    ]);
  });

  it('remove os itens sem inserir quando o bloco fica vazio', async () => {
    const deleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    from.mockReturnValue(deleteQuery);

    await expect(
      replaceShowBlockItems({ blockId: 'block-1', items: [] }),
    ).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledTimes(1);
  });
});

describe('falhas e validações de itens da setlist', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  const deleteQuery = (error: unknown = null) => ({
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error }),
  });

  it.each([
    [{ code: '42501', message: 'denied' }, 'permission_denied'],
    [{ message: 'JWT expired' }, 'permission_denied'],
    [{ message: 'row-level security violation' }, 'permission_denied'],
    [{ message: 'permission denied' }, 'permission_denied'],
    [{ message: 'SHOW_NOT_EDITABLE' }, 'permission_denied'],
    [{ message: 'SONG_BAND_MISMATCH' }, 'permission_denied'],
    [{ message: 'database offline' }, 'request_failed'],
  ] as const)('traduz falha ao substituir itens: %j', async (error, code) => {
    from.mockReturnValue(deleteQuery(error));

    await expect(
      replaceShowBlockItems({
        blockId: 'block-1',
        items: [{ id: 'separator', type: 'separator' }],
      }),
    ).rejects.toMatchObject({ code });
  });

  it.each([-1, 1.5])(
    'rejeita duração de planejamento inválida: %s',
    async (duration) => {
      from.mockReturnValue(deleteQuery());

      await expect(
        replaceShowBlockItems({
          blockId: 'block-1',
          items: [
            {
              description: 'Pausa',
              estimatedDurationMs: duration,
              id: 'planning-1',
              type: 'planning',
            },
          ],
        }),
      ).rejects.toMatchObject({ code: 'invalid_show' });
    },
  );

  it.each([' ', 'p'.repeat(241)])(
    'rejeita anotação inválida',
    async (description) => {
      from.mockReturnValue(deleteQuery());

      await expect(
        replaceShowBlockItems({
          blockId: 'block-1',
          items: [
            {
              description,
              estimatedDurationMs: null,
              id: 'planning-1',
              type: 'planning',
            },
          ],
        }),
      ).rejects.toMatchObject({ code: 'invalid_show' });
    },
  );

  it('normaliza observações vazias e aceita duração zero', async () => {
    const deletion = deleteQuery();
    const insertion = { insert: jest.fn().mockResolvedValue({ error: null }) };
    from.mockReturnValueOnce(deletion).mockReturnValueOnce(insertion);

    await expect(
      replaceShowBlockItems({
        blockId: 'block-1',
        items: [
          { id: 'song-1', notes: '   ', songId: 'song-1', type: 'song' },
          {
            description: 'Pausa curta',
            estimatedDurationMs: 0,
            id: 'planning-1',
            type: 'planning',
          },
        ],
      }),
    ).resolves.toBeUndefined();

    expect(insertion.insert).toHaveBeenCalledWith([
      {
        block_id: 'block-1',
        item_type: 'song',
        notes: null,
        position: 0,
        song_id: 'song-1',
      },
      {
        block_id: 'block-1',
        description: 'Pausa curta',
        estimated_duration_ms: 0,
        item_type: 'planning',
        position: 1,
      },
    ]);
  });

  it('traduz erro ao inserir os novos itens', async () => {
    const deletion = deleteQuery();
    const insertion = {
      insert: jest.fn().mockResolvedValue({
        error: { message: 'database offline' },
      }),
    };
    from.mockReturnValueOnce(deletion).mockReturnValueOnce(insertion);

    await expect(
      replaceShowBlockItems({
        blockId: 'block-1',
        items: [{ id: 'separator', type: 'separator' }],
      }),
    ).rejects.toMatchObject({ code: 'request_failed' });
  });
});
