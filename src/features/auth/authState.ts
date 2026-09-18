import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const OAUTH_STATE_STORAGE_KEY = 'setlist.oauth.state';
let memoryState: string | undefined;

function getWebStorage(): Storage | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return undefined;
  }

  return window.sessionStorage;
}

export async function createOAuthState(): Promise<string> {
  const state = randomUUID();
  memoryState = state;
  getWebStorage()?.setItem(OAUTH_STATE_STORAGE_KEY, state);

  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(OAUTH_STATE_STORAGE_KEY, state).catch(() => {
      // The in-memory value remains available when SecureStore is unavailable.
    });
  }

  return state;
}

export async function consumeOAuthState(
  receivedState?: string,
): Promise<boolean> {
  const expectedState =
    memoryState ?? getWebStorage()?.getItem(OAUTH_STATE_STORAGE_KEY);
  const persistedState =
    expectedState ??
    (Platform.OS !== 'web'
      ? await SecureStore.getItemAsync(OAUTH_STATE_STORAGE_KEY).catch(
          () => null,
        )
      : null);

  memoryState = undefined;
  getWebStorage()?.removeItem(OAUTH_STATE_STORAGE_KEY);
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(OAUTH_STATE_STORAGE_KEY).catch(() => {
      // Best-effort cleanup; a consumed state can never be reused successfully.
    });
  }

  return Boolean(
    receivedState && persistedState && receivedState === persistedState,
  );
}

export async function clearOAuthState(): Promise<void> {
  memoryState = undefined;
  getWebStorage()?.removeItem(OAUTH_STATE_STORAGE_KEY);
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(OAUTH_STATE_STORAGE_KEY).catch(() => {
      // Best-effort cleanup when a flow is cancelled or fails.
    });
  }
}
