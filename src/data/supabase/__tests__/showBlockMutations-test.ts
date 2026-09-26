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

describe('validações e falhas nas mutações de blocos', () => {
  const from = jest.fn();
  const validCreateInput = { name: 'Bis', position: 1, showId: 'show-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it.each([-1, Number.NaN, 1.5])(
    'rejeita posição inválida: %s',
    async (position) => {
      await expect(
        createShowBlock({ ...validCreateInput, position }),
      ).rejects.toMatchObject({ code: 'invalid_show' });
      expect(from).not.toHaveBeenCalled();
    },
  );

  it.each([' ', 'b'.repeat(121)])(
    'rejeita nome inválido de bloco',
    async (name) => {
      const query = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      from.mockReturnValue(query);

      await expect(
        createShowBlock({ ...validCreateInput, name }),
      ).rejects.toMatchObject({ code: 'invalid_show' });
      expect(query.insert).not.toHaveBeenCalled();
    },
  );

  it.each([null, {}, { id: '' }])(
    'rejeita resposta de criação sem id válido',
    async (data) => {
      const query = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error: null }),
      };
      from.mockReturnValue(query);

      await expect(createShowBlock(validCreateInput)).rejects.toMatchObject({
        code: 'request_failed',
      });
    },
  );

  it.each([
    [{ code: '42501', message: 'denied' }, 'permission_denied'],
    [{ message: 'JWT expired' }, 'permission_denied'],
    [{ message: 'row-level security violation' }, 'permission_denied'],
    [{ message: 'permission denied' }, 'permission_denied'],
    [{ message: 'SHOW_NOT_EDITABLE' }, 'permission_denied'],
    [{ message: 'offline' }, 'request_failed'],
  ] as const)('traduz falha ao criar bloco: %j', async (error, code) => {
    const query = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error }),
    };
    from.mockReturnValue(query);

    await expect(createShowBlock(validCreateInput)).rejects.toMatchObject({
      code,
    });
  });

  it('traduz falta de permissão e bloco inexistente ao renomear ou excluir', async () => {
    const renameQuery = {
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };
    from.mockReturnValueOnce(renameQuery);
    await expect(
      renameShowBlock({ blockId: 'block-1', name: 'Renomeado' }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });

    const deleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'row-level security violation' },
      }),
      select: jest.fn().mockReturnThis(),
    };
    from.mockReturnValueOnce(deleteQuery);
    await expect(
      deleteShowBlock({ blockId: 'block-1', showId: 'show-1' }),
    ).rejects.toMatchObject({ code: 'permission_denied' });

    deleteQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    from.mockReturnValueOnce(deleteQuery);
    await expect(
      deleteShowBlock({ blockId: 'block-1', showId: 'show-1' }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });
  });

  it('rejeita lista de blocos vazia ou com ids repetidos', async () => {
    await expect(
      reorderShowBlocks({ blocks: [], showId: 'show-1' }),
    ).rejects.toMatchObject({ code: 'invalid_show' });
    await expect(
      reorderShowBlocks({
        blocks: [
          { id: 'block-1', name: 'A' },
          { id: 'block-1', name: 'B' },
        ],
        showId: 'show-1',
      }),
    ).rejects.toMatchObject({ code: 'invalid_show' });
  });

  it('traduz falha de reordenação no servidor e falha inesperada', async () => {
    const permissionQuery = {
      eq: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };
    permissionQuery.eq
      .mockReturnValueOnce(permissionQuery)
      .mockResolvedValueOnce({ error: { message: 'SHOW_NOT_EDITABLE' } });
    from.mockReturnValueOnce(permissionQuery);

    await expect(
      reorderShowBlocks({
        blocks: [{ id: 'block-1', name: 'Principal' }],
        showId: 'show-1',
      }),
    ).rejects.toMatchObject({ code: 'permission_denied' });

    const firstQuery = {
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };
    const unexpectedQuery = {
      eq: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };
    unexpectedQuery.eq
      .mockReturnValueOnce(unexpectedQuery)
      .mockRejectedValueOnce(new Error('network'));
    from.mockReturnValueOnce(firstQuery).mockReturnValueOnce(unexpectedQuery);

    await expect(
      reorderShowBlocks({
        blocks: [{ id: 'block-1', name: 'Principal' }],
        showId: 'show-1',
      }),
    ).rejects.toMatchObject({ code: 'request_failed' });
  });
});
