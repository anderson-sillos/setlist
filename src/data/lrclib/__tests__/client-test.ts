import { searchLrclibTracks } from '@/data/lrclib/client';

jest.mock('@/config/appRelease', () => ({
  getAppReleaseInfo: () => ({ version: '1.2.3' }),
}));

const previousAppId = process.env.EXPO_PUBLIC_LRCLIB_APP_ID;

function response(
  status: number,
  payload: unknown,
  headers: Record<string, string> = {},
) {
  return {
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(payload),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

const validTrack = {
  id: 42,
  trackName: 'Canção de ensaio',
  artistName: 'Banda de teste',
  albumName: 'Ao vivo no estúdio',
  duration: 241.25,
  plainLyrics: 'Verso sintético para teste',
  syncedLyrics: '[00:01.20]Verso sintético para teste',
};

afterAll(() => {
  if (previousAppId === undefined) delete process.env.EXPO_PUBLIC_LRCLIB_APP_ID;
  else process.env.EXPO_PUBLIC_LRCLIB_APP_ID = previousAppId;
});

describe('searchLrclibTracks', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_LRCLIB_APP_ID;
  });

  it('usa busca estruturada e normaliza a identificação configurada', async () => {
    process.env.EXPO_PUBLIC_LRCLIB_APP_ID = '  public-test-id  ';
    const fetchImpl = jest.fn().mockResolvedValue(response(200, [validTrack]));

    const result = await searchLrclibTracks(
      { title: '  Canção de ensaio ', artist: ' Banda de teste ' },
      { fetchImpl },
    );

    expect(result[0]).toMatchObject({
      recordId: 42,
      durationMs: 241_250,
      trackName: 'Canção de ensaio',
    });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).searchParams.get('track_name')).toBe(
      'Canção de ensaio',
    );
    expect(new URL(url).searchParams.get('artist_name')).toBe('Banda de teste');
    expect(new URL(url).searchParams.has('q')).toBe(false);
    expect([...new URL(url).searchParams.keys()].sort()).toEqual([
      'artist_name',
      'track_name',
    ]);
    expect(init.headers).toEqual({
      'Lrclib-Client': 'Setlist/1.2.3 (https://setlistbr.app.br)',
      'Lrclib-App-Id': 'public-test-id',
    });
    expect(init.credentials).toBe('omit');
    expect(JSON.stringify(init.headers)).not.toMatch(/authorization|cookie/i);
    expect(url).not.toContain('public-test-id');
    expect(url).not.toContain('Verso sintético');
    expect(url).not.toContain('private-band-id');
  });

  it('repete a identificação configurada em cada tentativa', async () => {
    process.env.EXPO_PUBLIC_LRCLIB_APP_ID = 'public-test-id';
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response(503, '<html>indisponível</html>'))
      .mockResolvedValueOnce(response(200, [validTrack]));

    await searchLrclibTracks(
      { title: 'Canção de ensaio', artist: 'Banda de teste' },
      { fetchImpl, sleep: async () => undefined },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchImpl.mock.calls as [string, RequestInit][]) {
      expect(init.headers).toMatchObject({ 'Lrclib-App-Id': 'public-test-id' });
      expect(init.headers).not.toHaveProperty('Authorization');
    }
  });

  it.each([undefined, '', '  \t  '])(
    'omite por completo o identificador vazio (%s) e mantém a busca/retentativas',
    async (configuredId) => {
      if (configuredId === undefined)
        delete process.env.EXPO_PUBLIC_LRCLIB_APP_ID;
      else process.env.EXPO_PUBLIC_LRCLIB_APP_ID = configuredId;

      const fetchImpl = jest
        .fn()
        .mockResolvedValueOnce(response(503, '<html>indisponível</html>'))
        .mockResolvedValueOnce(response(200, [validTrack]));
      const waits: number[] = [];

      const result = await searchLrclibTracks(
        { title: 'Canção de ensaio' },
        {
          fetchImpl,
          sleep: async (milliseconds) => {
            waits.push(milliseconds);
          },
        },
      );

      expect(result).toHaveLength(1);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(waits).toEqual([5_000]);
      for (const [, init] of fetchImpl.mock.calls as [string, RequestInit][]) {
        expect(init.headers).toEqual({
          'Lrclib-Client': 'Setlist/1.2.3 (https://setlistbr.app.br)',
        });
        expect(init.headers).not.toHaveProperty('Lrclib-App-Id');
      }
    },
  );

  it('distingue uma lista vazia válida de uma resposta inválida', async () => {
    await expect(
      searchLrclibTracks(
        { title: 'Nada encontrado' },
        { fetchImpl: jest.fn().mockResolvedValue(response(200, [])) },
      ),
    ).resolves.toEqual([]);

    await expect(
      searchLrclibTracks(
        { title: 'Resposta inesperada' },
        {
          fetchImpl: jest.fn().mockResolvedValue(response(200, '<html/>')),
          sleep: async () => undefined,
        },
      ),
    ).rejects.toMatchObject({ reason: 'invalid-response', httpStatus: 200 });
  });

  it('trata limite de acesso como estado recuperável e respeita Retry-After', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        response(429, '<html>limite privado</html>', { 'Retry-After': '45' }),
      );
    const waits: number[] = [];

    await expect(
      searchLrclibTracks(
        { title: 'Canção de ensaio' },
        {
          fetchImpl,
          sleep: async (milliseconds) => {
            waits.push(milliseconds);
          },
        },
      ),
    ).rejects.toMatchObject({
      reason: 'rate-limited',
      httpStatus: 429,
      retryAfterMs: 45_000,
      attemptCount: 3,
      message: 'Não foi possível concluir a busca de música.',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([45_000, 45_000]);
  });

  it('não inclui corpos inválidos nas mensagens ou nos diagnósticos', async () => {
    const privateBody = 'texto privado da letra e anotação da banda';
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response(500, `<html>${privateBody}</html>`));
    const waits: number[] = [];

    const error = await searchLrclibTracks(
      { title: 'Canção de ensaio' },
      {
        fetchImpl,
        sleep: async (milliseconds) => {
          waits.push(milliseconds);
        },
      },
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      reason: 'unavailable',
      httpStatus: 500,
      attemptCount: 3,
      message: 'Não foi possível concluir a busca de música.',
    });
    expect(JSON.stringify(error)).not.toContain(privateBody);
    expect(waits).toEqual([5_000, 10_000]);
  });

  it('cancela sem interpretar cancelamento como indisponibilidade', async () => {
    const controller = new AbortController();
    const fetchImpl = jest.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      controller.abort();
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('cancelled');
          error.name = 'AbortError';
          reject(error);
        });
      });
    }) as unknown as typeof fetch;

    await expect(
      searchLrclibTracks(
        { title: 'Canção cancelada' },
        { fetchImpl, signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('para na segunda chamada quando a recuperação por 503 funciona', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        response(503, '<html>indisponível</html>', { 'Retry-After': '1.5' }),
      )
      .mockResolvedValueOnce(response(200, [validTrack]));
    const waits: number[] = [];
    const retryEvents: unknown[] = [];
    const attempts: number[] = [];

    const tracks = await searchLrclibTracks(
      { title: 'Canção de ensaio' },
      {
        fetchImpl,
        now: () => 10_000,
        sleep: async (milliseconds) => {
          waits.push(milliseconds);
        },
        onAttempt: (attempt) => attempts.push(attempt),
        onRetryWait: (event) => retryEvents.push(event),
      },
    );

    expect(tracks).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waits).toEqual([1_500]);
    expect(attempts).toEqual([1, 2]);
    expect(retryEvents).toEqual([
      {
        nextAttempt: 2,
        retryAt: 11_500,
        totalAttempts: 3,
        reason: 'unavailable',
        httpStatus: 503,
      },
    ]);
  });

  it('interpreta Retry-After como data HTTP sem repetir antes do horário', async () => {
    const now = Date.parse('2026-10-24T12:00:00.000Z');
    const retryAt = Date.parse('2026-10-24T12:00:07.000Z');
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        response(503, '<html>indisponível</html>', {
          'Retry-After': new Date(retryAt).toUTCString(),
        }),
      )
      .mockResolvedValueOnce(response(200, [validTrack]));
    const waits: number[] = [];

    await searchLrclibTracks(
      { title: 'Canção de ensaio' },
      {
        fetchImpl,
        now: () => now,
        sleep: async (milliseconds) => {
          waits.push(milliseconds);
        },
      },
    );

    expect(waits).toEqual([7_000]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('limita três respostas 503 a três chamadas e esperas de cinco e dez segundos', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response(503, '<html>indisponível</html>'));
    const waits: number[] = [];
    const attempts: number[] = [];

    await expect(
      searchLrclibTracks(
        { title: 'Canção de ensaio' },
        {
          fetchImpl,
          sleep: async (milliseconds) => {
            waits.push(milliseconds);
          },
          onAttempt: (attempt) => attempts.push(attempt),
        },
      ),
    ).rejects.toMatchObject({
      reason: 'unavailable',
      httpStatus: 503,
      attemptCount: 3,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(attempts).toEqual([1, 2, 3]);
    expect(waits).toEqual([5_000, 10_000]);
  });

  it('interrompe a espera e não inicia outra chamada após cancelamento', async () => {
    const controller = new AbortController();
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response(503, '<html>indisponível</html>'));
    const waits: number[] = [];

    await expect(
      searchLrclibTracks(
        { title: 'Canção de ensaio' },
        {
          fetchImpl,
          signal: controller.signal,
          sleep: async (milliseconds) => {
            waits.push(milliseconds);
            controller.abort();
          },
        },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(waits).toEqual([5_000]);
  });

  it('repete timeout da chamada até o limite de três tentativas', async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(() => new Promise<Response>(() => undefined));
    const waits: number[] = [];

    const result = searchLrclibTracks(
      { title: 'Canção lenta' },
      {
        fetchImpl,
        timeoutMs: 25,
        sleep: async (milliseconds) => {
          waits.push(milliseconds);
        },
      },
    );
    const rejection = expect(result).rejects.toMatchObject({
      reason: 'timeout',
      attemptCount: 3,
    });
    await jest.advanceTimersByTimeAsync(25);
    await jest.advanceTimersByTimeAsync(25);
    await jest.advanceTimersByTimeAsync(25);

    await rejection;
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([5_000, 10_000]);
    jest.useRealTimers();
  });
});
