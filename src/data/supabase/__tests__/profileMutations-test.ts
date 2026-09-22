import { getSupabaseClient } from '@/data/supabase/client';
import {
  getUserProfile,
  ProfileMutationError,
  updateMyDisplayName,
} from '@/data/supabase/profileMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('perfis no Supabase', () => {
  const eq = jest.fn();
  const maybeSingle = jest.fn();
  const select = jest.fn();
  const from = jest.fn();
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockReturnValue({ maybeSingle });
    select.mockReturnValue({ eq });
    from.mockReturnValue({ select });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);
  });

  it('lê nome, e-mail e avatar exclusivamente da tabela profiles', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        avatar_url: 'https://img.example.test/user.png',
        display_name: 'Nome escolhido',
        email: 'user@example.test',
        id: 'user-1',
      },
      error: null,
    });

    await expect(getUserProfile('user-1')).resolves.toEqual({
      avatarUrl: 'https://img.example.test/user.png',
      displayName: 'Nome escolhido',
      email: 'user@example.test',
      userId: 'user-1',
    });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id, display_name, email, avatar_url');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('retorna null quando o perfil ainda não existe', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getUserProfile('user-1')).resolves.toBeNull();
  });

  it('permite editar o nome pelo RPC próprio e remove espaços externos', async () => {
    rpc.mockResolvedValue({ data: 'Nome próprio', error: null });

    await expect(updateMyDisplayName('  Nome próprio  ')).resolves.toBe(
      'Nome próprio',
    );
    expect(rpc).toHaveBeenCalledWith('update_my_display_name', {
      p_display_name: 'Nome próprio',
    });
  });

  it('valida o nome antes de solicitar a alteração ao servidor', async () => {
    await expect(updateMyDisplayName('  ')).rejects.toMatchObject<
      Partial<ProfileMutationError>
    >({
      code: 'invalid_display_name',
    });
    await expect(updateMyDisplayName('x'.repeat(121))).rejects.toMatchObject<
      Partial<ProfileMutationError>
    >({
      code: 'invalid_display_name',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('converte falhas do servidor em mensagens seguras', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'PROFILE_DISPLAY_NAME_INVALID' },
    });

    await expect(updateMyDisplayName('Nome')).rejects.toMatchObject<
      Partial<ProfileMutationError>
    >({
      code: 'invalid_display_name',
      message: 'Use um nome de 1 a 120 caracteres.',
    });
  });

  it('identifica uma sessão expirada ao salvar o nome', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'AUTHENTICATION_REQUIRED' },
    });

    await expect(updateMyDisplayName('Nome')).rejects.toMatchObject<
      Partial<ProfileMutationError>
    >({
      code: 'authentication_required',
    });
  });

  it('usa uma mensagem segura para uma falha inesperada do Supabase', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'database timeout' },
    });

    await expect(updateMyDisplayName('Nome')).rejects.toMatchObject<
      Partial<ProfileMutationError>
    >({
      code: 'request_failed',
    });
  });
});
