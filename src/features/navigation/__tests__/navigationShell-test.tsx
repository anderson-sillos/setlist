import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { rootStackScreenOptions } from '@/app/_layout';
import { demoIds } from '@/data/demo';
import {
  AuthSessionContext,
  type AuthSessionContextValue,
} from '@/features/auth/AuthSessionProvider';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';
import { ShowsScreen } from '@/features/shows/ShowsScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useLocalSearchParams: () => ({
    bandId: 'band-demo-horizonte',
    showId: 'show-demo-festival',
    songId: 'song-demo-luzes',
  }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('shell de navegação', () => {
  it('troca de tela sem animação e mantém os gestos de navegação', () => {
    expect(rootStackScreenOptions).toMatchObject({
      animation: 'none',
      fullScreenGestureEnabled: true,
      gestureEnabled: true,
    });
  });

  it.each([
    {
      height: 844,
      presentation: 'bottom-navigation',
      width: 390,
    },
    {
      height: 1180,
      presentation: 'bottom-navigation',
      width: 820,
    },
    {
      height: 768,
      presentation: 'navigation-sidebar',
      width: 1024,
    },
    {
      height: 900,
      presentation: 'navigation-sidebar',
      width: 1440,
    },
  ])(
    'usa $presentation em ${width}x${height}',
    async ({ height, presentation, width }) => {
      const view = await render(
        <AppProviders>
          <ShowsScreen
            bandId={demoIds.primaryBand}
            viewportHeight={height}
            viewportWidth={width}
          />
        </AppProviders>,
      );

      expect(await view.findByText('Festival da Praça')).toBeTruthy();
      expect(view.getByTestId(presentation)).toBeTruthy();
      expect(view.getByTestId('app-header')).toBeTruthy();
      expect(view.getByTestId('screen-static-area')).toBeTruthy();
      expect(view.getByTestId('shows-list')).toBeTruthy();

      if (presentation === 'bottom-navigation') {
        expect(view.queryByTestId('navigation-sidebar')).toBeNull();
        expect(view.getByLabelText('Ir para Palco')).toBeTruthy();
        const bottomNavigationStyle = StyleSheet.flatten(
          view.getByTestId('bottom-navigation').props.style,
        );
        expect(bottomNavigationStyle).toMatchObject({
          alignItems: 'center',
          justifyContent: 'space-evenly',
          minHeight: 52,
        });
        expect(bottomNavigationStyle.gap).toBeUndefined();
        expect(bottomNavigationStyle.marginHorizontal).toBeUndefined();
        expect(bottomNavigationStyle.paddingHorizontal).toBeUndefined();
        const navigationTabs = view.getAllByRole('tab');
        expect(navigationTabs).toHaveLength(4);
        navigationTabs.forEach((tab) => {
          const tabStyle = StyleSheet.flatten(tab.props.style);
          expect(tabStyle).toMatchObject({
            height: 48,
            width: 72,
          });
          expect(tabStyle.flexGrow).toBeUndefined();
          expect(tabStyle.marginHorizontal).toBeUndefined();
        });
        const navigationItemContents = view.getAllByTestId(
          'bottom-navigation-item-content',
        );
        expect(navigationItemContents).toHaveLength(4);
        navigationItemContents.forEach((content) => {
          expect(StyleSheet.flatten(content.props.style)).toMatchObject({
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          });
        });
      } else {
        expect(view.queryByTestId('bottom-navigation')).toBeNull();
      }
    },
  );

  it('abre e fecha o menu geral no celular', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          viewportHeight={844}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Abrir menu geral'));

    expect(view.getByTestId('navigation-drawer')).toBeTruthy();
    const myBandsLink = view.getByLabelText('Ir para Minhas bandas');
    const youtubePrototypeLink = view.getByLabelText(
      'Ir para Player YouTube (protótipo)',
    );

    expect(myBandsLink.props.accessibilityRole).toBe('tab');
    expect(myBandsLink.props.accessibilityState).toEqual({ selected: false });
    expect(youtubePrototypeLink.props.accessibilityRole).toBe('tab');
    expect(view.getByText('Conta de demonstração')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Sair' })).toBeTruthy();
    expect(view.queryByRole('tab', { name: 'Ir para Entrar' })).toBeNull();

    await fireEvent.press(view.getAllByLabelText('Fechar menu geral')[0]);
    await waitFor(() =>
      expect(view.queryByTestId('navigation-drawer')).toBeNull(),
    );
  });

  it('apresenta nome e e-mail da sessão no menu lateral', async () => {
    const session = {
      user: {
        email: 'lucas@example.com',
        user_metadata: { full_name: 'Lucas Ribeiro' },
      },
    } as never;
    const authSession: AuthSessionContextValue = {
      session,
      setSession: jest.fn(),
      status: 'authenticated',
    };

    const view = await render(
      <AuthSessionContext.Provider value={authSession}>
        <AppProviders>
          <ShowsScreen
            bandId={demoIds.primaryBand}
            viewportHeight={900}
            viewportWidth={1440}
          />
        </AppProviders>
      </AuthSessionContext.Provider>,
    );

    expect(await view.findByText('Lucas Ribeiro')).toBeTruthy();
    expect(view.getByText('lucas@example.com')).toBeTruthy();
    expect(view.queryByText('Conta de demonstração')).toBeNull();
  });

  it('mantém o aviso de conexão compacto abaixo do cabeçalho', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <AppProviders>
        <AppNavigationShell
          connectionStatus="required"
          currentRoute="/"
          onConnectionRetry={onRetry}
          title="Minhas bandas"
          viewportWidth={390}
        >
          <></>
        </AppNavigationShell>
      </AppProviders>,
    );

    expect(view.getByTestId('connection-required')).toBeTruthy();
    expect(view.getByText(/Reconecte para continuar/)).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('mantém a navegação inferior no detalhe e usa retorno no cabeçalho', async () => {
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
          viewportHeight={844}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByLabelText('Voltar para Repertório')).toBeTruthy();
    expect(view.getByTestId('bottom-navigation')).toBeTruthy();
    expect(view.queryByLabelText('Abrir menu geral')).toBeNull();
  });

  it.each([
    { height: 844, sidebar: false, width: 390 },
    { height: 1180, sidebar: false, width: 820 },
    { height: 900, sidebar: true, width: 1440 },
  ])(
    'reduz o cabeçalho de edição em ${width}x${height}',
    async ({ height, sidebar, width }) => {
      const onCancel = jest.fn();
      const onSave = jest.fn();
      const view = await render(
        <AppProviders>
          <AppNavigationShell
            activeSection="repertoire"
            bandId={demoIds.primaryBand}
            bandName="Banda Horizonte"
            currentRoute={`/bands/${demoIds.primaryBand}/repertoire/demo/edit`}
            editActions={{ onCancel, onSave }}
            screenKind="edit"
            title="Editar música"
            viewportHeight={height}
            viewportWidth={width}
          >
            <></>
          </AppNavigationShell>
        </AppProviders>,
      );

      await fireEvent.press(view.getByLabelText('Cancelar edição'));
      await fireEvent.press(view.getByLabelText('Salvar edição'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('bottom-navigation')).toBeNull();
      expect(view.queryByLabelText('Abrir menu geral')).toBeNull();
      expect(Boolean(view.queryByTestId('navigation-sidebar'))).toBe(sidebar);
    },
  );
});
