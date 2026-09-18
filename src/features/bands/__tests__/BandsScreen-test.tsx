import { fireEvent, render } from '@testing-library/react-native';

import { BandsScreen } from '@/features/bands/BandsScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
}));

describe('<BandsScreen />', () => {
  it('carrega Minhas bandas com os destinos demonstrativos', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportHeight={900}
          viewportWidth={1440}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.getByLabelText('Abrir Banda Horizonte')).toBeTruthy();
    expect(view.getByTestId('bands-list')).toBeTruthy();
    expect(view.getByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Proprietário')).toBeTruthy();
    expect(view.getByText('Integrante')).toBeTruthy();
    expect(
      view.getByLabelText('Ir para Minhas bandas').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getAllByText(/Próximo show/)).toHaveLength(2);
    expect(
      view.getByText('Próximo show · sáb, 19 de set. de 2026 · 16h'),
    ).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Criar banda'));
    expect(view.getByTestId('demo-action-notice')).toBeTruthy();
    expect(view.getByText(/A criação entra junto com o login/)).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Fechar aviso de demonstração'));
    expect(view.queryByTestId('demo-action-notice')).toBeNull();
  });

  it('busca bandas pelo nome', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.changeText(
      view.getByLabelText('Buscar banda pelo nome'),
      'aurora',
    );

    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.queryByText('Banda Horizonte')).toBeNull();
  });
});
