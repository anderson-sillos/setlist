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
