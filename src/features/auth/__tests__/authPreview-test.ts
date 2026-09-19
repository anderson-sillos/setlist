import { getAuthPreviewDelays } from '@/features/auth/authPreview';

const previewVariables = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS',
  'EXPO_PUBLIC_AUTH_SPLASH_PREVIEW_MS',
] as const;

const originalValues = Object.fromEntries(
  previewVariables.map((key) => [key, process.env[key]]),
) as Record<(typeof previewVariables)[number], string | undefined>;

describe('pausas de prévia da autenticação', () => {
  afterEach(() => {
    previewVariables.forEach((key) => {
      const value = originalValues[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('lê as pausas no ambiente de desenvolvimento e limita valores altos', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_AUTH_SPLASH_PREVIEW_MS = '1500';
    process.env.EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS = '999999';

    expect(getAuthPreviewDelays()).toEqual({
      authGateMs: 30_000,
      splashMs: 1500,
    });
  });

  it('ignora as pausas em produção ou quando o valor é inválido', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    process.env.EXPO_PUBLIC_AUTH_SPLASH_PREVIEW_MS = '1500';
    process.env.EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS = '-1';

    expect(getAuthPreviewDelays()).toEqual({ authGateMs: 0, splashMs: 0 });
  });
});
