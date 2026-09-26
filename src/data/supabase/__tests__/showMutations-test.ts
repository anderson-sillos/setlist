import { getSupabaseClient } from '@/data/supabase/client';
import {
  createShow,
  deleteShow,
  duplicateShow,
  ShowMutationError,
} from '@/data/supabase/showMutations';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('criação de shows no Supabase', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('valida os campos obrigatórios antes da chamada remota', async () => {
    await expect(
      createShow({
        bandId: 'band-1',
        name: ' ',
        notes: null,
        startsAt: '2026-09-20T20:00:00',
        venue: 'Local',
      }),
    ).rejects.toMatchObject<Partial<ShowMutationError>>({
      code: 'invalid_show',
    });
    await expect(
      createShow({
        bandId: 'band-1',
        name: 'Show',
        notes: null,
        startsAt: 'not-a-date',
        venue: 'Local',
      }),
    ).rejects.toMatchObject<Partial<ShowMutationError>>({
      code: 'invalid_show',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('cria o show como rascunho e abre o bloco Principal', async () => {
    const showQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'show-1' }, error: null }),
    };
    const blockQuery = { insert: jest.fn().mockResolvedValue({ error: null }) };
    from.mockReturnValueOnce(showQuery).mockReturnValueOnce(blockQuery);

    await expect(
      createShow({
        bandId: 'band-1',
        name: '  Festival  ',
        notes: '  Chegar cedo  ',
        startsAt: '2026-09-20T20:00:00',
        venue: '  Praça  ',
      }),
    ).resolves.toBe('show-1');
    expect(showQuery.insert).toHaveBeenCalledWith({
      band_id: 'band-1',
      name: 'Festival',
      notes: 'Chegar cedo',
      starts_at: expect.any(String),
      venue: 'Praça',
    });
    expect(blockQuery.insert).toHaveBeenCalledWith({
      name: 'Principal',
      position: 0,
      show_id: 'show-1',
    });
  });

  it('duplica blocos e itens com posições e identificadores independentes', async () => {
    const showQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'show-copy' }, error: null }),
    };
    const firstBlockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'block-copy-1' }, error: null }),
    };
    const firstItemsQuery = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    const secondBlockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'block-copy-2' }, error: null }),
    };
    const secondItemsQuery = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    from
      .mockReturnValueOnce(showQuery)
      .mockReturnValueOnce(firstBlockQuery)
      .mockReturnValueOnce(firstItemsQuery)
      .mockReturnValueOnce(secondBlockQuery)
      .mockReturnValueOnce(secondItemsQuery);

    await expect(
      duplicateShow({
        bandId: 'band-1',
        name: 'Festival (cópia)',
        notes: 'Observação copiada',
        show: {
          bandId: 'band-1',
          blocks: [
            {
              id: 'block-source-1',
              items: [
                {
                  id: 'item-source-song',
                  notes: 'Entrar no refrão',
                  songId: 'song-1',
                  type: 'song',
                },
                {
                  description: 'Troca de instrumento',
                  estimatedDurationMs: 120000,
                  id: 'item-source-planning',
                  type: 'planning',
                },
              ],
              name: 'Abertura',
            },
            {
              id: 'block-source-2',
              items: [{ id: 'item-source-separator', type: 'separator' }],
              name: 'Bis',
            },
          ],
          createdAt: '2026-09-20T10:00:00.000Z',
          id: 'show-source',
          name: 'Festival',
          notes: 'Observação original',
          startsAt: '2026-09-20T20:00:00.000Z',
          status: 'ready',
          updatedAt: '2026-09-20T10:00:00.000Z',
          venue: 'Praça',
        },
        startsAt: '2026-09-22T20:00:00',
        venue: 'Praça',
      }),
    ).resolves.toBe('show-copy');

    expect(showQuery.insert).toHaveBeenCalledWith({
      band_id: 'band-1',
      name: 'Festival (cópia)',
      notes: 'Observação copiada',
      starts_at: expect.any(String),
      venue: 'Praça',
    });
    expect(firstBlockQuery.insert).toHaveBeenCalledWith({
      name: 'Abertura',
      position: 0,
      show_id: 'show-copy',
    });
    expect(firstItemsQuery.insert).toHaveBeenCalledWith([
      {
        block_id: 'block-copy-1',
        item_type: 'song',
        notes: 'Entrar no refrão',
        position: 0,
        song_id: 'song-1',
      },
      {
        block_id: 'block-copy-1',
        description: 'Troca de instrumento',
        estimated_duration_ms: 120000,
        item_type: 'planning',
        position: 1,
      },
    ]);
    expect(secondBlockQuery.insert).toHaveBeenCalledWith({
      name: 'Bis',
      position: 1,
      show_id: 'show-copy',
    });
    expect(secondItemsQuery.insert).toHaveBeenCalledWith([
      { block_id: 'block-copy-2', item_type: 'separator', position: 0 },
    ]);
  });

  it('remove o show se a criação do bloco falhar', async () => {
    const showQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'show-1' }, error: null }),
    };
    const blockQuery = {
      insert: jest
        .fn()
        .mockResolvedValue({ error: { message: 'row-level security policy' } }),
    };
    const deleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    from
      .mockReturnValueOnce(showQuery)
      .mockReturnValueOnce(blockQuery)
      .mockReturnValueOnce(deleteQuery);

    await expect(
      createShow({
        bandId: 'band-1',
        name: 'Festival',
        notes: null,
        startsAt: '2026-09-20T20:00:00',
        venue: 'Praça',
      }),
    ).rejects.toMatchObject<Partial<ShowMutationError>>({
      code: 'permission_denied',
    });
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'show-1');
  });

  it('solicita a exclusão definitiva do show por RPC protegida', async () => {
    const rpc = jest.fn().mockResolvedValue({ error: null });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);

    await expect(
      deleteShow({ bandId: 'band-1', showId: 'show-1' }),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('delete_show', {
      p_band_id: 'band-1',
      p_show_id: 'show-1',
    });
  });
});

describe('falhas de criação, duplicação e exclusão de shows', () => {
  const from = jest.fn();
  const baseShow = {
    bandId: 'band-1',
    blocks: [],
    createdAt: '2026-09-01T10:00:00.000Z',
    id: 'show-source',
    name: 'Festival',
    notes: null,
    startsAt: '2026-10-01T20:00:00.000Z',
    status: 'draft' as const,
    updatedAt: '2026-09-01T10:00:00.000Z',
    venue: 'Praça',
  };
  const makeInsertQuery = (response: { data: unknown; error: unknown }) => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(response),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it.each([null, {}, { id: '' }])(
    'rejeita resposta de criação sem id: %j',
    async (data) => {
      from.mockReturnValue(makeInsertQuery({ data, error: null }));

      await expect(
        createShow({
          bandId: 'band-1',
          name: 'Festival',
          notes: null,
          startsAt: '2026-10-01T20:00:00',
          venue: 'Praça',
        }),
      ).rejects.toMatchObject({ code: 'request_failed' });
    },
  );

  it.each([
    [{ code: '42501', message: 'denied' }, 'permission_denied'],
    [{ message: 'JWT expired' }, 'permission_denied'],
    [{ message: 'row-level security violation' }, 'permission_denied'],
    [{ message: 'permission denied' }, 'permission_denied'],
    [{ message: 'SHOW_DELETE_FORBIDDEN' }, 'permission_denied'],
    [{ message: 'database offline' }, 'request_failed'],
  ] as const)('mapeia erros do servidor: %j', async (error, code) => {
    const rpc = jest.fn().mockResolvedValue({ error });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);

    await expect(
      deleteShow({ bandId: 'band-1', showId: 'show-1' }),
    ).rejects.toMatchObject({ code });
  });

  it.each([
    { bandId: ' ', showId: 'show-1' },
    { bandId: 'band-1', showId: ' ' },
  ])('rejeita identificadores vazios antes da RPC', async (input) => {
    const rpc = jest.fn();
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);

    await expect(deleteShow(input)).rejects.toMatchObject({
      code: 'invalid_show',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('distingue show inexistente ao excluir', async () => {
    const rpc = jest.fn().mockResolvedValue({
      error: { message: 'SHOW_NOT_FOUND' },
    });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);

    await expect(
      deleteShow({ bandId: 'band-1', showId: 'show-1' }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });
  });

  it('recusa duplicar show pertencente a outra banda', async () => {
    await expect(
      duplicateShow({
        bandId: 'band-2',
        name: 'Cópia',
        notes: null,
        show: baseShow,
        startsAt: '2026-10-01T20:00:00',
        venue: 'Praça',
      }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });
    expect(from).not.toHaveBeenCalled();
  });

  it('pula a inserção de itens ao duplicar um bloco vazio', async () => {
    const showQuery = makeInsertQuery({ data: { id: 'copy' }, error: null });
    const blockQuery = makeInsertQuery({
      data: { id: 'copy-block' },
      error: null,
    });
    from.mockReturnValueOnce(showQuery).mockReturnValueOnce(blockQuery);

    await expect(
      duplicateShow({
        bandId: 'band-1',
        name: 'Cópia',
        notes: null,
        show: {
          ...baseShow,
          blocks: [{ id: 'empty', name: 'Principal', items: [] }],
        },
        startsAt: '2026-10-02T20:00:00',
        venue: 'Praça',
      }),
    ).resolves.toBe('copy');
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('faz rollback quando um bloco ou seus itens falham ao duplicar', async () => {
    const showQuery = makeInsertQuery({ data: { id: 'copy' }, error: null });
    const failedBlock = makeInsertQuery({
      data: null,
      error: { message: 'row-level security violation' },
    });
    const rollback = { delete: jest.fn().mockReturnThis(), eq: jest.fn() };
    from
      .mockReturnValueOnce(showQuery)
      .mockReturnValueOnce(failedBlock)
      .mockReturnValueOnce(rollback);

    await expect(
      duplicateShow({
        bandId: 'band-1',
        name: 'Cópia',
        notes: null,
        show: {
          ...baseShow,
          blocks: [{ id: 'b', name: 'Principal', items: [] }],
        },
        startsAt: '2026-10-02T20:00:00',
        venue: 'Praça',
      }),
    ).rejects.toMatchObject({ code: 'permission_denied' });
    expect(rollback.eq).toHaveBeenCalledWith('id', 'copy');

    const validBlock = makeInsertQuery({
      data: { id: 'copy-block' },
      error: null,
    });
    const failedItems = {
      insert: jest.fn().mockResolvedValue({ error: { message: 'offline' } }),
    };
    const secondRollback = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    from
      .mockReturnValueOnce(showQuery)
      .mockReturnValueOnce(validBlock)
      .mockReturnValueOnce(failedItems)
      .mockReturnValueOnce(secondRollback);

    await expect(
      duplicateShow({
        bandId: 'band-1',
        name: 'Cópia',
        notes: null,
        show: {
          ...baseShow,
          blocks: [
            {
              id: 'b',
              name: 'Principal',
              items: [
                {
                  id: 'song-item',
                  notes: null,
                  songId: 'song-1',
                  type: 'song',
                },
              ],
            },
          ],
        },
        startsAt: '2026-10-02T20:00:00',
        venue: 'Praça',
      }),
    ).rejects.toMatchObject({ code: 'request_failed' });
    expect(secondRollback.eq).toHaveBeenCalledWith('id', 'copy');
  });
});
