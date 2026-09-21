import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';
import { AccountScreen } from '@/features/account/AccountScreen';
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

describe('<AccountScreen />', () => {
  const clearLastBand = jest.fn().mockResolvedValue(undefined);
  const setSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      session: {
        user: {
          email: 'owner@example.com',
          user_metadata: { full_name: 'Owner Teste' },
        },
      } as never,
      setSession,
      status: 'authenticated',
    });
    mockUseLastBandSelection.mockReturnValue({
      clearLastBand,
      isHydrated: true,
      lastBandId: null,
      setLastBand: jest.fn(),
    });
    mockDeleteAccount.mockResolvedValue(undefined);
    mockSignOutLocally.mockResolvedValue(undefined);
  });

  it('exclui a conta e limpa a sessão local', async () => {
    const view = await render(<AccountScreen />);

    expect(view.getByText('Owner Teste')).toBeTruthy();
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

    const view = await render(<AccountScreen />);

    expect(view.getByText('Usuário autenticado')).toBeTruthy();
    expect(view.getByText('E-mail não informado')).toBeTruthy();
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
