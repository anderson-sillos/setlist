import { render, renderHook } from '@testing-library/react-native';

import { AppText } from '@/components/ui/AppText';
import { AuthSessionContext } from '@/features/auth/AuthSessionProvider';
import { SupabaseBandRepository } from '@/data/supabase/repositories';
import { AppProviders, useAppData } from '@/providers/AppProviders';

function DataProbe() {
  const { currentUserId, repositories } = useAppData();

  return (
    <AppText testID="data-probe">
      {`${currentUserId}:${repositories.bands instanceof SupabaseBandRepository}`}
    </AppText>
  );
}

describe('<AppProviders />', () => {
  it('usa o usuário autenticado e o repositório remoto de bandas', async () => {
    const view = await render(
      <AuthSessionContext.Provider
        value={{
          session: { user: { id: 'user-remote' } } as never,
          setSession: jest.fn(),
          status: 'authenticated',
        }}
      >
        <AppProviders>
          <DataProbe />
        </AppProviders>
      </AuthSessionContext.Provider>,
    );

    expect(view.getByTestId('data-probe')).toHaveTextContent(
      'user-remote:true',
    );
  });

  it('preserva o erro quando o hook é usado fora do provedor', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });
});
