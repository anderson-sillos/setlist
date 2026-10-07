import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';
import { AboutScreen } from '@/features/about/AboutScreen';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('@/config/appRelease', () => ({ getAppReleaseInfo: jest.fn() }));
jest.mock('@/features/navigation/AppNavigationShell', () => ({
  AppNavigationShell: jest.fn(
    ({ children }: { children: ReactNode }) => children,
  ),
}));

const mockInfo = jest.mocked(getAppReleaseInfo);
const mockParams = jest.mocked(useLocalSearchParams);
const initialPlatform = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  mockParams.mockReturnValue({});
  mockInfo.mockReturnValue({
    version: '1.0.0',
    build: '2',
    environment: 'Produção',
    platform: 'iOS',
    tag: 'v1.0.0-rc.1',
    commit: 'a'.repeat(40),
  });
});

afterEach(() => jest.restoreAllMocks());
afterAll(() =>
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: initialPlatform,
  }),
);

it('apresenta o aplicativo e sua identificação', async () => {
  const view = await render(<AboutScreen />);
  expect(view.getByText('Setlist')).toBeTruthy();
  expect(view.getByText('1.0.0')).toBeTruthy();
  expect(view.getByText('2')).toBeTruthy();
  expect(view.getByText('v1.0.0-rc.1')).toBeTruthy();
  expect(view.getByText('aaaaaaa')).toBeTruthy();
  expect(view.getByText('Produção')).toBeTruthy();
});

it('informa a ausência de identificação de um client antigo', async () => {
  mockInfo.mockReturnValue({
    ...getAppReleaseInfo(),
    build: null,
    commit: null,
    tag: null,
  });
  const view = await render(<AboutScreen />);
  expect(view.getByText('Não informado')).toBeTruthy();
  expect(view.queryByText('Código')).toBeNull();
  expect(view.queryByText('Release')).toBeNull();
});

it('não apresenta contador nativo na Web', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const view = await render(<AboutScreen />);
  expect(view.queryByText('Build')).toBeNull();
});

it.each([
  ['Termos de uso', 'https://setlistbr.app.br/termos/'],
  ['Política de privacidade', 'https://setlistbr.app.br/privacidade/'],
  ['Notas das versões', 'https://github.com/anderson-sillos/setlist/releases'],
])('abre o link %s', async (label, url) => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const view = await render(<AboutScreen />);
  await fireEvent.press(view.getByRole('button', { name: label }));
  await waitFor(() => expect(open).toHaveBeenCalledWith(url));
});

it('permite recuperar uma falha ao abrir o link', async () => {
  const open = jest
    .spyOn(Linking, 'openURL')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(undefined);
  const view = await render(<AboutScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Termos de uso' }));
  expect(
    view.getByText('Não foi possível abrir o link. Tente novamente.'),
  ).toBeTruthy();
  await fireEvent.press(view.getByRole('button', { name: 'Termos de uso' }));
  await waitFor(() => expect(open).toHaveBeenCalledTimes(2));
  expect(view.queryByRole('alert')).toBeNull();
});

it.each([
  ['/bands/band-1/repertoire', '/bands/band-1/repertoire'],
  ['https://example.com', '/'],
  [undefined, '/'],
])(
  'mantém um destino interno seguro ao voltar: %s',
  async (returnTo, expected) => {
    mockParams.mockReturnValue(returnTo ? { returnTo } : {});
    await render(<AboutScreen />);
    expect(
      jest.mocked(AppNavigationShell).mock.calls.at(-1)?.[0].backHref,
    ).toBe(expected);
  },
);
