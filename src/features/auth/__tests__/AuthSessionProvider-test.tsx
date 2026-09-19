import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  AuthSessionProvider,
  useAuthSession,
} from '@/features/auth/AuthSessionProvider';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

function SessionProbe() {
  const { session, status } = useAuthSession();

  return (
    <AppText testID="session-probe">
      {`${status}:${session?.user.email ?? 'sem-email'}`}
    </AppText>
  );
}

function createAuthMock() {
  const subscription = { unsubscribe: jest.fn() };
  const auth = {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription } })),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  mockGetSupabaseClient.mockReturnValue({ auth } as never);
  return { auth, subscription };
}

describe('persistência e ciclo de vida da sessão', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('restaura uma sessão encontrada pelo Supabase', async () => {
    const { auth, subscription } = createAuthMock();
    auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'musica@example.com' } } },
      error: null,
    });

    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'authenticated:musica@example.com',
      ),
    );
    await view.unmount();
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('reage à entrada e saída notificadas pelo ciclo de autenticação', async () => {
    const { auth } = createAuthMock();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );
    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'unauthenticated:sem-email',
      ),
    );

    const callback = (auth.onAuthStateChange.mock.calls[0] as unknown[])[0] as (
      event: string,
      session: unknown,
    ) => void;
    await act(() =>
      callback('SIGNED_IN', { user: { email: 'nova@example.com' } }),
    );
    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'authenticated:nova@example.com',
      ),
    );

    await act(() => callback('SIGNED_OUT', null));
    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'unauthenticated:sem-email',
      ),
    );
  });

  it('pausa e retoma a renovação automática ao mudar o estado do app', async () => {
    const { auth } = createAuthMock();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove } as never);

    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    const onStateChange = addEventListener.mock.calls[0]?.[1] as (
      state: AppStateStatus,
    ) => void;
    expect(onStateChange).toBeDefined();

    await act(() => onStateChange('background'));
    expect(auth.stopAutoRefresh).toHaveBeenCalled();

    await act(() => onStateChange('active'));
    expect(auth.startAutoRefresh).toHaveBeenCalled();

    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalled();
    addEventListener.mockRestore();
  });

  it('mantém o gate seguro quando a leitura da sessão falha', async () => {
    const { auth } = createAuthMock();
    auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('session unavailable'),
    });
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'error:sem-email',
      ),
    );
  });

  it('trata uma exceção inesperada na leitura da sessão', async () => {
    const { auth } = createAuthMock();
    auth.getSession.mockRejectedValue(new Error('network unavailable'));
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await waitFor(() =>
      expect(view.getByTestId('session-probe')).toHaveTextContent(
        'error:sem-email',
      ),
    );
  });
});
