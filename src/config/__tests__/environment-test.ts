import {
  EnvironmentConfigurationError,
  getPublicEnvironment,
  parsePublicEnvironment,
  type PublicEnvironmentSource,
} from '@/config/environment';

const validSource: PublicEnvironmentSource = {
  EXPO_PUBLIC_APP_ENV: 'development',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_value',
};

describe('parsePublicEnvironment', () => {
  it.each(['development', 'production'] as const)(
    'aceita o ambiente %s',
    (appEnvironment) => {
      const environment = parsePublicEnvironment({
        ...validSource,
        EXPO_PUBLIC_APP_ENV: appEnvironment,
      });

      expect(environment).toEqual({
        appEnvironment,
        supabase: {
          url: validSource.EXPO_PUBLIC_SUPABASE_URL,
          publishableKey: validSource.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
      });
    },
  );

  it('lista variáveis ausentes sem expor valores', () => {
    expect.assertions(6);

    try {
      parsePublicEnvironment({});
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);

      const configurationError = error as EnvironmentConfigurationError;
      expect(configurationError.message).toContain('EXPO_PUBLIC_APP_ENV');
      expect(configurationError.message).toContain('EXPO_PUBLIC_SUPABASE_URL');
      expect(configurationError.message).toContain(
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      );
      expect(configurationError.message).not.toContain('undefined');
      expect(configurationError.issues).toHaveLength(3);
    }
  });

  it('não inclui um conteúdo inválido na mensagem de erro', () => {
    const sensitiveValue = 'valor-que-nao-deve-aparecer';

    expect(() =>
      parsePublicEnvironment({
        ...validSource,
        EXPO_PUBLIC_SUPABASE_URL: sensitiveValue,
      }),
    ).toThrow(EnvironmentConfigurationError);

    try {
      parsePublicEnvironment({
        ...validSource,
        EXPO_PUBLIC_SUPABASE_URL: sensitiveValue,
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(sensitiveValue);
    }
  });

  it('lê as referências públicas estáticas usadas pelo Expo', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      'sb_publishable_example_value';

    expect(getPublicEnvironment()).toEqual({
      appEnvironment: 'development',
      supabase: {
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_example_value',
      },
    });
  });
});
