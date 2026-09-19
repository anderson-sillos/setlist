export interface AuthPreviewDelays {
  readonly authGateMs: number;
  readonly splashMs: number;
}

const MAX_PREVIEW_DELAY_MS = 30_000;

function isDevelopmentRuntime(): boolean {
  const configuredEnvironment = process.env.EXPO_PUBLIC_APP_ENV;

  if (configuredEnvironment === 'production') {
    return false;
  }

  return (
    configuredEnvironment === 'development' ||
    (typeof __DEV__ !== 'undefined' && __DEV__)
  );
}

function parsePreviewDelay(value: string | undefined): number {
  if (!value?.trim()) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, MAX_PREVIEW_DELAY_MS);
}

/**
 * Pausas visuais usadas somente para revisar o splash e o AuthGate durante o
 * desenvolvimento. Builds de produção sempre ignoram essas variáveis.
 */
export function getAuthPreviewDelays(): AuthPreviewDelays {
  if (!isDevelopmentRuntime()) {
    return { authGateMs: 0, splashMs: 0 };
  }

  return {
    authGateMs: parsePreviewDelay(process.env.EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS),
    splashMs: parsePreviewDelay(process.env.EXPO_PUBLIC_AUTH_SPLASH_PREVIEW_MS),
  };
}
