import { fireEvent, render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => mockRouter,
}));

describe('<RepertoireScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('apresenta o repertório e os metadados em modo somente leitura', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={820} />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByTestId('repertoire-list')).toBeTruthy();
    expect(view.getAllByText('Letra estática').length).toBeGreaterThan(0);
    expect(
      view.getAllByText('Sincronização incompleta').length,
    ).toBeGreaterThan(0);
    expect(view.getByText('3min38s')).toBeTruthy();
    expect(view.queryByText('Duração')).toBeNull();
    expect(view.queryByText(/Tom G · BPM/)).toBeNull();
  });

  it('busca, filtra e ordena o repertório sem tirar os controles da tela', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={390} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );

    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'coletivo atlantico',
    );

    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByText('Arquivadas'));

    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByText('Maior duração'));

    expect(view.getByLabelText('Alterar ordenação do repertório')).toBeTruthy();
  });

  it('apresenta estados vazios e permite limpar uma busca sem resultado', async () => {
    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const emptyView = await render(
      <AppProviders repositories={emptyRepositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Repertório vazio')).toBeTruthy();
    await emptyView.unmount();

    const searchView = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await searchView.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      searchView.getByLabelText('Buscar música por título ou artista'),
      'música que não existe',
    );
    expect(searchView.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(searchView.getByText('Limpar filtros'));
    expect(await searchView.findByText('Luzes da Cidade')).toBeTruthy();
  });

  it('oferece a inclusão ao editor e explica o limite das bandas demo', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(view.getByTestId('demo-action-notice')).toBeTruthy();
    expect(
      view.getByText(/músicas de demonstração são só para consulta/i),
    ).toBeTruthy();
  });

  it('não oferece inclusão para uma pessoa Member', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    expect(view.queryByLabelText('Adicionar música ao repertório')).toBeNull();
  });

  it('leva Owner de uma banda conectada à criação online', async () => {
    const bandId = 'band-live';
    const repositories = createInMemoryRepositories({
      bands: [{ ...demoRepositoryData.bands[0], id: bandId }],
      bandMembers: [{ ...demoRepositoryData.bandMembers[0], bandId }],
      shows: [],
      songs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByText('Repertório vazio');
    expect(view.getByText('Adicionar música')).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/new`,
    );
  });
});
