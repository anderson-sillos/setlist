import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionsScreen } from '@/features/repertoire/RepertoireCollectionsScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn() };
const mockNavigation = {
  addListener: jest.fn(() => jest.fn()),
  dispatch: jest.fn(),
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useFocusEffect: jest.fn(),
  useNavigation: () => mockNavigation,
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
    expect(view.queryByLabelText('Abrir coleção Acústico')).toBeNull();
    expect(view.queryByLabelText('Editar coleção Acústico')).toBeNull();
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
});
