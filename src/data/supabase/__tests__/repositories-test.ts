import { getSupabaseClient } from '@/data/supabase/client';
import { demoIds } from '@/data/demo';
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
  select: jest.Mock<QueryMock, []>;
};

function createQuery(result: QueryResult): QueryMock {
  const query = {} as QueryMock;
  query.eq = jest.fn<Promise<QueryResult>, []>(() => Promise.resolve(result));
  query.in = jest.fn<Promise<QueryResult>, []>(() => Promise.resolve(result));
  query.maybeSingle = jest.fn<Promise<QueryResult>, []>(() =>
    Promise.resolve(result),
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
  query.select = jest.fn<QueryMock, []>(() => query);

  return query;
}

describe('repositório de bandas do Supabase', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
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

  it('mantém bandas demonstrativas disponíveis durante a migração do backend', async () => {
    from.mockReturnValueOnce(createQuery({ data: [], error: null }));
    const demoRepository = {
      listForUser: jest.fn().mockResolvedValue([
        {
          band: {
            createdAt: '2026-09-20T10:00:00.000Z',
            id: 'band-demo',
            name: 'Banda Demonstração',
            updatedAt: '2026-09-20T10:00:00.000Z',
          },
          membership: {
            bandId: 'band-demo',
            displayName: 'Pessoa demo',
            id: 'membership-demo',
            joinedAt: '2026-09-20T10:00:00.000Z',
            role: 'owner',
            userId: 'demo-user',
          },
        },
      ]),
    };

    await expect(
      new SupabaseBandRepository(
        demoRepository as never,
        'demo-user',
      ).listForUser('user-1'),
    ).resolves.toHaveLength(1);
    expect(demoRepository.listForUser).toHaveBeenCalledWith('demo-user');
  });

  it('combina bandas remotas e demonstrativas sem duplicar identificadores', async () => {
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
    const demoRepository = {
      listForUser: jest.fn().mockResolvedValue([
        {
          band: { id: 'band-remote' },
          membership: { bandId: 'band-remote' },
        },
        {
          band: { id: 'band-demo' },
          membership: { bandId: 'band-demo' },
        },
      ]),
    };

    await expect(
      new SupabaseBandRepository(
        demoRepository as never,
        'demo-user',
      ).listForUser('user-1'),
    ).resolves.toEqual([
      expect.objectContaining({
        band: expect.objectContaining({ id: 'band-remote' }),
      }),
      expect.objectContaining({
        band: expect.objectContaining({ id: 'band-demo' }),
      }),
    ]);
  });

  it('resolve detalhes de bandas demonstrativas sem consultar o Supabase', async () => {
    const demoRepository = {
      findById: jest.fn().mockResolvedValue({ id: demoIds.primaryBand }),
      listMembers: jest.fn().mockResolvedValue([]),
    };
    const repository = new SupabaseBandRepository(demoRepository as never);

    await expect(repository.findById(demoIds.primaryBand)).resolves.toEqual({
      id: demoIds.primaryBand,
    });
    await expect(
      repository.listMembers(demoIds.secondaryBand),
    ).resolves.toEqual([]);

    expect(from).not.toHaveBeenCalled();
    expect(demoRepository.findById).toHaveBeenCalledWith(demoIds.primaryBand);
    expect(demoRepository.listMembers).toHaveBeenCalledWith(
      demoIds.secondaryBand,
    );
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

  it('usa a banda demonstrativa como fallback para detalhes e integrantes', async () => {
    from
      .mockReturnValueOnce(createSingleQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: [], error: null }));
    const demoBand = {
      createdAt: '2026-09-20T10:00:00.000Z',
      id: 'band-demo',
      name: 'Banda Demonstração',
      updatedAt: '2026-09-20T10:00:00.000Z',
    };
    const demoMember = {
      bandId: 'band-demo',
      displayName: 'Pessoa demo',
      id: 'membership-demo',
      joinedAt: '2026-09-20T10:00:00.000Z',
      role: 'owner' as const,
      userId: 'demo-user',
    };
    const demoRepository = {
      findById: jest.fn().mockResolvedValue(demoBand),
      listMembers: jest.fn().mockResolvedValue([demoMember]),
    };
    const repository = new SupabaseBandRepository(demoRepository as never);

    await expect(repository.findById('band-demo')).resolves.toEqual(demoBand);
    await expect(repository.listMembers('band-demo')).resolves.toEqual([
      demoMember,
    ]);
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
