import { Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

interface RuntimeErrorUtils {
  getGlobalHandler: () => GlobalErrorHandler;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
}

let activeLogoutAttemptId: string | null = null;
let activeLogoutPhase: string | null = null;
let activeLogoutCleanupTimer: ReturnType<typeof setTimeout> | null = null;
let logoutAttemptSequence = 0;
let fatalErrorHandlerInstalled = false;

function getReleaseMetadata() {
  try {
    const release = getAppReleaseInfo();
    return {
      build: release.build,
      commit: release.commit,
      environment: release.environment,
      platform: release.platform,
      version: release.version,
    };
  } catch {
    return {
      build: null,
      commit: null,
      environment: null,
      platform: Platform.OS,
      version: null,
    };
  }
}

function redactDiagnosticText(value: string): string {
  return value
    .replace(/Bearer\s+[^\s"'`]+/gi, 'Bearer [redacted]')
    .replace(
      /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
      '[redacted-jwt]',
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(
      /(access_token|refresh_token|token|code|secret|password)=([^&\s]+)/gi,
      '$1=[redacted]',
    );
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: redactDiagnosticText(error.message).slice(0, 1200),
      errorStack: error.stack
        ? redactDiagnosticText(error.stack).slice(0, 6000)
        : null,
    };
  }

  return {
    errorName: typeof error,
    errorMessage: redactDiagnosticText(String(error)).slice(0, 1200),
    errorStack: null,
  };
}

function writeDiagnostic(
  scope: string,
  event: string,
  details: object = {},
  level: 'error' | 'info' = 'info',
) {
  try {
    console[level](
      `[Setlist:${scope}] ${JSON.stringify({
        ...getReleaseMetadata(),
        attemptId: activeLogoutAttemptId,
        event,
        logoutPhase: activeLogoutPhase,
        timestamp: new Date().toISOString(),
        ...details,
      })}`,
    );
  } catch {
    // Diagnostics must never interfere with authentication or app startup.
  }
}

export function beginLogoutDiagnostics(origin: string): string {
  if (activeLogoutCleanupTimer) {
    clearTimeout(activeLogoutCleanupTimer);
    activeLogoutCleanupTimer = null;
  }
  logoutAttemptSequence += 1;
  activeLogoutAttemptId = `${Date.now().toString(36)}-${logoutAttemptSequence.toString(36)}`;
  activeLogoutPhase = 'started';
  writeDiagnostic('logout', 'started', { origin });
  return activeLogoutAttemptId;
}

export function logLogoutDiagnostic(
  attemptId: string,
  event: string,
  details: object = {},
) {
  if (activeLogoutAttemptId === attemptId) activeLogoutPhase = event;
  writeDiagnostic('logout', event, { attemptId, ...details });
}

export function logLogoutFailure(
  attemptId: string,
  phase: string,
  error: unknown,
) {
  if (activeLogoutAttemptId === attemptId) activeLogoutPhase = phase;
  writeDiagnostic('logout', 'failed', {
    attemptId,
    phase,
    ...getErrorDetails(error),
  });
}

export function finishLogoutDiagnostics(
  attemptId: string,
  outcome: 'failed' | 'succeeded',
) {
  writeDiagnostic('logout', 'finished', { attemptId, outcome });
  if (activeLogoutAttemptId !== attemptId) return;

  // Keep the correlation briefly so AuthGate's post-render transition and a
  // delayed fatal exception still carry the logout attempt that caused them.
  activeLogoutCleanupTimer = setTimeout(() => {
    if (activeLogoutAttemptId === attemptId) {
      activeLogoutAttemptId = null;
      activeLogoutPhase = null;
    }
    activeLogoutCleanupTimer = null;
  }, 15_000);
}

export function logSignedOutAuthEvent() {
  if (!activeLogoutAttemptId) return;
  activeLogoutPhase = 'supabase_signed_out_event';
  writeDiagnostic('logout', 'supabase_signed_out_event');
}

export function logAuthGateState(status: string, publicRoute: boolean) {
  if (!activeLogoutAttemptId) return;
  activeLogoutPhase = 'auth_gate_transition';
  writeDiagnostic('logout', 'auth_gate_transition', { publicRoute, status });
}

/** Logs a fatal JavaScript stack before React Native forwards it to iOS. */
export function installFatalJavaScriptDiagnostics() {
  if (fatalErrorHandlerInstalled) return;

  const errorUtils = (
    globalThis as typeof globalThis & { ErrorUtils?: RuntimeErrorUtils }
  ).ErrorUtils;
  if (!errorUtils) return;

  const originalHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    try {
      writeDiagnostic(
        'fatal-js',
        'unhandled_exception',
        {
          ...getErrorDetails(error),
          isFatal: Boolean(isFatal),
        },
        'error',
      );
    } finally {
      originalHandler(error, isFatal);
    }
  });
  fatalErrorHandlerInstalled = true;
}
