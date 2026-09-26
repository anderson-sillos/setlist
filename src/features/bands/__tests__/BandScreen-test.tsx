import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import { createBand } from '@/data/supabase/bandMutations';
import type { AppRepositories, Band, BandMember } from '@/domain';
import {
  deleteBand,
  updateBandName,
} from '@/data/supabase/bandAdministrationMutations';
import {
  createInvitation,
  listInvitations,
} from '@/data/supabase/invitationMutations';
import {
  leaveBand,
  updateBandMemberRole,
} from '@/data/supabase/bandMemberMutations';
import { BandsScreen } from '@/features/bands/BandsScreen';
import { BandScreen } from '@/features/bands/BandScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/data/supabase/bandAdministrationMutations', () => {
  const actual = jest.requireActual(
    '@/data/supabase/bandAdministrationMutations',
  );

  return {
    ...actual,
    deleteBand: jest.fn(),
    updateBandName: jest.fn(),
  };
});

jest.mock('@/data/supabase/bandMutations', () => {
  const actual = jest.requireActual('@/data/supabase/bandMutations');

  return {
    ...actual,
    createBand: jest.fn(),
  };
});

jest.mock('@/data/supabase/invitationMutations', () => {
  const actual = jest.requireActual('@/data/supabase/invitationMutations');

  return {
    ...actual,
    createInvitation: jest.fn(),
    listInvitations: jest.fn(),
  };
});

jest.mock('@/data/supabase/bandMemberMutations', () => {
  const actual = jest.requireActual('@/data/supabase/bandMemberMutations');

  return {
    ...actual,
    leaveBand: jest.fn(),
    updateBandMemberRole: jest.fn(),
  };
});

const mockDeleteBand = jest.mocked(deleteBand);
const mockUpdateBandName = jest.mocked(updateBandName);
const mockCreateBand = jest.mocked(createBand);
const mockCreateInvitation = jest.mocked(createInvitation);
const mockListInvitations = jest.mocked(listInvitations);
const mockUpdateBandMemberRole = jest.mocked(updateBandMemberRole);
const mockLeaveBand = jest.mocked(leaveBand);

function createMutableBandRepositories() {
  const owner: BandMember = {
    bandId: 'band-real',
    displayName: 'Owner Real',
    email: 'owner@example.test',
    id: 'membership-real',
    joinedAt: '2026-09-01T12:00:00.000Z',
    role: 'owner',
    userId: 'user-real',
  };
  const member: BandMember = {
    bandId: 'band-real',
    displayName: 'Membro Real',
    email: 'membro@example.test',
    id: 'membership-member',
    joinedAt: '2026-09-02T12:00:00.000Z',
    role: 'member',
    userId: 'user-member',
  };
  let band: Band | null = {
    createdAt: '2026-09-01T12:00:00.000Z',
    id: 'band-real',
    name: 'Banda Inicial',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };

  const repositories: AppRepositories = {
    bands: {
      findById: async () => band,
      listForUser: async () => (band ? [{ band, membership: owner }] : []),
      listMembers: async () => (band ? [owner, member] : []),
    },
    shows: {
      findById: async () => null,
      listByBandId: async () => [],
    },
    songs: {
      findById: async () => null,
      listByBandId: async () => [],
    },
  };

  return {
    deleteBand: () => {
      band = null;
    },
    renameBand: (name: string) => {
      if (band) {
        band = { ...band, name };
      }
    },
    repositories,
  };
}

function createNewBandRepositories() {
  let band: Band | null = null;
  let owner: BandMember | null = null;

  const repositories: AppRepositories = {
    bands: {
      findById: async (bandId) => (band?.id === bandId ? band : null),
      listForUser: async (userId) =>
        band && owner?.userId === userId ? [{ band, membership: owner }] : [],
      listMembers: async (bandId) =>
        band?.id === bandId && owner ? [owner] : [],
    },
    shows: {
      findById: async () => null,
      listByBandId: async () => [],
    },
    songs: {
      findById: async () => null,
      listByBandId: async () => [],
    },
  };

  return {
    addBand: (id: string, name: string) => {
      band = {
        createdAt: '2026-09-22T12:00:00.000Z',
        id,
        name,
        updatedAt: '2026-09-22T12:00:00.000Z',
      };
      owner = {
        bandId: id,
        displayName: 'Owner Real',
        id: 'membership-created',
        joinedAt: '2026-09-22T12:00:00.000Z',
        role: 'owner',
        userId: 'user-real',
      };
    },
    repositories,
  };
}

describe('<BandScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListInvitations.mockResolvedValue([]);
    mockUpdateBandMemberRole.mockResolvedValue(undefined);
    mockLeaveBand.mockResolvedValue(undefined);
  });

  it('mostra o e-mail no lugar do papel repetido na linha do integrante', async () => {
    const { repositories } = createMutableBandRepositories();
    const view = await render(
      <AppProviders repositories={repositories}>
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    expect(await view.findByText('Membro Real')).toBeTruthy();
    expect(view.getByText('membro@example.test')).toBeTruthy();
    expect(view.queryByText('Integrante')).toBeNull();
  });

  it('agrupa integrantes e mostra controles apenas para o proprietário', async () => {
    const ownerView = await render(
      <AppProviders>
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await ownerView.findByText('Proprietários · 1')).toBeTruthy();
    expect(ownerView.getByText('Editores · 1')).toBeTruthy();
    expect(ownerView.getByText('Integrantes · 1')).toBeTruthy();
    expect(ownerView.getByText('Você')).toBeTruthy();
    expect(ownerView.getByLabelText('Administrar Bruno Lima')).toBeTruthy();
    await fireEvent.press(ownerView.getByLabelText('Sair da banda'));
    expect(ownerView.getByTestId('band-leave-dialog')).toBeTruthy();
    await fireEvent.press(ownerView.getByText('Cancelar'));
    expect(ownerView.getByLabelText('Editar banda')).toBeTruthy();

    await fireEvent.press(ownerView.getByLabelText('Editar banda'));
    expect(ownerView.getByTestId('band-administration-dialog')).toBeTruthy();
    await fireEvent.press(
      ownerView.getAllByLabelText('Fechar edição da banda')[0],
    );

    expect(ownerView.getByLabelText('Convidar integrante')).toBeTruthy();

    await fireEvent.press(ownerView.getByLabelText('Convidar integrante'));
    expect(ownerView.getByTestId('band-invitation-dialog')).toBeTruthy();
    await fireEvent.press(
      ownerView.getByLabelText('Fechar janela de convites'),
    );

    await fireEvent.press(ownerView.getByLabelText('Administrar Bruno Lima'));
    expect(ownerView.getByTestId('band-member-management-dialog')).toBeTruthy();
    await ownerView.unmount();

    const memberView = await render(
      <AppProviders currentUserId="user-demo-carla">
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await memberView.findByText('Você')).toBeTruthy();
    expect(memberView.queryByLabelText('Convidar integrante')).toBeNull();
    expect(memberView.queryByLabelText('Administrar Bruno Lima')).toBeNull();
  });

  it('atualiza a lista de bandas depois de editar o nome', async () => {
    const state = createMutableBandRepositories();
    mockUpdateBandName.mockImplementation(async ({ name }) => {
      state.renameBand(name.trim());
    });

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandsScreen />
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    expect(await view.findByLabelText('Abrir Banda Inicial')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Editar banda'));
    await fireEvent.changeText(
      view.getByLabelText('Novo nome da banda'),
      'Banda Atualizada',
    );
    await fireEvent.press(view.getByLabelText('Confirmar novo nome da banda'));

    await waitFor(() => {
      expect(view.getByLabelText('Abrir Banda Atualizada')).toBeTruthy();
      expect(view.queryByLabelText('Abrir Banda Inicial')).toBeNull();
    });
  });

  it('atualiza as permissões ao abrir uma banda recém-criada', async () => {
    const state = createNewBandRepositories();
    mockCreateBand.mockImplementation(async ({ name }) => {
      state.addBand('band-created-remotely', name.trim());
      return 'band-created-remotely';
    });

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandsScreen />
        <BandScreen bandId="band-created-remotely" />
      </AppProviders>,
    );

    expect(await view.findByText('Seu palco ainda está vazio')).toBeTruthy();
    expect(view.queryByLabelText('Editar banda')).toBeNull();
    await fireEvent.press(view.getAllByLabelText('Criar banda')[0]);
    await fireEvent.changeText(
      view.getByLabelText('Nome da banda'),
      'Banda Nova',
    );
    await fireEvent.press(
      view.getByLabelText('Aceitar termo de responsabilidade'),
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação da banda'));

    await waitFor(() => {
      expect(mockCreateBand).toHaveBeenCalled();
      expect(view.getByLabelText('Editar banda')).toBeTruthy();
      expect(view.getByLabelText('Convidar integrante')).toBeTruthy();
      expect(view.getByLabelText('Abrir Banda Nova')).toBeTruthy();
    });

    await fireEvent.press(view.getByLabelText('Editar banda'));
    expect(view.getByLabelText('Novo nome da banda')).toBeTruthy();
  });

  it('abre a administração de convites para uma banda real', async () => {
    mockCreateInvitation.mockResolvedValue({
      id: 'invite-1',
      token: 'token-1',
      url: 'https://example.com/invite/token-1',
    });
    const state = createMutableBandRepositories();

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    await fireEvent.press(await view.findByLabelText('Convidar integrante'));
    expect(view.getByTestId('band-invitation-dialog')).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Rótulo do convite'),
      'Baixista',
    );
    await fireEvent.press(view.getByLabelText('Criar convite'));

    await waitFor(() => {
      expect(mockCreateInvitation).toHaveBeenCalledWith({
        bandId: 'band-real',
        label: 'Baixista',
      });
      expect(view.getByText('https://example.com/invite/token-1')).toBeTruthy();
    });
  });

  it('permite promover um integrante para Editor', async () => {
    const state = createMutableBandRepositories();

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    await fireEvent.press(
      await view.findByLabelText('Administrar Membro Real'),
    );
    await fireEvent.press(
      view.getByLabelText('Promover Membro Real para editor'),
    );
    await fireEvent.press(
      view.getByLabelText('Confirmar alteração para Editor de Membro Real'),
    );

    await waitFor(() => {
      expect(mockUpdateBandMemberRole).toHaveBeenCalledWith({
        bandId: 'band-real',
        memberId: 'membership-member',
        role: 'editor',
      });
    });
  });

  it('permite ao integrante sair da banda com confirmação', async () => {
    const state = createMutableBandRepositories();

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    await fireEvent.press(await view.findByLabelText('Sair da banda'));
    expect(view.getByTestId('band-leave-dialog')).toBeTruthy();
    expect(view.getByText(/Sair de Banda Inicial/)).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Confirmar saída da banda'));

    await waitFor(() => {
      expect(mockLeaveBand).toHaveBeenCalledWith({ bandId: 'band-real' });
    });
  });

  it('remove a banda da lista depois de excluí-la', async () => {
    const state = createMutableBandRepositories();
    mockDeleteBand.mockImplementation(async () => {
      state.deleteBand();
    });

    const view = await render(
      <AppProviders currentUserId="user-real" repositories={state.repositories}>
        <BandsScreen />
        <BandScreen bandId="band-real" />
      </AppProviders>,
    );

    expect(await view.findByLabelText('Abrir Banda Inicial')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Editar banda'));
    await fireEvent.press(view.getByLabelText('Excluir banda'));
    await fireEvent.changeText(
      view.getByLabelText('Confirmação do nome da banda'),
      'Banda Inicial',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da banda'));

    await waitFor(() => {
      expect(view.queryByLabelText('Abrir Banda Inicial')).toBeNull();
    });
  });
});
