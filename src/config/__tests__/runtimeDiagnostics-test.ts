jest.mock('@/config/appRelease', () => ({
  getAppReleaseInfo: jest.fn(() => ({
    build: '4',
    commit: 'a'.repeat(40),
    environment: 'Desenvolvimento',
    platform: 'iOS',
    version: '1.0.0',
  })),
}));

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (handler: GlobalHandler) => void;
};

function loadDiagnostics() {
  jest.resetModules();
  return jest.requireActual(
    '../runtimeDiagnostics',
  ) as typeof import('../runtimeDiagnostics');
}

describe('diagnósticos de runtime', () => {
  const initialErrorUtils = (
    globalThis as typeof globalThis & {
      ErrorUtils?: ErrorUtilsLike;
    }
  ).ErrorUtils;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.restoreAllMocks();
    delete (globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike })
      .ErrorUtils;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    if (initialErrorUtils) {
      (
        globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike }
      ).ErrorUtils = initialErrorUtils;
    } else {
      delete (globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike })
        .ErrorUtils;
    }
  });

  it('correlaciona eventos de logout e deixa de registrar eventos após o encerramento', () => {
    const diagnostics = loadDiagnostics();
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const attemptId = diagnostics.beginLogoutDiagnostics('menu');

    diagnostics.logLogoutDiagnostic(attemptId, 'auth_gate_transition', {
      status: 'signed_out',
    });
    diagnostics.logSignedOutAuthEvent();
    diagnostics.logAuthGateState('signed_out', true);
    diagnostics.finishLogoutDiagnostics(attemptId, 'succeeded');
    jest.advanceTimersByTime(15_000);
    diagnostics.logSignedOutAuthEvent();

    expect(info.mock.calls.map(([message]) => String(message))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"event":"started"'),
        expect.stringContaining('"event":"auth_gate_transition"'),
        expect.stringContaining('"event":"supabase_signed_out_event"'),
        expect.stringContaining('"event":"finished"'),
      ]),
    );
    expect(info.mock.calls.at(-1)?.[0]).toContain('"outcome":"succeeded"');
  });

  it('redige tokens e emails de erros, limita detalhes e aceita erros não Error', () => {
    const diagnostics = loadDiagnostics();
    const error = new Error(
      'Bearer secret eyJheader.payload.signature user@example.com?access_token=abc&code=xyz',
    );
    error.stack = `${error.message}\n at fn (refresh_token=def)`;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const attemptId = diagnostics.beginLogoutDiagnostics('menu');

    diagnostics.logLogoutFailure(attemptId, 'supabase_sign_out', error);
    diagnostics.logLogoutFailure('stale-attempt', 'cleanup', 'network failed');

    const logs = errorSpy.mock.calls.map(([message]) => String(message));
    expect(logs[0]).toContain('Bearer [redacted]');
    expect(logs[0]).toContain('[redacted-jwt]');
    expect(logs[0]).toContain('[redacted-email]');
    expect(logs[0]).toContain('access_token=[redacted]');
    expect(logs[0]).toContain('refresh_token=[redacted]');
    expect(logs[1]).toContain('"errorName":"string"');
    expect(logs[1]).toContain('"errorStack":null');
  });

  it('registra a ausência de stack e não encerra uma tentativa ativa por ID obsoleto', () => {
    const diagnostics = loadDiagnostics();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const attemptId = diagnostics.beginLogoutDiagnostics('menu');
    const error = new Error('falha sem stack');
    error.stack = undefined;

    diagnostics.logLogoutFailure(attemptId, 'cleanup', error);
    diagnostics.finishLogoutDiagnostics('stale-attempt', 'succeeded');
    diagnostics.logSignedOutAuthEvent();

    expect(errorSpy.mock.calls[0]?.[0]).toContain('"errorStack":null');
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"supabase_signed_out_event"'),
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('substitui metadados de versão indisponíveis e não deixa falha de log afetar o app', () => {
    const diagnostics = loadDiagnostics();
    const getRelease = jest.requireMock('@/config/appRelease')
      .getAppReleaseInfo as jest.Mock;
    getRelease.mockImplementationOnce(() => {
      throw new Error('release unavailable');
    });
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const circular: { self?: unknown } = {};
    circular.self = circular;

    diagnostics.beginLogoutDiagnostics('menu');
    diagnostics.logLogoutDiagnostic('test', 'bad_detail', circular);

    expect(info.mock.calls[0]?.[0]).toContain('"platform":"ios"');
    expect(info.mock.calls[1]).toBeUndefined();
  });

  it('instala o handler fatal uma vez e preserva o handler nativo', () => {
    const diagnostics = loadDiagnostics();
    const original = jest.fn<
      ReturnType<GlobalHandler>,
      Parameters<GlobalHandler>
    >();
    let current: GlobalHandler = original;
    const setGlobalHandler = jest.fn((handler: GlobalHandler) => {
      current = handler;
    });
    (
      globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike }
    ).ErrorUtils = {
      getGlobalHandler: () => current,
      setGlobalHandler,
    };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    diagnostics.installFatalJavaScriptDiagnostics();
    diagnostics.installFatalJavaScriptDiagnostics();
    current(new Error('crash'), true);

    expect(setGlobalHandler).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Setlist:fatal-js]'),
    );
    expect(original).toHaveBeenCalledWith(expect.any(Error), true);
  });

  it('não instala o handler fatal quando o runtime não disponibiliza ErrorUtils', () => {
    const diagnostics = loadDiagnostics();

    expect(() => diagnostics.installFatalJavaScriptDiagnostics()).not.toThrow();
  });
});
