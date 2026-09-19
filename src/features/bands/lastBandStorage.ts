import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LAST_BAND_STORAGE_KEY = 'setlist:last-selected-band';

let fallbackValue: string | null | undefined;

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    return typeof globalThis.localStorage === 'undefined'
      ? null
      : globalThis.localStorage;
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
      return value;
    } catch {
      return fallbackValue ?? null;
    }
  }

  if (Platform.OS === 'web') {
    return fallbackValue ?? null;
  }

  try {
    const value = await SecureStore.getItemAsync(LAST_BAND_STORAGE_KEY);
    return value;
  } catch {
    return fallbackValue ?? null;
  }
}

export async function writeLastBandId(bandId: string): Promise<void> {
  const webStorage = getWebStorage();

  if (webStorage) {
    try {
      webStorage.setItem(LAST_BAND_STORAGE_KEY, bandId);
      fallbackValue = undefined;
    } catch {
      // The in-memory value keeps the selection available for this process.
      fallbackValue = bandId;
    }
    return;
  }

  if (Platform.OS === 'web') {
    fallbackValue = bandId;
    return;
  }

  try {
    await SecureStore.setItemAsync(LAST_BAND_STORAGE_KEY, bandId);
    fallbackValue = undefined;
  } catch {
    // SecureStore may be unavailable in Expo Go or a restricted test runtime.
    fallbackValue = bandId;
  }
}

export async function clearLastBandId(): Promise<void> {
  const webStorage = getWebStorage();

  if (webStorage) {
    try {
      webStorage.removeItem(LAST_BAND_STORAGE_KEY);
      fallbackValue = undefined;
    } catch {
      // Nothing else is required when browser storage is unavailable.
      fallbackValue = null;
    }
    return;
  }

  if (Platform.OS === 'web') {
    fallbackValue = null;
    return;
  }

  try {
    await SecureStore.deleteItemAsync(LAST_BAND_STORAGE_KEY);
    fallbackValue = undefined;
  } catch {
    // The in-memory value is already cleared.
    fallbackValue = null;
  }
}
