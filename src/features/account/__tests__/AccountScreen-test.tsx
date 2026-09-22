import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';
import {
  ProfileMutationError,
  updateMyDisplayName,
} from '@/data/supabase/profileMutations';
import { AccountScreen } from '@/features/account/AccountScreen';
import { useCurrentProfile } from '@/features/account/useCurrentProfile';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { signOutLocally } from '@/features/auth/authService';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/features/navigation/AppNavigationShell', () => ({
  AppNavigationShell: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/data/supabase/accountMutations', () => ({
  AccountDeletionError: class AccountDeletionError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  deleteAccount: jest.fn(),
}));

jest.mock('@/data/supabase/profileMutations', () => ({
  ProfileMutationError: class ProfileMutationError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  updateMyDisplayName: jest.fn(),
}));

jest.mock('@/features/account/useCurrentProfile', () => ({
  useCurrentProfile: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
}));

jest.mock('@/features/auth/AuthSessionProvider', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@/features/auth/authService', () => ({
  signOutLocally: jest.fn(),
}));

jest.mock('@/features/bands/LastBandSelection', () => ({
  useLastBandSelection: jest.fn(),
}));

const mockDeleteAccount = jest.mocked(deleteAccount);
const mockSignOutLocally = jest.mocked(signOutLocally);
const mockUseAuthSession = jest.mocked(useAuthSession);
const mockUseLastBandSelection = jest.mocked(useLastBandSelection);
const mockUseCurrentProfile = jest.mocked(useCurrentProfile);
const mockUpdateMyDisplayName = jest.mocked(updateMyDisplayName);
const mockUseQueryClient = jest.mocked(useQueryClient);
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockSetQueryData = jest.fn();

describe('<AccountScreen />', () => {
  const clearLastBand = jest.fn().mockResolvedValue(undefined);
  const setSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      session: {
        user: {
          id: 'user-profile',
          email: 'owner@example.com',
          user_metadata: { full_name: 'Owner Teste' },
        },
      } as never,
      setSession,
      status: 'authenticated',
    });
    mockUseCurrentProfile.mockReturnValue({
      data: {
        avatarUrl: 'https://img.example.test/profile.png',
        displayName: 'Nome do perfil',
        email: 'profile@example.com',
        userId: 'user-profile',
      },
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as never);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
      setQueryData: mockSetQueryData,
    } as never);
    mockUseLastBandSelection.mockReturnValue({
      clearLastBand,
      isHydrated: true,
      lastBandId: null,
      setLastBand: jest.fn(),
    });
    mockDeleteAccount.mockResolvedValue(undefined);
    mockUpdateMyDisplayName.mockResolvedValue('Nome salvo');
    mockSignOutLocally.mockResolvedValue(undefined);
  });

  it('exclui a conta e limpa a sessão local', async () => {
    const view = await render(<AccountScreen />);

    expect(view.getByText('Nome do perfil')).toBeTruthy();
    expect(view.queryByText('Owner Teste')).toBeNull();
    await fireEvent.press(view.getByLabelText('Abrir exclusão da conta'));
    await fireEvent.changeText(
      view.getByLabelText('Confirmação da exclusão da conta'),
      'EXCLUIR',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da conta'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
      expect(clearLastBand).toHaveBeenCalledTimes(1);
      expect(mockSignOutLocally).toHaveBeenCalledTimes(1);
      expect(setSession).toHaveBeenCalledWith(null);
    });
  });

  it('usa rótulos seguros quando a sessão não traz identidade completa', async () => {
    mockUseAuthSession.mockReturnValue({
      session: null,
      setSession,
      status: 'unauthenticated',
    });
    mockUseCurrentProfile.mockReturnValue({
      data: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as never);

    const view = await render(<AccountScreen />);

    expect(view.getByText('Usuário autenticado')).toBeTruthy();
    expect(view.getByText('E-mail não informado')).toBeTruthy();
  });

  it('salva o nome de exibição do perfil e atualiza a navegação', async () => {
    const view = await render(<AccountScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Editar nome de exibição' }),
    );
    expect(
      view.getByTestId('profile-display-name-keyboard-layout'),
    ).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Nome de exibição'),
      '  Nome salvo  ',
    );
    await fireEvent.press(view.getByText('Salvar'));

    await waitFor(() => {
      expect(mockUpdateMyDisplayName).toHaveBeenCalledWith('Nome salvo');
      expect(mockSetQueryData).toHaveBeenCalledWith(
        ['profiles', 'user-profile'],
        expect.any(Function),
      );
      expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
        queryKey: ['profiles', 'user-profile'],
      });
      expect(mockInvalidateQueries).toHaveBeenNthCalledWith(2, {
        queryKey: ['bands'],
      });
      expect(view.getByText('Nome de exibição atualizado.')).toBeTruthy();
      expect(view.queryByTestId('profile-display-name-dialog')).toBeNull();
    });
  });

  it('mostra o estado de carregamento do perfil sem usar o nome do provedor', async () => {
    mockUseCurrentProfile.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      refetch: jest.fn(),
    } as never);
    const view = await render(<AccountScreen />);

    expect(view.getByText('Carregando perfil…')).toBeTruthy();
    expect(view.queryByText('Owner Teste')).toBeNull();
    expect(view.queryByTestId('profile-display-name-dialog')).toBeNull();
  });

  it('não permite salvar um nome vazio', async () => {
    const view = await render(<AccountScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Editar nome de exibição' }),
    );
    await fireEvent.changeText(view.getByLabelText('Nome de exibição'), '   ');

    expect(
      view.getByRole('button', { name: 'Salvar nome de exibição' }).props
        .accessibilityState?.disabled,
    ).toBe(true);
    expect(mockUpdateMyDisplayName).not.toHaveBeenCalled();
  });

  it('mantém o editor aberto e mostra uma mensagem segura quando o nome falha', async () => {
    mockUpdateMyDisplayName.mockRejectedValue(
      new ProfileMutationError(
        'invalid_display_name',
        'Use um nome de 1 a 120 caracteres.',
      ),
    );
    const view = await render(<AccountScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Editar nome de exibição' }),
    );
    await fireEvent.changeText(
      view.getByLabelText('Nome de exibição'),
      'Novo nome',
    );
    await fireEvent.press(
      view.getByRole('button', { name: 'Salvar nome de exibição' }),
    );

    expect(
      await view.findByText('Use um nome de 1 a 120 caracteres.'),
    ).toBeTruthy();
    expect(view.getByTestId('profile-display-name-dialog')).toBeTruthy();
  });

  it('mantém a tela aberta quando a exclusão é recusada pelo servidor', async () => {
    mockDeleteAccount.mockRejectedValue(
      new AccountDeletionError(
        'last_owner',
        'Promova outro Proprietário antes de excluir sua conta.',
      ),
    );
    const view = await render(<AccountScreen />);

    await fireEvent.press(view.getByLabelText('Abrir exclusão da conta'));
    expect(view.getByTestId('account-deletion-keyboard-layout')).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Confirmação da exclusão da conta'),
      'EXCLUIR',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da conta'));

    expect(
      await view.findByText(
        'Promova outro Proprietário antes de excluir sua conta.',
      ),
    ).toBeTruthy();
  });

  it('usa uma mensagem segura para uma falha inesperada', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('network unavailable'));
    const view = await render(<AccountScreen />);

    await fireEvent.press(view.getByLabelText('Abrir exclusão da conta'));
    await fireEvent.changeText(
      view.getByLabelText('Confirmação da exclusão da conta'),
      'EXCLUIR',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da conta'));

    expect(
      await view.findByText(
        'Não foi possível excluir a conta agora. Tente novamente.',
      ),
    ).toBeTruthy();
  });

  it('não fecha o diálogo enquanto a exclusão está em andamento', async () => {
    let resolveDelete: (() => void) | undefined;
    mockDeleteAccount.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDelete = resolve;
      }),
    );
    const view = await render(<AccountScreen />);

    await fireEvent.press(view.getByLabelText('Abrir exclusão da conta'));
    await fireEvent.changeText(
      view.getByLabelText('Confirmação da exclusão da conta'),
      'EXCLUIR',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da conta'));
    await waitFor(() => expect(view.getByText('Excluindo…')).toBeTruthy());

    await fireEvent.press(
      view.getAllByLabelText('Fechar exclusão da conta')[1],
    );
    expect(view.getByTestId('account-deletion-dialog')).toBeTruthy();

    resolveDelete?.();
    await waitFor(() => expect(setSession).toHaveBeenCalledWith(null));
  });
});
