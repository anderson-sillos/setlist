import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  getPublicEnvironment,
  type PublicEnvironment,
} from '@/config/environment';

/**
 * Cria o cliente somente com as referências públicas do ambiente selecionado.
 * A chave service_role nunca deve ser passada para esta função ou para o app.
 */
export function createConfiguredSupabaseClient(
  environment: PublicEnvironment = getPublicEnvironment(),
): SupabaseClient {
  return createClient(
    environment.supabase.url,
    environment.supabase.publishableKey,
  );
}

let supabaseClient: SupabaseClient | undefined;

/**
 * Mantém uma instância por processo para que as próximas features compartilhem
 * o mesmo cache e o mesmo ciclo de autenticação.
 */
export function getSupabaseClient(): SupabaseClient {
  supabaseClient ??= createConfiguredSupabaseClient();
  return supabaseClient;
}
