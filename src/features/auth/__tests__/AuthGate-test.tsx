import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppText } from '@/components/ui/AppText';
import { AuthGate } from '@/features/auth/AuthGate';
import {
  AuthSessionContext,
  type AuthSessionContextValue,
} from '@/features/auth/AuthSessionProvider';

let mockSegments: string[] = ['index'];

jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
}));

jest.mock('@/features/auth/AuthScreen', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    AuthScreen: () => React.createElement(Text, null, 'Tela de login'),
  };
});

function renderGate(
  value: AuthSessionContextValue,
  children: ReactNode = <AppText>Conteúdo protegido</AppText>,
) {
  return render(
    <AuthSessionContext.Provider value={value}>
      <AuthGate>{children}</AuthGate>
    </AuthSessionContext.Provider>,
  );
}

function createValue(
  status: AuthSessionContextValue['status'],
): AuthSessionContextValue {
  return {
    session: null,
    setSession: jest.fn(),
    status,
  };
}

describe('guarda de autenticação', () => {
  afterEach(() => {
    mockSegments = ['index'];
  });

  it('mostra o carregamento enquanto confere a sessão', async () => {
    const view = await renderGate(createValue('loading'));

    expect(
      view.getByRole('progressbar', { name: 'Conferindo seu acesso…' }),
    ).toBeTruthy();
  });

  it('mostra o login em uma rota privada sem sessão', async () => {
    const view = await renderGate(createValue('unauthenticated'));

    expect(view.getByText('Tela de login')).toBeTruthy();
    expect(view.queryByText('Conteúdo protegido')).toBeNull();
  });

  it('libera a rota privada para uma sessão autenticada', async () => {
    const view = await renderGate(createValue('authenticated'));

    expect(view.getByText('Conteúdo protegido')).toBeTruthy();
  });

  it('mantém as rotas de autenticação acessíveis sem sessão', async () => {
    mockSegments = ['auth'];
    const view = await renderGate(createValue('unauthenticated'));

    expect(view.getByText('Conteúdo protegido')).toBeTruthy();

    mockSegments = ['invite', '[token]'];
    const inviteView = await renderGate(
      createValue('unauthenticated'),
      <AppText>Convite</AppText>,
    );
    expect(inviteView.getByText('Convite')).toBeTruthy();
  });
});
