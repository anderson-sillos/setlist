import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';

const OAUTH_STATE_STORAGE_KEY = 'setlist.oauth.state';
let memoryState: string | undefined;

function getWebStorage(): Storage | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return undefined;
  }

  return window.sessionStorage;
}

export function createOAuthState(): string {
  const state = randomUUID();
  memoryState = state;
  getWebStorage()?.setItem(OAUTH_STATE_STORAGE_KEY, state);
  return state;
}

export function consumeOAuthState(receivedState?: string): boolean {
  const expectedState =
    memoryState ?? getWebStorage()?.getItem(OAUTH_STATE_STORAGE_KEY);
  memoryState = undefined;
  getWebStorage()?.removeItem(OAUTH_STATE_STORAGE_KEY);

  return Boolean(
    receivedState && expectedState && receivedState === expectedState,
  );
}

export function clearOAuthState(): void {
  memoryState = undefined;
  getWebStorage()?.removeItem(OAUTH_STATE_STORAGE_KEY);
}
