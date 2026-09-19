import { Platform } from 'react-native';

import {
  getAuthCallbackPath,
  getDevelopmentUrl,
  getInvitePath,
  getSingleRouteParam,
} from '@/features/auth/authLinks';

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `setlist://${path}`,
}));

describe('rotas de convite e OAuth', () => {
  it('codifica o token no caminho do convite e permite marcar retomada', () => {
    expect(getInvitePath('convite com espaço')).toBe(
      '/invite/convite%20com%20espa%C3%A7o',
    );
    expect(getInvitePath('convite-demo', { resumed: true })).toBe(
      '/invite/convite-demo?resumed=1',
    );
  });

  it('gera o retorno real preservando somente o contexto do convite', () => {
    expect(getAuthCallbackPath('invite/demo')).toBe(
      '/auth/callback?invite_token=invite%2Fdemo',
    );
    expect(getAuthCallbackPath()).toBe('/auth/callback');
  });

  it('aceita tanto parâmetro único quanto repetido do Expo Router', () => {
    expect(getSingleRouteParam('token')).toBe('token');
    expect(getSingleRouteParam(['token', 'outro'])).toBe('token');
    expect(getSingleRouteParam(undefined)).toBeUndefined();
  });

  it('gera uma URL de desenvolvimento a partir do caminho da rota', () => {
    expect(getDevelopmentUrl('/invite/demo')).toContain('invite/demo');
  });

  it('preserva o base path do bundle web hospedado no callback', () => {
    const originalPlatform = Platform.OS;
    const originalWindow = (globalThis as { window?: unknown }).window;
    const originalDocument = (globalThis as { document?: unknown }).document;

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          href: 'https://anderson-sillos.github.io/setlist/app/',
          origin: 'https://anderson-sillos.github.io',
        },
      },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        querySelector: () => ({
          getAttribute: () => '/setlist/app/_expo/static/js/web/entry.js',
        }),
      },
    });

    try {
      expect(getDevelopmentUrl('/auth/callback')).toMatch(
        /\/setlist\/app\/auth\/callback$/,
      );
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });

      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: originalWindow,
        });
      }

      if (originalDocument === undefined) {
        delete (globalThis as { document?: unknown }).document;
      } else {
        Object.defineProperty(globalThis, 'document', {
          configurable: true,
          value: originalDocument,
        });
      }
    }
  });
});
