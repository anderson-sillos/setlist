import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import type { AppRepositories, Band, BandMember } from '@/domain';
import {
  deleteBand,
  updateBandName,
} from '@/data/supabase/bandAdministrationMutations';
import {
  createInvitation,
  listInvitations,
} from '@/data/supabase/invitationMutations';
import { updateBandMemberRole } from '@/data/supabase/bandMemberMutations';
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
    updateBandMemberRole: jest.fn(),
  };
});

const mockDeleteBand = jest.mocked(deleteBand);
const mockUpdateBandName = jest.mocked(updateBandName);
const mockCreateInvitation = jest.mocked(createInvitation);
const mockListInvitations = jest.mocked(listInvitations);
const mockUpdateBandMemberRole = jest.mocked(updateBandMemberRole);

function createMutableBandRepositories() {
  const owner: BandMember = {
    bandId: 'band-real',
    displayName: 'Owner Real',
    id: 'membership-real',
    joinedAt: '2026-09-01T12:00:00.000Z',
    role: 'owner',
    userId: 'user-real',
  };
  const member: BandMember = {
    bandId: 'band-real',
    displayName: 'Membro Real',
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

describe('<BandScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListInvitations.mockResolvedValue([]);
    mockUpdateBandMemberRole.mockResolvedValue(undefined);
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
    expect(ownerView.getByLabelText('Editar banda')).toBeTruthy();

    await fireEvent.press(ownerView.getByLabelText('Editar banda'));
    expect(ownerView.getByText(/A administração da banda fica/)).toBeTruthy();
    await fireEvent.press(
      ownerView.getByLabelText('Fechar aviso de demonstração'),
    );

    expect(ownerView.getByLabelText('Convidar integrante')).toBeTruthy();

    await fireEvent.press(ownerView.getByLabelText('Convidar integrante'));
    expect(ownerView.getByTestId('demo-action-notice')).toBeTruthy();
    expect(ownerView.getByText(/Os convites entram/)).toBeTruthy();
    await fireEvent.press(
      ownerView.getByLabelText('Fechar aviso de demonstração'),
    );
    expect(ownerView.queryByTestId('demo-action-notice')).toBeNull();

    await fireEvent.press(ownerView.getByLabelText('Administrar Bruno Lima'));
    expect(ownerView.getByTestId('demo-action-notice')).toBeTruthy();
    expect(ownerView.getByText(/A administração de integrantes/)).toBeTruthy();
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
