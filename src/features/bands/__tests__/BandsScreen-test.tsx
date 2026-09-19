import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { createInMemoryRepositories } from '@/data/in-memory';
import { BandsScreen } from '@/features/bands/BandsScreen';
import {
  clearLastBandId,
  readLastBandId,
  writeLastBandId,
} from '@/features/bands/lastBandStorage';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('<BandsScreen />', () => {
  beforeEach(async () => {
    await clearLastBandId();
  });

  it('carrega Minhas bandas com os destinos demonstrativos', async () => {
    await writeLastBandId('band-demo-horizonte');
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
    expect(
      view.getByText(/A criação da banda e o aceite do termo/),
    ).toBeTruthy();
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

  it('persiste a banda escolhida para a próxima abertura', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.press(view.getByLabelText('Abrir Trio Aurora'));

    expect(await view.findByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
  });

  it('mostra o estado neutro quando a pessoa ainda não participa de uma banda', async () => {
    const view = await render(
      <AppProviders
        repositories={createInMemoryRepositories({
          bandMembers: [],
          bands: [],
          shows: [],
          songs: [],
        })}
      >
        <BandsScreen />
      </AppProviders>,
    );

    expect(await view.findByText('Seu palco ainda está vazio')).toBeTruthy();
    expect(
      view.getByText(
        'Crie uma banda ou abra o link de convite que você recebeu.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Criar banda')).toBeTruthy();
  });

  it('remove uma seleção persistida quando ela deixa de ser autorizada', async () => {
    await writeLastBandId('band-no-longer-authorized');

    const view = await render(
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await waitFor(async () => {
      expect(await readLastBandId()).toBeNull();
    });
    expect(view.queryByText('Última acessada')).toBeNull();
  });
});
