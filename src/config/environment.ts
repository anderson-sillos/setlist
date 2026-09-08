import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'production'], {
    error: 'deve ser development ou production',
  }),
  EXPO_PUBLIC_SUPABASE_URL: z
    .string({ error: 'é obrigatória' })
    .trim()
    .min(1, 'é obrigatória')
    .url('deve ser uma URL válida')
    .refine((value) => value.startsWith('https://'), 'deve usar HTTPS'),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: 'é obrigatória' })
    .trim()
    .min(20, 'deve ser uma chave pública válida'),
});

export type PublicEnvironmentSource = {
  readonly EXPO_PUBLIC_APP_ENV?: string;
  readonly EXPO_PUBLIC_SUPABASE_URL?: string;
  readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export type PublicEnvironment = Readonly<{
  appEnvironment: 'development' | 'production';
  supabase: Readonly<{
    url: string;
    publishableKey: string;
  }>;
}>;

export type EnvironmentConfigurationIssue = Readonly<{
  variable: keyof PublicEnvironmentSource;
  reason: string;
}>;

export class EnvironmentConfigurationError extends Error {
  readonly issues: readonly EnvironmentConfigurationIssue[];

  constructor(issues: readonly EnvironmentConfigurationIssue[]) {
    const details = issues
      .map(({ variable, reason }) => `${variable} ${reason}`)
      .join('; ');

    super(`Configuração do ambiente inválida: ${details}.`);
    this.name = 'EnvironmentConfigurationError';
    this.issues = issues;
  }
}

export function parsePublicEnvironment(
  source: PublicEnvironmentSource,
): PublicEnvironment {
  const result = publicEnvironmentSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map<EnvironmentConfigurationIssue>(
      (issue) => ({
        variable: issue.path[0] as keyof PublicEnvironmentSource,
        reason: issue.message,
      }),
    );

    throw new EnvironmentConfigurationError(issues);
  }

  return Object.freeze({
    appEnvironment: result.data.EXPO_PUBLIC_APP_ENV,
    supabase: Object.freeze({
      url: result.data.EXPO_PUBLIC_SUPABASE_URL,
      publishableKey: result.data.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
  });
}

/**
 * Lê as variáveis somente quando uma integração remota precisa delas.
 * As referências estáticas são necessárias para o Expo incluí-las no bundle.
 */
export function getPublicEnvironment(): PublicEnvironment {
  return parsePublicEnvironment({
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
