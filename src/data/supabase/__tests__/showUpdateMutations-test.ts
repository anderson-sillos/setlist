import { getSupabaseClient } from '@/data/supabase/client';
import {
  updateShow,
  updateShowStatus,
} from '@/data/supabase/showUpdateMutations';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('mutações de status de shows', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('permite reabrir um show Pronto e persiste o novo status', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'show-1' }, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'ready',
        showId: 'show-1',
        status: 'draft',
      }),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({ status: 'draft' });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'show-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'band_id', 'band-1');
  });

  it('rejeita uma transição que não está disponível', async () => {
    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'cancelled',
        showId: 'show-1',
        status: 'ready',
      }),
    ).rejects.toMatchObject({ code: 'invalid_show' });
    expect(from).not.toHaveBeenCalled();
  });
});

describe('atualização de dados do show', () => {
  const from = jest.fn();

  const makeQuery = (response: { data: unknown; error: unknown }) => ({
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(response),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  });

  const validInput = {
    bandId: 'band-1',
    name: 'Festival',
    notes: '  ',
    showId: 'show-1',
    startsAt: '2026-10-01T20:00:00-03:00',
    venue: 'Praça',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('normaliza e persiste os dados válidos', async () => {
    const query = makeQuery({ data: { id: 'show-1' }, error: null });
    from.mockReturnValue(query);

    await expect(
      updateShow({ ...validInput, name: '  Festival  ', venue: '  Praça  ' }),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({
      name: 'Festival',
      notes: null,
      starts_at: '2026-10-01T23:00:00.000Z',
      venue: 'Praça',
    });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'show-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'band_id', 'band-1');
  });

  it.each([
    { name: 'nome vazio', value: { name: ' ' } },
    { name: 'nome muito longo', value: { name: 'n'.repeat(201) } },
    { name: 'data inválida', value: { startsAt: 'não é uma data' } },
    { name: 'local vazio', value: { venue: ' ' } },
    { name: 'local muito longo', value: { venue: 'l'.repeat(241) } },
  ])('rejeita $name antes de chamar o banco', async ({ value }) => {
    const query = makeQuery({ data: null, error: null });
    from.mockReturnValue(query);
    await expect(updateShow({ ...validInput, ...value })).rejects.toMatchObject(
      {
        code: 'invalid_show',
      },
    );
    expect(query.update).not.toHaveBeenCalled();
  });

  it.each([
    [{ code: '42501', message: 'denied' }, 'permission_denied'],
    [{ message: 'JWT expired' }, 'permission_denied'],
    [{ message: 'row-level security denied' }, 'permission_denied'],
    [{ message: 'permission denied' }, 'permission_denied'],
    [{ message: 'database offline' }, 'request_failed'],
  ] as const)('traduz erros de atualização: %j', async (error, code) => {
    from.mockReturnValue(makeQuery({ data: null, error }));

    await expect(updateShow(validInput)).rejects.toMatchObject({ code });
  });

  it('informa quando a atualização não encontra o show', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: null }));

    await expect(updateShow(validInput)).rejects.toMatchObject({
      code: 'not_found_or_forbidden',
    });
  });

  it('não envia ao servidor a transição que mantém o status atual', async () => {
    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'draft',
        showId: 'show-1',
        status: 'draft',
      }),
    ).resolves.toBeUndefined();
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    [{ code: '42501', message: 'denied' }, 'permission_denied'],
    [{ message: 'JWT expired' }, 'permission_denied'],
    [{ message: 'row-level security denied' }, 'permission_denied'],
    [{ message: 'permission denied' }, 'permission_denied'],
    [{ message: 'SHOW_NOT_EDITABLE' }, 'permission_denied'],
    [{ message: 'database offline' }, 'request_failed'],
  ] as const)('traduz erros na mudança de status: %j', async (error, code) => {
    from.mockReturnValue(makeQuery({ data: null, error }));

    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'draft',
        showId: 'show-1',
        status: 'ready',
      }),
    ).rejects.toMatchObject({ code });
  });

  it('informa quando a mudança de status não encontra o show', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: null }));

    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'draft',
        showId: 'show-1',
        status: 'ready',
      }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });
  });
});
