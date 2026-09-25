import { getSupabaseClient } from '@/data/supabase/client';
import {
  createShowBlock,
  deleteShowBlock,
  renameShowBlock,
  reorderShowBlocks,
} from '@/data/supabase/showBlockMutations';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('mutações de blocos de shows', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('cria e normaliza um bloco', async () => {
    const query = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'block-1' }, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      createShowBlock({
        name: '  Segundo Set  ',
        position: 1,
        showId: 'show-1',
      }),
    ).resolves.toBe('block-1');
    expect(query.insert).toHaveBeenCalledWith({
      name: 'Segundo Set',
      position: 1,
      show_id: 'show-1',
    });
  });

  it('renomeia um bloco existente', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'block-1' }, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      renameShowBlock({ blockId: 'block-1', name: 'Bis' }),
    ).resolves.toBeUndefined();
    expect(query.update).toHaveBeenCalledWith({ name: 'Bis' });
    expect(query.eq).toHaveBeenCalledWith('id', 'block-1');
  });

  it('exclui um bloco existente', async () => {
    const query = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'block-1' }, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      deleteShowBlock({ blockId: 'block-1', showId: 'show-1' }),
    ).resolves.toBeUndefined();
    expect(query.delete).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'block-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'show_id', 'show-1');
  });

  it('reordena todos os blocos usando posições temporárias sem colisão', async () => {
    const queries = Array.from({ length: 4 }, () => ({
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }));
    queries.forEach((query) => from.mockReturnValueOnce(query));

    await expect(
      reorderShowBlocks({
        blocks: [
          { id: 'block-2', name: 'Bis' },
          { id: 'block-1', name: 'Abertura' },
        ],
        showId: 'show-1',
      }),
    ).resolves.toBeUndefined();

    expect(queries[0].update).toHaveBeenCalledWith({ position: 1000000 });
    expect(queries[1].update).toHaveBeenCalledWith({ position: 1000001 });
    expect(queries[2].update).toHaveBeenCalledWith({ position: 0 });
    expect(queries[3].update).toHaveBeenCalledWith({ position: 1 });
  });
});
