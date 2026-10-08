import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  }),
  useRouter: () => mockRouter,
}));

async function pressCollectionAction(
  view: Awaited<ReturnType<typeof render>>,
  label: string,
) {
  await fireEvent.press(view.getByLabelText('Abrir coleções do repertório'));
  let parent = view.getByTestId('repertoire-action-menu').parent;
  while (parent && typeof parent.props.onDismiss !== 'function')
    parent = parent.parent;
  if (!parent) throw new Error('Modal de ações do repertório não encontrado');
  const dismiss = parent.props.onDismiss as () => void;
  await fireEvent.press(view.getByLabelText(label));
  if (dismiss) await act(async () => dismiss());
}

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
    expect(
      view.getAllByRole('link', { name: /Status da letra: Letra estática$/ })
        .length,
    ).toBeGreaterThan(0);
    expect(
      view.getAllByRole('link', {
        name: /Status da letra: Sincronização incompleta$/,
      }).length,
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
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    expect(
      view.getByLabelText('Alterar ordenação do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
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
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });

    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByText('Maior duração'));
    expect(
      view.getByLabelText('Alterar ordenação do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });

    expect(view.getByLabelText('Alterar ordenação do repertório')).toBeTruthy();
  });

  it('combina coleção, status e busca sem duplicar músicas e preserva a ordenação', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollectionSongs: [
        ...demoRepositoryData.repertoireCollectionSongs,
        {
          bandId: demoIds.primaryBand,
          collectionId: 'collection-demo-festa',
          songId: demoIds.stageSong,
          position: 2,
        },
      ],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Coleção das músicas')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Sincronizadas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Todas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByLabelText('Maior duração'));
    expect(
      view
        .getAllByText(/^(Luzes da Cidade|Maré de Neon)$/)
        .map((element) => element.props.children),
    ).toEqual(['Maré de Neon', 'Luzes da Cidade']);

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    expect(view.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Sem coleção'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Maré de Neon')).toBeNull();
  });

  it('mantém o espaço da toolbar fixo ao aplicar coleção e ocultar os controles na rolagem', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );
    await view.findByText('Luzes da Cidade');
    const list = view.getByTestId('repertoire-list');
    const spacer = view.getByTestId('repertoire-list-header-spacer');
    const reservedHeight = spacer.props.style.height;
    const areControlsHidden = () =>
      view.getByTestId('list-controls-collapse', {
        includeHiddenElements: true,
      }).props.accessibilityElementsHidden;

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(spacer.props.style.height).toBe(reservedHeight);

    await fireEvent(list, 'scrollBeginDrag', {});
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 60 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    expect(areControlsHidden()).toBe(true);
    expect(spacer.props.style.height).toBe(reservedHeight);

    await fireEvent(list, 'scrollBeginDrag', {});
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 30 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    expect(areControlsHidden()).toBe(false);
    expect(spacer.props.style.height).toBe(reservedHeight);
  });

  it('não apresenta opções de coleção no filtro quando a banda não tem coleções', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));

    expect(view.getByLabelText('Status das músicas')).toBeTruthy();
    expect(view.queryByLabelText('Coleção das músicas')).toBeNull();
    expect(view.queryByLabelText('Todas as coleções')).toBeNull();
    expect(view.queryByLabelText('Sem coleção')).toBeNull();
  });

  it('abre com a coleção indicada pela rota e preserva o filtro ao retornar', async () => {
    function RepertoireHarness({
      visible = true,
    }: {
      readonly visible?: boolean;
    }) {
      return (
        <AppProviders>
          {visible ? (
            <RepertoireScreen
              bandId={demoIds.primaryBand}
              initialCollectionId="collection-demo-festa"
            />
          ) : null}
        </AppProviders>
      );
    }

    const view = await render(<RepertoireHarness />);

    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.getByText('Luzes da Cidade')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });

    await view.rerender(<RepertoireHarness visible={false} />);
    await view.rerender(<RepertoireHarness />);

    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
  });

  it('restaura o filtro ao voltar do detalhe e mantém estado separado por banda durante o refresh', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const listCollections = jest.spyOn(
      repositories.repertoireCollections,
      'listByBandId',
    );
    function RepertoireHarness({
      bandId,
      visible = true,
    }: {
      readonly bandId: string;
      readonly visible?: boolean;
    }) {
      return (
        <AppProviders repositories={repositories}>
          {visible ? <RepertoireScreen bandId={bandId} /> : null}
        </AppProviders>
      );
    }

    const view = await render(
      <RepertoireHarness bandId={demoIds.primaryBand} />,
    );
    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    const list = view.getByTestId('repertoire-list');
    const callsBeforeRefresh = listCollections.mock.calls.length;
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 240 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    const refreshControl = list.props.refreshControl;
    expect(refreshControl).toBeTruthy();
    refreshControl.props.onRefresh();
    await waitFor(() =>
      expect(listCollections).toHaveBeenCalledTimes(callsBeforeRefresh + 1),
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    await view.rerender(
      <RepertoireHarness bandId={demoIds.primaryBand} visible={false} />,
    );
    await view.rerender(
      <RepertoireHarness bandId={demoIds.primaryBand} visible />,
    );
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
    expect(view.getByTestId('repertoire-list').props.contentOffset).toEqual({
      x: 0,
      y: 240,
    });
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await view.rerender(<RepertoireHarness bandId={demoIds.secondaryBand} />);
    expect(await view.findByText('Maré Serena')).toBeTruthy();
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.queryByLabelText('Coleção das músicas')).toBeNull();
    await fireEvent.press(view.getByLabelText('Fechar filtros'));

    await view.rerender(<RepertoireHarness bandId={demoIds.primaryBand} />);
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
  });

  it('remove o filtro da coleção excluída após confirmar a consulta e preserva os outros critérios', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const listCollections = jest.spyOn(
      repositories.repertoireCollections,
      'listByBandId',
    );
    const collection = demoRepositoryData.repertoireCollections.find(
      ({ id }) => id === 'collection-demo-festa',
    );
    if (!collection) throw new Error('Coleção Festa não encontrada');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Sincronizadas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'maré',
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    await repositories.repertoireCollections.delete({
      bandId: demoIds.primaryBand,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
    });
    const callsBeforeRefresh = listCollections.mock.calls.length;
    view.getByTestId('repertoire-list').props.refreshControl.props.onRefresh();
    await waitFor(() =>
      expect(listCollections).toHaveBeenCalledTimes(callsBeforeRefresh + 1),
    );

    expect(
      await view.findByTestId('collection-filter-removal-notice'),
    ).toBeTruthy();
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();
    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('maré');

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(
      view.getByLabelText('Todas as coleções').props.accessibilityState,
    ).toEqual({ checked: true });
    expect(
      view.getByLabelText('Sincronizadas').props.accessibilityState,
    ).toEqual({ checked: true });
  });

  it('mantém critério e músicas em caso de falha ao atualizar as coleções', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const listCollections = jest
      .spyOn(repositories.repertoireCollections, 'listByBandId')
      .mockResolvedValue(demoRepositoryData.repertoireCollections);
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'maré',
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    listCollections.mockRejectedValue(new Error('Falha de conexão'));
    await act(async () => {
      await view
        .getByTestId('repertoire-list')
        .props.refreshControl.props.onRefresh();
    });
    expect(view.queryByTestId('feedback-error')).toBeNull();

    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByTestId('collection-filter-removal-notice')).toBeNull();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });
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

    expect(await emptyView.findByText('Comece pelo repertório')).toBeTruthy();
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

  it('oferece a inclusão ao editor de uma banda conectada', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/bands/band-demo-horizonte/repertoire/new',
    );
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

  it('oferece acesso opcional às coleções também para pessoas Member', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Ver coleções');

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections`,
    );
    expect(view.queryByLabelText('Adicionar música ao repertório')).toBeNull();
  });

  it('preserva busca e filtros durante a seleção múltipla', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByText('Arquivadas'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'rota',
    );
    expect(view.getByText('Rota Antiga')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await pressCollectionAction(view, 'Selecionar músicas do repertório');

    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('rota');
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getByLabelText('Selecionar Rota Antiga')).toBeTruthy();
    expect(view.getByText('0 selecionadas')).toBeTruthy();
    await pressCollectionAction(view, 'Selecionar 1 resultado atual');
    expect(view.getByText('1 selecionada')).toBeTruthy();
  });

  it('retorna ao toque habitual e não grava ao cancelar a seleção', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const save = jest.spyOn(repositories.repertoireCollections, 'save');
    const appendSongs = jest.spyOn(
      repositories.repertoireCollections,
      'appendSongs',
    );
    const setSongCollections = jest.spyOn(
      repositories.repertoireCollections,
      'setSongCollections',
    );
    const deleteCollection = jest.spyOn(
      repositories.repertoireCollections,
      'delete',
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    expect(view.getByText('1 selecionada')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'luzes',
    );
    expect(view.getByText('1 selecionada')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    expect(view.getByText('2 selecionadas')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Cancelar seleção de músicas'));
    expect(view.getByLabelText('Abrir coleções do repertório')).toBeTruthy();
    expect(
      view.queryByLabelText('Selecionar músicas do repertório'),
    ).toBeNull();
    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('luzes');
    expect(
      view.queryByLabelText('Remover seleção de Luzes da Cidade'),
    ).toBeNull();
    expect(
      view.getByRole('link', { name: /Abrir música Luzes da Cidade/ }),
    ).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(appendSongs).not.toHaveBeenCalled();
    expect(setSongCollections).not.toHaveBeenCalled();
    expect(deleteCollection).not.toHaveBeenCalled();
  });

  it('não oferece seleção múltipla para pessoas Member', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');

    expect(
      view.queryByLabelText('Selecionar músicas do repertório'),
    ).toBeNull();
  });

  it('abre a criação da coleção com as músicas selecionadas', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );
    const lightsSong = demoRepositoryData.songs.find(
      ({ title }) => title === 'Luzes da Cidade',
    );
    const bridgesSong = demoRepositoryData.songs.find(
      ({ title }) => title === 'Entre Pontes',
    );
    if (!lightsSong || !bridgesSong) {
      throw new Error('Músicas de demonstração não encontradas');
    }

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await pressCollectionAction(
      view,
      'Criar coleção com 2 músicas selecionadas',
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/new?songId=${lightsSong.id}&songId=${bridgesSong.id}&returnTo=repertoire`,
    );
  });

  it('acrescenta somente músicas novas ao final da coleção escolhida', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const appendSpy = jest.spyOn(
      repositories.repertoireCollections,
      'appendSongs',
    );
    const bridgeSong = demoRepositoryData.songs.find(
      ({ title }) => title === 'Entre Pontes',
    );
    const lightsSong = demoRepositoryData.songs.find(
      ({ title }) => title === 'Luzes da Cidade',
    );
    const neonSong = demoRepositoryData.songs.find(
      ({ title }) => title === 'Maré de Neon',
    );
    if (!bridgeSong || !lightsSong || !neonSong) {
      throw new Error('Músicas de demonstração não encontradas');
    }

    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Maré de Neon'));
    expect(view.getByText('3 selecionadas')).toBeTruthy();
    await pressCollectionAction(
      view,
      'Adicionar 3 músicas selecionadas a uma coleção existente',
    );
    await fireEvent.press(view.getByLabelText('Selecionar coleção Festa'));

    expect(view.getByText('1 música nova será adicionada.')).toBeTruthy();
    expect(
      view.getByText(
        '2 músicas já fazem parte e manterão suas posições atuais.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar inclusão na coleção Festa'),
    );
    expect(
      await view.findByText(
        '1 música adicionada à coleção Festa. 2 já faziam parte da coleção.',
      ),
    ).toBeTruthy();
    expect(appendSpy).toHaveBeenCalledWith({
      bandId: demoIds.primaryBand,
      collectionId: 'collection-demo-festa',
      songIds: [bridgeSong.id, lightsSong.id, neonSong.id],
    });

    await fireEvent.press(view.getByLabelText('Concluir inclusão na coleção'));
    const finalCollectionSongs = (
      await repositories.repertoireCollections.listSongsByBandId(
        demoIds.primaryBand,
      )
    )
      .filter(({ collectionId }) => collectionId === 'collection-demo-festa')
      .sort((left, right) => left.position - right.position);
    expect(finalCollectionSongs).toEqual([
      {
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        position: 0,
        songId: demoIds.stageSong,
      },
      {
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        position: 1,
        songId: neonSong.id,
      },
      {
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        position: 2,
        songId: bridgeSong.id,
      },
    ]);
  });

  it('mantém a coleção sem alterações quando a inclusão falha', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const originalSongs =
      await repositories.repertoireCollections.listSongsByBandId(
        demoIds.primaryBand,
      );
    jest
      .spyOn(repositories.repertoireCollections, 'appendSongs')
      .mockRejectedValue(
        new RepertoireCollectionError(
          'request_failed',
          'Não foi possível atualizar a coleção agora.',
        ),
      );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await pressCollectionAction(
      view,
      'Adicionar 1 música selecionada a uma coleção existente',
    );
    await fireEvent.press(view.getByLabelText('Selecionar coleção Festa'));
    await fireEvent.press(
      view.getByLabelText('Confirmar inclusão na coleção Festa'),
    );

    expect(
      await view.findByText('Não foi possível atualizar a coleção agora.'),
    ).toBeTruthy();
    expect(
      await repositories.repertoireCollections.listSongsByBandId(
        demoIds.primaryBand,
      ),
    ).toEqual(originalSongs);
    expect(
      view.getByText('1 selecionada', { includeHiddenElements: true }),
    ).toBeTruthy();
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

    await view.findByText('Comece pelo repertório');
    expect(view.getByLabelText('Adicionar música ao repertório')).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/new`,
    );
  });
});
