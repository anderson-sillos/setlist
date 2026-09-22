import { useQuery } from '@tanstack/react-query';

import { getUserProfile } from '@/data/supabase/profileMutations';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';

export function useCurrentProfile() {
  const { session } = useAuthSession();
  const userId = session?.user.id;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['profiles', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('É necessário entrar para carregar o perfil.');
      }

      return getUserProfile(userId);
    },
  });
}
