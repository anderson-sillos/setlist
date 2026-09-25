import { getSupabaseClient } from '@/data/supabase/client';
import { createShow, ShowMutationError } from '@/data/supabase/showMutations';

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
});
