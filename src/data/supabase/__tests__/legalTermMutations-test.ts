import { getSupabaseClient } from '@/data/supabase/client';
import {
  acceptCurrentBandTerm,
  getCurrentBandTermAcceptance,
  LegalTermMutationError,
} from '@/data/supabase/legalTermMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

type AcceptanceQueryMock = {
  eq: jest.Mock<AcceptanceQueryMock, [string, string]>;
  maybeSingle: jest.Mock<Promise<{ data: unknown; error: unknown }>, []>;
  select: jest.Mock<AcceptanceQueryMock, [string]>;
};

function createAcceptanceQuery(result: { data: unknown; error: unknown }) {
  const query = {} as AcceptanceQueryMock;
  query.eq = jest.fn<AcceptanceQueryMock, [string, string]>(() => query);
  query.maybeSingle = jest.fn<Promise<{ data: unknown; error: unknown }>, []>(
    () => Promise.resolve(result),
  );
  query.select = jest.fn<AcceptanceQueryMock, [string]>(() => query);

  return query;
}

describe('aceite do termo vigente no Supabase', () => {
  const from = jest.fn();
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);
  });

  it('consulta somente o aceite vigente da pessoa na banda', async () => {
    const query = createAcceptanceQuery({
      data: { id: 'acceptance-1' },
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      getCurrentBandTermAcceptance({
        bandId: 'band-1',
        termVersion: '2026-09',
        userId: 'user-1',
      }),
    ).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith('legal_acceptances');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'term_version', '2026-09');
    expect(query.eq).toHaveBeenNthCalledWith(3, 'user_id', 'user-1');
  });

  it('indica que o aceite está ausente sem tratar como falha', async () => {
    from.mockReturnValue(createAcceptanceQuery({ data: null, error: null }));

    await expect(
      getCurrentBandTermAcceptance({
        bandId: 'band-1',
        termVersion: '2026-09',
        userId: 'user-1',
      }),
    ).resolves.toBe(false);
  });

  it('registra o aceite pela RPC protegida', async () => {
    rpc.mockResolvedValue({ data: '2026-09-24T12:00:00.000Z', error: null });

    await expect(
      acceptCurrentBandTerm({ bandId: 'band-1', termVersion: '2026-09' }),
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledWith('accept_current_band_term', {
      p_band_id: 'band-1',
      p_term_version: '2026-09',
    });
  });

  it.each([
    ['AUTHENTICATION_REQUIRED', 'authentication_required'],
    ['TERM_VERSION_NOT_CURRENT', 'not_current'],
    ['LEGAL_TERM_ROLE_REQUIRED', 'permission_denied'],
    ['NETWORK_ERROR', 'request_failed'],
  ] as const)('traduz o erro %s', async (serverError, code) => {
    rpc.mockResolvedValue({ data: null, error: { message: serverError } });

    await expect(
      acceptCurrentBandTerm({ bandId: 'band-1', termVersion: '2026-09' }),
    ).rejects.toMatchObject<Partial<LegalTermMutationError>>({ code });
  });
});
