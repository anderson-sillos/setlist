import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionDetailScreen } from '@/features/repertoire/RepertoireCollectionDetailScreen';
import { RepertoireCollectionsScreen } from '@/features/repertoire/RepertoireCollectionsScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => mockRouter,
}));

describe('telas de consulta de coleções do repertório', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite a integrantes consultar a lista sem controles de edição', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await view.findByText('Acústico')).toBeTruthy();
    expect(view.getByLabelText('Abrir coleção Acústico')).toBeTruthy();
    expect(view.queryByLabelText('Criar coleção de músicas')).toBeNull();
    expect(view.queryByText('Criar coleção')).toBeNull();
  });

  it('oferece criação de coleção a proprietário e editor', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Acústico');
    await fireEvent.press(view.getByLabelText('Criar coleção de músicas'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/new`,
    );
  });

  it('apresenta contagem e duração por coleção e trata a lista vazia', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: demoRepositoryData.repertoireCollections.slice(
        0,
        1,
      ),
      repertoireCollectionSongs:
        demoRepositoryData.repertoireCollectionSongs.filter(
          ({ collectionId }) => collectionId === 'collection-demo-acustico',
        ),
    });
    const singleCollectionView = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await singleCollectionView.findByText('Acústico')).toBeTruthy();
    expect(singleCollectionView.getByText('2 músicas · 7min57s')).toBeTruthy();
    expect(singleCollectionView.queryByText('Festa')).toBeNull();
    await singleCollectionView.unmount();

    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    });
    const emptyView = await render(
      <AppProviders repositories={emptyRepositories}>
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Nenhuma coleção')).toBeTruthy();
    expect(emptyView.getByText(/Essa organização é opcional/)).toBeTruthy();
    expect(emptyView.getByText('Criar coleção')).toBeTruthy();
  });

  it('mantém leitura do detalhe para integrante e reserva edição a quem pode escrever', async () => {
    const memberView = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    expect(await memberView.findByText('Festa')).toBeTruthy();
    expect(memberView.getByText('Luzes da Cidade')).toBeTruthy();
    expect(memberView.queryByLabelText('Editar coleção')).toBeNull();
    await memberView.unmount();

    const ownerView = await render(
      <AppProviders>
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    await ownerView.findByText('Festa');
    await fireEvent.press(ownerView.getByLabelText('Editar coleção'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa/edit`,
    );
  });

  it('mantém músicas arquivadas na ordem e as identifica no detalhe', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollectionSongs: [
        ...demoRepositoryData.repertoireCollectionSongs,
        {
          bandId: demoIds.primaryBand,
          collectionId: 'collection-demo-festa',
          position: 2,
          songId: 'song-demo-rota-antiga',
        },
      ],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(
      view.getByLabelText('Abrir música Rota Antiga, arquivada'),
    ).toBeTruthy();
    expect(view.getByText('Arquivada')).toBeTruthy();
    expect(view.getByLabelText('1 música arquivada')).toBeTruthy();
    expect(
      view
        .getAllByRole('link', { name: /^Abrir música/ })
        .map((link) => link.props.accessibilityLabel),
    ).toEqual([
      'Abrir música Luzes da Cidade',
      'Abrir música Maré de Neon',
      'Abrir música Rota Antiga, arquivada',
    ]);
    await view.unmount();

    const listView = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );
    expect(await listView.findByLabelText('1 música arquivada')).toBeTruthy();
  });

  it('orienta a edição de uma coleção vazia sem confundir com lista indisponível', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollectionSongs:
        demoRepositoryData.repertoireCollectionSongs.filter(
          ({ collectionId }) => collectionId !== 'collection-demo-festa',
        ),
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    expect(await view.findByText('Coleção vazia')).toBeTruthy();
    expect(view.getByText(/A coleção pode continuar vazia/)).toBeTruthy();
    await fireEvent.press(view.getByText('Adicionar músicas'));
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa/edit`,
    );
  });
});
