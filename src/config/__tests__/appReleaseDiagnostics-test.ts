jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'standalone',
    expoConfig: { version: '1.0.0' },
  },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('@/config/appRelease', () => ({
  getAppReleaseInfo: jest.fn(),
}));

function setup() {
  jest.resetModules();
  const constants = jest.requireMock('expo-constants').default as {
    executionEnvironment: string;
    expoConfig: { version?: string } | null;
  };
  const releaseModule = jest.requireMock('@/config/appRelease') as {
    getAppReleaseInfo: jest.Mock;
  };
  const { Platform } = jest.requireActual(
    'react-native',
  ) as typeof import('react-native');
  const { reportAppReleaseDiagnostics } = jest.requireActual(
    '../appReleaseDiagnostics',
  ) as typeof import('../appReleaseDiagnostics');

  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  constants.executionEnvironment = 'standalone';
  constants.expoConfig = { version: '1.0.0' };
  releaseModule.getAppReleaseInfo.mockReturnValue({
    build: '4',
    codeVersion: '1.0.0',
    commit: null,
    environment: 'Desenvolvimento',
    installedVersion: '1.0.0',
    platform: 'iOS',
    tag: null,
    version: '1.0.0',
  });

  return { constants, releaseModule, Platform, reportAppReleaseDiagnostics };
}

describe('reportAppReleaseDiagnostics', () => {
  const originalDevDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    '__DEV__',
  );

  beforeEach(() => {
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: true,
    });
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalDevDescriptor) {
      Object.defineProperty(globalThis, '__DEV__', originalDevDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, '__DEV__');
    }
  });

  it('não registra nada fora do modo de desenvolvimento', () => {
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: false,
    });
    const { reportAppReleaseDiagnostics } = setup();
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    reportAppReleaseDiagnostics();

    expect(info).not.toHaveBeenCalled();
  });

  it('registra manifesto divergente, binário antigo e metadados nativos ausentes', () => {
    const { constants, releaseModule, reportAppReleaseDiagnostics } = setup();
    constants.expoConfig = { version: '0.1.0' };
    releaseModule.getAppReleaseInfo.mockReturnValue({
      build: null,
      codeVersion: '1.0.0',
      commit: null,
      environment: 'Desenvolvimento',
      installedVersion: '0.1.0',
      platform: 'iOS',
      tag: null,
      version: '0.1.0',
    });
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    reportAppReleaseDiagnostics();

    const report = info.mock.calls[0]?.[0] as string;
    expect(report).toContain('O manifesto difere do código carregado.');
    expect(report).toContain('O binário instalado difere do código carregado.');
    expect(report).toContain('Não foi possível identificar a versão/build');
  });

  it('avisa quando o manifesto está ausente e a versão nativa não pode ser lida', () => {
    const { constants, releaseModule, reportAppReleaseDiagnostics } = setup();
    constants.expoConfig = null;
    releaseModule.getAppReleaseInfo.mockReturnValue({
      build: null,
      codeVersion: '1.0.0',
      commit: null,
      environment: 'Desenvolvimento',
      installedVersion: null,
      platform: 'iOS',
      tag: null,
      version: '1.0.0',
    });
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    reportAppReleaseDiagnostics();

    expect(info.mock.calls[0]?.[0]).toContain(
      'Não foi possível identificar a versão/build',
    );
  });

  it('não exige versão nativa no Expo Go nem na Web', () => {
    const first = setup();
    first.constants.executionEnvironment = 'storeClient';
    first.releaseModule.getAppReleaseInfo.mockReturnValue({
      build: null,
      codeVersion: '1.0.0',
      commit: null,
      environment: 'Desenvolvimento',
      installedVersion: null,
      platform: 'iOS',
      tag: null,
      version: '1.0.0',
    });
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    first.reportAppReleaseDiagnostics();
    expect(info.mock.calls[0]?.[0]).not.toContain('versão/build');

    const second = setup();
    Object.defineProperty(second.Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    second.releaseModule.getAppReleaseInfo.mockReturnValue({
      build: null,
      codeVersion: '1.0.0',
      commit: null,
      environment: 'Desenvolvimento',
      installedVersion: null,
      platform: 'Web',
      tag: null,
      version: '1.0.0',
    });
    second.reportAppReleaseDiagnostics();
    expect(info.mock.calls[1]?.[0]).not.toContain('versão/build');
  });

  it('omite relatórios idênticos consecutivos', () => {
    const { reportAppReleaseDiagnostics } = setup();
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    reportAppReleaseDiagnostics();
    reportAppReleaseDiagnostics();

    expect(info).toHaveBeenCalledTimes(1);
  });
});
