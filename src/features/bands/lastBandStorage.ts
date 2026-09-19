import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LAST_BAND_STORAGE_KEY = 'setlist:last-selected-band';

let memoryValue: string | null | undefined;

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/**
 * Stores only the selected band's opaque identifier. The authorization for
 * the band is always checked again against the user's memberships.
 */
export async function readLastBandId(): Promise<string | null> {
  const webStorage = getWebStorage();

  if (webStorage) {
    try {
      const value = webStorage.getItem(LAST_BAND_STORAGE_KEY);
      memoryValue = value;
      return value;
    } catch {
      return memoryValue ?? null;
    }
  }

  if (Platform.OS === 'web') {
    return memoryValue ?? null;
  }

  // A value written or cleared during this process is authoritative. This
  // prevents a stale SecureStore value from reappearing after a selection.
  if (memoryValue !== undefined) {
    return memoryValue;
  }

  try {
    const value = await SecureStore.getItemAsync(LAST_BAND_STORAGE_KEY);
    memoryValue = value;
    return value;
  } catch {
    return memoryValue ?? null;
  }
}

export async function writeLastBandId(bandId: string): Promise<void> {
  memoryValue = bandId;
  const webStorage = getWebStorage();

  if (webStorage) {
    try {
      webStorage.setItem(LAST_BAND_STORAGE_KEY, bandId);
    } catch {
      // The in-memory value keeps the selection available for this process.
    }
    return;
  }

  if (Platform.OS === 'web') {
    return;
  }

  try {
    await SecureStore.setItemAsync(LAST_BAND_STORAGE_KEY, bandId);
  } catch {
    // SecureStore may be unavailable in Expo Go or a restricted test runtime.
  }
}

export async function clearLastBandId(): Promise<void> {
  memoryValue = null;
  const webStorage = getWebStorage();

  if (webStorage) {
    try {
      webStorage.removeItem(LAST_BAND_STORAGE_KEY);
    } catch {
      // Nothing else is required when browser storage is unavailable.
    }
    return;
  }

  if (Platform.OS === 'web') {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(LAST_BAND_STORAGE_KEY);
  } catch {
    // The in-memory value is already cleared.
  }
}
