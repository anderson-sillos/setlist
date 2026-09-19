import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  getPublicEnvironment,
  type PublicEnvironment,
} from '@/config/environment';
import { getSupabaseAuthStorage } from '@/data/supabase/authStorage';

/**
 * Cria o cliente somente com as referências públicas do ambiente selecionado.
 * A chave service_role nunca deve ser passada para esta função ou para o app.
 */
export function createConfiguredSupabaseClient(
  environment: PublicEnvironment = getPublicEnvironment(),
): SupabaseClient {
  const storage = getSupabaseAuthStorage();

  return createClient(
    environment.supabase.url,
    environment.supabase.publishableKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        experimental: {
          appendPkceFlowIdToRedirects: true,
        },
        flowType: 'pkce',
        persistSession: true,
        ...(storage ? { storage } : {}),
      },
    },
  );
}

/**
 * O Fast Refresh pode reavaliar este módulo sem recriar o contexto global do
 * navegador. Manter a referência fora do módulo evita que uma nova instância
 * do GoTrueClient seja criada com a mesma chave de armazenamento.
 */
const globalScope = globalThis as typeof globalThis & {
  __setlistSupabaseClient__?: SupabaseClient;
};

let supabaseClient: SupabaseClient | undefined =
  globalScope.__setlistSupabaseClient__;

/**
 * Mantém uma instância por processo para que as próximas features compartilhem
 * o mesmo cache e o mesmo ciclo de autenticação.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createConfiguredSupabaseClient();
    globalScope.__setlistSupabaseClient__ = supabaseClient;
  }

  return supabaseClient;
}
