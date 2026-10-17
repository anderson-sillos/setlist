import { getSupabaseClient } from '@/data/supabase/client';
import { SupabaseBandRepository } from '@/data/supabase/repositories';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

type QueryResult = { data: unknown; error: Error | null };

type QueryMock = {
  eq: jest.Mock<Promise<QueryResult>, []> | jest.Mock<QueryMock, []>;
  in: jest.Mock<Promise<QueryResult>, []>;
  maybeSingle: jest.Mock<Promise<QueryResult>, []>;
  order: jest.Mock<Promise<QueryResult>, [string, { ascending: boolean }]>;
  select: jest.Mock<QueryMock, []>;
};

function createQuery(result: QueryResult): QueryMock {
  const query = {} as QueryMock;
  query.eq = jest.fn<Promise<QueryResult>, []>(() => Promise.resolve(result));
  query.in = jest.fn<Promise<QueryResult>, []>(() => Promise.resolve(result));
  query.maybeSingle = jest.fn<Promise<QueryResult>, []>(() =>
    Promise.resolve(result),
  );
  query.order = jest.fn<Promise<QueryResult>, [string, { ascending: boolean }]>(
    () => Promise.resolve(result),
  );
  query.select = jest.fn<QueryMock, []>(() => query);

  return query;
}

function createSingleQuery(result: QueryResult): QueryMock {
  const query = {} as QueryMock;
  query.eq = jest.fn<QueryMock, []>(() => query);
  query.in = jest.fn<Promise<QueryResult>, []>(() => Promise.resolve(result));
  query.maybeSingle = jest.fn<Promise<QueryResult>, []>(() =>
    Promise.resolve(result),
  );
  query.order = jest.fn<Promise<QueryResult>, [string, { ascending: boolean }]>(
    () => Promise.resolve(result),
  );
  query.select = jest.fn<QueryMock, []>(() => query);

  return query;
}

describe('repositório de bandas do Supabase', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('carrega o contexto autorizado da banda em uma única consulta', async () => {
    const query = createSingleQuery({
      data: {
        band_id: 'band-1',
        band_name: 'Banda Remota',
        has_active_songs: false,
        role: 'editor',
      },
      error: null,
    });
    from.mockReturnValueOnce(query);

    await expect(
      new SupabaseBandRepository().getContext('user-1', 'band-1'),
    ).resolves.toEqual({
      bandId: 'band-1',
      bandName: 'Banda Remota',
      hasActiveSongs: false,
      role: 'editor',
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('band_context');
    expect(query.select).toHaveBeenCalledWith(
      'band_id, band_name, role, has_active_songs',
    );
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-1');
  });

  it('retorna contexto vazio quando a pessoa não tem acesso à banda', async () => {
    from.mockReturnValueOnce(createSingleQuery({ data: null, error: null }));

    await expect(
      new SupabaseBandRepository().getContext('user-1', 'band-private'),
    ).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('lista resumos de Minhas bandas em uma consulta, sem buscar perfis nem shows', async () => {
    const query = createQuery({
      data: [
        {
          band_id: 'band-1',
          band_name: 'Banda A',
          next_show_starts_at: '2026-12-10T21:00:00.000Z',
          role: 'owner',
        },
        {
          band_id: 'band-2',
          band_name: 'Banda B',
          next_show_starts_at: null,
          role: 'member',
        },
      ],
      error: null,
    });
    from.mockReturnValueOnce(query);

    await expect(
      new SupabaseBandRepository().listUserSummaries('user-1'),
    ).resolves.toEqual([
      {
        bandId: 'band-1',
        bandName: 'Banda A',
        nextShowStartsAt: '2026-12-10T21:00:00.000Z',
        role: 'owner',
      },
      {
        bandId: 'band-2',
        bandName: 'Banda B',
        nextShowStartsAt: null,
        role: 'member',
      },
    ]);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('user_band_summaries');
    expect(query.select).toHaveBeenCalledWith(
      'band_id, band_name, role, next_show_starts_at',
    );
    expect(query.order).toHaveBeenCalledWith('band_name', {
      ascending: true,
    });
  });

  it('carrega as bandas e a participação da pessoa autenticada', async () => {
    from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              band_id: 'band-1',
              id: 'membership-1',
              joined_at: '2026-09-20T10:00:00.000Z',
              role: 'owner',
              user_id: 'user-1',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              created_at: '2026-09-20T10:00:00.000Z',
              id: 'band-1',
              name: 'Banda Remota',
              updated_at: '2026-09-20T10:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              display_name: 'Ana Martins',
              email: 'ana@example.com',
              id: 'user-1',
            },
          ],
          error: null,
        }),
      );

    await expect(
      new SupabaseBandRepository().listForUser('user-1'),
    ).resolves.toEqual([
      {
        band: {
          createdAt: '2026-09-20T10:00:00.000Z',
          id: 'band-1',
          name: 'Banda Remota',
          updatedAt: '2026-09-20T10:00:00.000Z',
        },
        membership: {
          avatarUrl: null,
          bandId: 'band-1',
          displayName: 'Ana Martins',
          email: 'ana@example.com',
          id: 'membership-1',
          joinedAt: '2026-09-20T10:00:00.000Z',
          role: 'owner',
          userId: 'user-1',
        },
      },
    ]);
    expect(from).toHaveBeenNthCalledWith(1, 'band_members');
    expect(from).toHaveBeenNthCalledWith(2, 'bands');
    expect(from).toHaveBeenNthCalledWith(3, 'profiles');
  });

  it('retorna uma lista vazia sem consultar tabelas adicionais quando não há participações', async () => {
    from.mockReturnValueOnce(createQuery({ data: [], error: null }));

    await expect(
      new SupabaseBandRepository().listForUser('user-without-band'),
    ).resolves.toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('retorna somente as bandas remotas do usuário', async () => {
    from.mockReturnValueOnce(createQuery({ data: [], error: null }));

    await expect(
      new SupabaseBandRepository().listForUser('user-1'),
    ).resolves.toEqual([]);
  });

  it('não adiciona bandas quando a consulta remota já é suficiente', async () => {
    from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              band_id: 'band-remote',
              id: 'membership-remote',
              joined_at: '2026-09-20T10:00:00.000Z',
              role: 'member',
              user_id: 'user-1',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              created_at: '2026-09-20T10:00:00.000Z',
              id: 'band-remote',
              name: 'Banda Remota',
              updated_at: '2026-09-20T10:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(createQuery({ data: [], error: null }));

    await expect(
      new SupabaseBandRepository().listForUser('user-1'),
    ).resolves.toHaveLength(1);
  });

  it('busca detalhes sem fallback local', async () => {
    from.mockReturnValueOnce(createSingleQuery({ data: null, error: null }));
    await expect(
      new SupabaseBandRepository().findById('band-missing'),
    ).resolves.toBeNull();
  });

  it('carrega integrantes e usa o e-mail quando o perfil não tem nome', async () => {
    from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              band_id: 'band-1',
              id: 'membership-1',
              joined_at: '2026-09-20T10:00:00.000Z',
              role: 'member',
              user_id: 'user-1',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              avatar_url: 'https://img.example.test/member.png',
              display_name: 'Member Profile',
              email: 'member@example.com',
              id: 'user-1',
            },
          ],
          error: null,
        }),
      );

    await expect(
      new SupabaseBandRepository().listMembers('band-1'),
    ).resolves.toEqual([
      {
        avatarUrl: 'https://img.example.test/member.png',
        bandId: 'band-1',
        displayName: 'Member Profile',
        email: 'member@example.com',
        id: 'membership-1',
        joinedAt: '2026-09-20T10:00:00.000Z',
        role: 'member',
        userId: 'user-1',
      },
    ]);
  });

  it('usa um rótulo neutro quando o integrante não possui perfil visível', async () => {
    from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              band_id: 'band-1',
              id: 'membership-1',
              joined_at: '2026-09-20T10:00:00.000Z',
              role: 'member',
              user_id: 'user-removed',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(createQuery({ data: [], error: null }));

    await expect(
      new SupabaseBandRepository().listMembers('band-1'),
    ).resolves.toEqual([
      expect.objectContaining({
        avatarUrl: null,
        displayName: 'Usuário removido',
      }),
    ]);
  });

  it('busca uma banda específica e retorna nulo quando ela não está disponível', async () => {
    from.mockReturnValueOnce(createSingleQuery({ data: null, error: null }));

    await expect(
      new SupabaseBandRepository().findById('band-missing'),
    ).resolves.toBeNull();
  });

  it('não usa fallback local quando a banda não existe', async () => {
    from.mockReturnValueOnce(createSingleQuery({ data: null, error: null }));
    await expect(
      new SupabaseBandRepository().findById('band-missing'),
    ).resolves.toBeNull();
  });

  it('converte uma banda específica para a entidade do domínio', async () => {
    from.mockReturnValueOnce(
      createSingleQuery({
        data: {
          created_at: '2026-09-20T10:00:00.000Z',
          id: 'band-1',
          name: 'Banda Remota',
          updated_at: '2026-09-20T10:00:00.000Z',
        },
        error: null,
      }),
    );

    await expect(
      new SupabaseBandRepository().findById('band-1'),
    ).resolves.toEqual({
      createdAt: '2026-09-20T10:00:00.000Z',
      id: 'band-1',
      name: 'Banda Remota',
      updatedAt: '2026-09-20T10:00:00.000Z',
    });
  });

  it('rejeita respostas de participação com papel desconhecido', async () => {
    from.mockReturnValueOnce(
      createQuery({
        data: [
          {
            band_id: 'band-1',
            id: 'membership-1',
            joined_at: '2026-09-20T10:00:00.000Z',
            role: 'guest',
            user_id: 'user-1',
          },
        ],
        error: null,
      }),
    );

    await expect(
      new SupabaseBandRepository().listForUser('user-1'),
    ).rejects.toThrow('role');
  });

  it('propaga falhas de leitura para o estado de erro da tela', async () => {
    const error = new Error('network unavailable');
    from.mockReturnValueOnce(createQuery({ data: null, error }));

    await expect(
      new SupabaseBandRepository().listForUser('user-1'),
    ).rejects.toBe(error);
  });
});
