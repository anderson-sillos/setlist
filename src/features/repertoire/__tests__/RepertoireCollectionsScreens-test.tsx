import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createInMemoryRepositories } from '@/data/in-memory';
import {
  createBand,
  createBandMember,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
} from '@/testing/factories';
import { RepertoireCollectionsScreen } from '@/features/repertoire/RepertoireCollectionsScreen';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const BAND_ID = 'band-collection-list';
const OWNER_USER_ID = 'user-collection-list-owner';
const MEMBER_USER_ID = 'user-collection-list-member';
const LIGHTS_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 218_000,
  id: 'song-collection-lights',
  title: 'Luzes da Cidade',
});
const NEON_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 259_000,
  id: 'song-collection-neon',
  title: 'Maré de Neon',
});
const FESTA_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-list-festa',
  name: 'Festa',
});
const ACOUSTIC_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-list-acustico',
  name: 'Acústico',
});
const COLLECTIONS = [FESTA_COLLECTION, ACOUSTIC_COLLECTION];
const SONGS = [LIGHTS_SONG, NEON_SONG];
const MEMBERSHIPS = [
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: FESTA_COLLECTION.id,
    songId: LIGHTS_SONG.id,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: ACOUSTIC_COLLECTION.id,
    songId: LIGHTS_SONG.id,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: ACOUSTIC_COLLECTION.id,
    position: 1,
    songId: NEON_SONG.id,
  }),
];

function createRepositories({
  role = 'owner',
  collections = COLLECTIONS,
  collectionSongs = MEMBERSHIPS,
}: {
  role?: 'owner' | 'editor' | 'member';
  collections?: readonly ReturnType<typeof createRepertoireCollection>[];
  collectionSongs?: readonly ReturnType<
    typeof createRepertoireCollectionSong
  >[];
} = {}) {
  const userId = role === 'member' ? MEMBER_USER_ID : OWNER_USER_ID;
  return createInMemoryRepositories({
    bands: [createBand({ id: BAND_ID })],
    bandMembers: [
      createBandMember({
        bandId: BAND_ID,
        id: `membership-collection-list-${role}`,
        role,
        userId,
      }),
    ],
    repertoireCollections: collections,
    repertoireCollectionSongs: collectionSongs,
    songs: SONGS,
    shows: [],
  });
}

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
    const repositories = createRepositories({ role: 'member' });
    const view = await render(
      <AppProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <RepertoireCollectionsScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    expect(await view.findByText('Acústico')).toBeTruthy();
    expect(view.queryByLabelText('Abrir coleção Acústico')).toBeNull();
    expect(view.queryByLabelText('Editar coleção Acústico')).toBeNull();
    expect(view.queryByLabelText('Criar coleção de músicas')).toBeNull();
    expect(view.queryByText('Criar coleção')).toBeNull();
  });

  it('oferece criação de coleção a proprietário e editor', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionsScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Acústico');
    await fireEvent.press(view.getByLabelText('Criar coleção de músicas'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/collections/new`,
    );
  });

  it('apresenta contagem e duração por coleção e trata a lista vazia', async () => {
    const repositories = createRepositories({
      collections: [ACOUSTIC_COLLECTION],
      collectionSongs: MEMBERSHIPS.filter(
        ({ collectionId }) => collectionId === ACOUSTIC_COLLECTION.id,
      ),
    });
    const singleCollectionView = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionsScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    expect(await singleCollectionView.findByText('Acústico')).toBeTruthy();
    expect(singleCollectionView.getByText('2 músicas · 7min57s')).toBeTruthy();
    expect(singleCollectionView.queryByText('Festa')).toBeNull();
    await singleCollectionView.unmount();

    const emptyRepositories = createRepositories({
      collections: [],
      collectionSongs: [],
    });
    const emptyView = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={emptyRepositories}
      >
        <RepertoireCollectionsScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Nenhuma coleção')).toBeTruthy();
    expect(emptyView.getByText(/Essa organização é opcional/)).toBeTruthy();
    expect(emptyView.getByText('Criar coleção')).toBeTruthy();
  });
});
