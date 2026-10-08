import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone', expoConfig: null },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

const mockNative = jest.mocked(requireOptionalNativeModule);
const constants = jest.requireMock('expo-constants').default as {
  executionEnvironment: string;
  expoConfig: {
    version?: string;
    extra?: { release?: { commit?: unknown; tag?: unknown } };
  } | null;
};
const initialPlatform = Platform.OS;
const initialEnvironment = process.env.EXPO_PUBLIC_APP_ENV;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  constants.executionEnvironment = 'standalone';
  constants.expoConfig = { version: '1.0.0' };
  mockNative.mockReturnValue(null);
  process.env.EXPO_PUBLIC_APP_ENV = 'development';
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: initialPlatform,
  });
  if (initialEnvironment === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
  else process.env.EXPO_PUBLIC_APP_ENV = initialEnvironment;
});

it('consulta a versão e o build reais do binário Setlist', () => {
  mockNative.mockReturnValue({
    applicationId: 'com.andersonsillos.setlist',
    nativeApplicationVersion: '1.0.0',
    nativeBuildVersion: '12',
  } as never);
  constants.expoConfig = { version: '1.1.0' };
  expect(getAppReleaseInfo()).toMatchObject({
    version: '1.0.0',
    installedVersion: '1.0.0',
    codeVersion: '1.0.0',
    build: '12',
    platform: 'Android',
  });
});

it('preserva o fallback em um client antigo sem o módulo', () => {
  expect(getAppReleaseInfo()).toMatchObject({
    version: '1.0.0',
    codeVersion: '1.0.0',
    installedVersion: null,
    build: null,
  });
});

it('usa app.json quando a configuração Expo não está disponível', () => {
  constants.expoConfig = null;
  expect(getAppReleaseInfo().version).toBe('1.0.0');
});

it('usa a versão do código mesmo quando o manifesto iOS mantém uma versão anterior', () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  constants.expoConfig = { version: '0.1.0' };
  expect(getAppReleaseInfo()).toMatchObject({
    version: '1.0.0',
    codeVersion: '1.0.0',
    installedVersion: null,
    build: null,
    platform: 'iOS',
  });
});

it('distingue um binário antigo do código atual sem inventar a versão instalada', () => {
  mockNative.mockReturnValue({
    applicationId: 'com.andersonsillos.setlist',
    nativeApplicationVersion: '0.1.0',
    nativeBuildVersion: '1',
  } as never);
  constants.expoConfig = { version: '0.1.0' };
  expect(getAppReleaseInfo()).toMatchObject({
    version: '0.1.0',
    installedVersion: '0.1.0',
    codeVersion: '1.0.0',
    build: '1',
  });
});

it('não confunde a versão do Expo Go com Setlist', () => {
  constants.executionEnvironment = 'storeClient';
  expect(getAppReleaseInfo().build).toBeNull();
  expect(mockNative).not.toHaveBeenCalled();
});

it('ignora o binário de outro aplicativo', () => {
  mockNative.mockReturnValue({
    applicationId: 'host.example',
    nativeApplicationVersion: '57.0.0',
    nativeBuildVersion: '900',
  } as never);
  expect(getAppReleaseInfo()).toMatchObject({ version: '1.0.0', build: null });
});

it('identifica iOS e usa o fallback para constantes nativas ausentes', () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  mockNative.mockReturnValue({
    applicationId: 'com.andersonsillos.setlist',
  } as never);
  expect(getAppReleaseInfo()).toMatchObject({
    version: '1.0.0',
    build: null,
    platform: 'iOS',
  });
});

it('consulta somente os metadados do export na Web', () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  constants.expoConfig = {
    version: '1.0.0',
    extra: { release: { commit: 'a'.repeat(40), tag: 'v1.0.0-rc.1' } },
  };
  expect(getAppReleaseInfo()).toMatchObject({
    version: '1.0.0',
    platform: 'Web',
    commit: 'a'.repeat(40),
    tag: 'v1.0.0-rc.1',
    build: null,
  });
  expect(mockNative).not.toHaveBeenCalled();
});

it.each([undefined, 123, 'commit-invalido'])(
  'omite um identificador de código inválido: %s',
  (commit) => {
    constants.expoConfig = { extra: { release: { commit, tag: 123 } } };
    expect(getAppReleaseInfo()).toMatchObject({
      commit: null,
      tag: null,
      version: '1.0.0',
    });
  },
);

it('identifica o ambiente de produção', () => {
  process.env.EXPO_PUBLIC_APP_ENV = 'production';
  expect(getAppReleaseInfo().environment).toBe('Produção');
});
