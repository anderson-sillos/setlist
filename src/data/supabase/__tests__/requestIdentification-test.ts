import { Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';
import {
  createSupabaseRequestFetch,
  formatSetlistClientInfo,
  formatSetlistUserAgent,
} from '@/data/supabase/requestIdentification';

jest.mock('@/config/appRelease', () => ({
  getAppReleaseInfo: jest.fn(),
}));

const releaseInfo = jest.mocked(getAppReleaseInfo);
const initialPlatform = Platform.OS;
const initialPlatformVersion = Platform.Version;
const initialAndroidConstants = Platform.constants;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  Object.defineProperty(Platform, 'constants', {
    configurable: true,
    value: { ...initialAndroidConstants, Release: '15' },
  });
  releaseInfo.mockReturnValue({
    version: '1.0.0',
    codeVersion: '1.0.0',
    installedVersion: '1.0.0',
    build: '4',
    commit: 'abcdef0123456789abcdef0123456789abcdef01',
    tag: 'v1.0.0',
    environment: 'Produção',
    platform: 'Android',
  });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: initialPlatform,
  });
  Object.defineProperty(Platform, 'constants', {
    configurable: true,
    value: initialAndroidConstants,
  });
  Object.defineProperty(Platform, 'Version', {
    configurable: true,
    value: initialPlatformVersion,
  });
});

it('formata os metadados de release disponíveis e omite valores ausentes', () => {
  expect(
    formatSetlistClientInfo({
      version: '1.0.0',
      build: null,
      platform: 'web',
      operatingSystemVersion: null,
      environment: 'development',
      commit: null,
    }),
  ).toBe('setlist/1.0.0; platform=web; env=development');
});

it('formata um User-Agent nativo e não cria um para web', () => {
  expect(
    formatSetlistUserAgent({
      version: '1.0.0',
      build: '4',
      platform: 'ios',
      operatingSystemVersion: '18.6',
      environment: 'production',
      commit: 'abcdef0',
    }),
  ).toBe('Setlist/1.0.0 (iOS 18.6; build 4)');
  expect(
    formatSetlistUserAgent({
      version: '1.0.0',
      build: null,
      platform: 'web',
      operatingSystemVersion: null,
      environment: 'production',
      commit: null,
    }),
  ).toBeNull();
});

it('acrescenta os dados Setlist e preserva SDK, autorização, chave, corpo e trace', async () => {
  const fetchMock = jest.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  const identifiedFetch = createSupabaseRequestFetch(
    fetchMock as unknown as typeof fetch,
  );

  await identifiedFetch('https://example.supabase.co/rest/v1/bands', {
    method: 'POST',
    headers: {
      'X-Client-Info': 'supabase-js/2.x; runtime=react-native',
      Authorization: 'Bearer token',
      apikey: 'public-key',
      'Content-Type': 'application/json',
      traceparent: '00-trace',
    },
    body: '{"name":"Demo"}',
  });

  const [, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init?.headers);
  expect(headers.get('X-Client-Info')).toBe(
    'supabase-js/2.x; runtime=react-native; setlist/1.0.0; build=4; platform=android; os=15; env=production; commit=abcdef0',
  );
  expect(headers.get('Authorization')).toBe('Bearer token');
  expect(headers.get('apikey')).toBe('public-key');
  expect(headers.get('Content-Type')).toBe('application/json');
  expect(headers.get('traceparent')).toBe('00-trace');
  expect(headers.get('User-Agent')).toBe('Setlist/1.0.0 (Android 15; build 4)');
  expect(init?.body).toBe('{"name":"Demo"}');
});

it('preserva os cabeçalhos de um Request e mantém o User-Agent web', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'web',
  });
  releaseInfo.mockReturnValue({
    version: '1.0.0',
    codeVersion: '1.0.0',
    installedVersion: null,
    build: null,
    commit: null,
    tag: null,
    environment: 'Desenvolvimento',
    platform: 'Web',
  });
  const fetchMock = jest.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  const identifiedFetch = createSupabaseRequestFetch(
    fetchMock as unknown as typeof fetch,
  );
  const request = new Request('https://example.supabase.co/rest/v1/bands', {
    headers: {
      'X-Client-Info': 'supabase-js/2.x; runtime=web',
      'X-Request-Header': 'preserved',
      'User-Agent': 'Browser/1.0',
    },
  });

  await identifiedFetch(request);

  const [forwardedRequest, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init?.headers);
  expect(headers.get('X-Client-Info')).toBe(
    'supabase-js/2.x; runtime=web; setlist/1.0.0; platform=web; env=development',
  );
  expect(headers.get('X-Request-Header')).toBe('preserved');
  expect(headers.get('User-Agent')).toBe('Browser/1.0');
  expect(forwardedRequest).toBe(request);
});

it('usa a versão legível do iOS e informa a plataforma no User-Agent', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'ios',
  });
  Object.defineProperty(Platform, 'Version', {
    configurable: true,
    value: '18.6',
  });
  releaseInfo.mockReturnValue({
    version: '1.0.0',
    codeVersion: '1.0.0',
    installedVersion: '1.0.0',
    build: '4',
    commit: null,
    tag: null,
    environment: 'Produção',
    platform: 'iOS',
  });
  const fetchMock = jest.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  const identifiedFetch = createSupabaseRequestFetch(
    fetchMock as unknown as typeof fetch,
  );

  await identifiedFetch('https://example.supabase.co/auth/v1/token', {
    headers: { 'X-Client-Info': 'supabase-js/2.x; runtime=react-native' },
  });

  const [, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init?.headers);
  expect(headers.get('X-Client-Info')).toContain(
    'setlist/1.0.0; build=4; platform=ios; os=18.6; env=production',
  );
  expect(headers.get('User-Agent')).toBe('Setlist/1.0.0 (iOS 18.6; build 4)');
});
