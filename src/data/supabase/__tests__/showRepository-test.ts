import { getSupabaseClient } from '@/data/supabase/client';
import { SupabaseShowRepository } from '@/data/supabase/showRepository';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

function validShow(overrides: Record<string, unknown> = {}) {
  return {
    band_id: 'band-1',
    created_at: '2026-09-01T10:00:00.000Z',
    id: 'show-1',
    name: 'Festival',
    notes: null,
    starts_at: '2026-10-01T20:00:00.000Z',
    status: 'draft',
    updated_at: '2026-09-01T10:00:00.000Z',
    venue: 'Praça',
    show_blocks: [
      {
        id: 'block-2',
        name: 'Bis',
        position: 1,
        show_items: [
          {
            description: 'Troca de instrumento',
            estimated_duration_ms: 30_000,
            id: 'planning-2',
            item_type: 'planning',
            position: 1,
          },
          { id: 'separator-1', item_type: 'separator', position: 2 },
        ],
      },
      {
        id: 'block-1',
        name: 'Principal',
        position: 0,
        show_items: [
          {
            id: 'song-1',
            item_type: 'song',
            notes: null,
            position: 0,
            song_id: 'song-a',
          },
          {
            description: 'Ajuste de afinação',
            estimated_duration_ms: null,
            id: 'planning-1',
            item_type: 'planning',
            position: 0,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function configureQuery(response: { data: unknown; error: unknown }) {
  const query = {
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(response),
    order: jest.fn().mockResolvedValue(response),
    select: jest.fn().mockReturnThis(),
  };
  const from = jest.fn().mockReturnValue(query);
  mockGetSupabaseClient.mockReturnValue({ from } as never);
  return { from, query };
}

describe('SupabaseShowRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mapeia e ordena shows, blocos e todos os tipos de item', async () => {
    const { from, query } = configureQuery({
      data: [validShow()],
      error: null,
    });

    const shows = await new SupabaseShowRepository().listByBandId('band-1');

    expect(from).toHaveBeenCalledWith('shows');
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-1');
    expect(query.order).toHaveBeenCalledWith('starts_at', { ascending: true });
    expect(shows[0]).toMatchObject({
      id: 'show-1',
      notes: null,
      status: 'draft',
      blocks: [
        {
          id: 'block-1',
          items: [
            { id: 'song-1', notes: null, songId: 'song-a', type: 'song' },
            {
              description: 'Ajuste de afinação',
              estimatedDurationMs: null,
              type: 'planning',
            },
          ],
        },
        {
          id: 'block-2',
          items: [
            { description: 'Troca de instrumento', type: 'planning' },
            { id: 'separator-1', type: 'separator' },
          ],
        },
      ],
    });
  });

  it.each(['ready', 'cancelled'] as const)(
    'aceita status %s',
    async (status) => {
      configureQuery({ data: [validShow({ status })], error: null });

      await expect(
        new SupabaseShowRepository().listByBandId('band-1'),
      ).resolves.toMatchObject([{ status }]);
    },
  );

  it('retorna lista vazia quando a consulta não retorna dados', async () => {
    configureQuery({ data: null, error: null });

    await expect(
      new SupabaseShowRepository().listByBandId('band-1'),
    ).resolves.toEqual([]);
  });

  it('propaga falha ao listar', async () => {
    const error = new Error('falha de rede');
    configureQuery({ data: null, error });

    await expect(
      new SupabaseShowRepository().listByBandId('band-1'),
    ).rejects.toBe(error);
  });

  it('consulta um show por banda e id', async () => {
    const { query } = configureQuery({ data: validShow(), error: null });

    await expect(
      new SupabaseShowRepository().findById('band-1', 'show-1'),
    ).resolves.toMatchObject({ id: 'show-1' });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'show-1');
  });

  it('retorna null quando o show não existe e propaga falhas da consulta', async () => {
    configureQuery({ data: null, error: null });
    await expect(
      new SupabaseShowRepository().findById('band-1', 'missing'),
    ).resolves.toBeNull();

    const error = new Error('indisponível');
    configureQuery({ data: null, error });
    await expect(
      new SupabaseShowRepository().findById('band-1', 'show-1'),
    ).rejects.toBe(error);
  });

  it.each([
    null,
    validShow({ show_blocks: null }),
    validShow({ status: 'unknown' }),
    validShow({ band_id: '' }),
    validShow({ notes: 10 }),
    validShow({ show_blocks: [{ id: 'b', name: 'Principal', position: 0 }] }),
    validShow({
      show_blocks: [
        { id: 'b', name: 'Principal', position: 0, show_items: [null] },
      ],
    }),
    validShow({
      show_blocks: [
        {
          id: 'b',
          name: 'Principal',
          position: 0,
          show_items: [{ id: 'x', item_type: 'unknown', position: 0 }],
        },
      ],
    }),
  ])('rejeita estrutura inválida do banco (%#)', async (row) => {
    configureQuery({ data: [row], error: null });

    await expect(
      new SupabaseShowRepository().listByBandId('band-1'),
    ).rejects.toThrow('Resposta inválida do Supabase');
  });
});
