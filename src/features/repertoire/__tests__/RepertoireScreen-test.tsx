import { fireEvent, render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
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
    await fireEvent.press(view.getByLabelText('Abrir coleções do repertório'));

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

    await fireEvent.press(
      view.getByLabelText('Selecionar músicas do repertório'),
    );

    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('rota');
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getByLabelText('Selecionar Rota Antiga')).toBeTruthy();
    expect(view.getByText('0 músicas selecionadas')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Selecionar 1 resultado atual'));
    expect(view.getByText('1 música selecionada')).toBeTruthy();
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
    await fireEvent.press(
      view.getByLabelText('Selecionar músicas do repertório'),
    );
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    expect(view.getByText('1 música selecionada')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'luzes',
    );
    expect(view.getByText('1 música selecionada')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    expect(view.getByText('2 músicas selecionadas')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Cancelar seleção de músicas'));
    expect(
      view.getByLabelText('Selecionar músicas do repertório'),
    ).toBeTruthy();
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
    await fireEvent.press(
      view.getByLabelText('Selecionar músicas do repertório'),
    );
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await fireEvent.press(
      view.getByLabelText('Criar coleção com 2 músicas selecionadas'),
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
    await fireEvent.press(
      view.getByLabelText('Selecionar músicas do repertório'),
    );
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Maré de Neon'));
    expect(view.getByText('3 músicas selecionadas')).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText(
        'Adicionar 3 músicas selecionadas a uma coleção existente',
      ),
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
    await fireEvent.press(
      view.getByLabelText('Selecionar músicas do repertório'),
    );
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await fireEvent.press(
      view.getByLabelText(
        'Adicionar 1 música selecionada a uma coleção existente',
      ),
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
    expect(view.getByText('1 música selecionada')).toBeTruthy();
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
