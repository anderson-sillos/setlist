import { requireOptionalNativeModule } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import appConfig from '../../app.json';

interface NativeApplicationInfo {
  readonly applicationId: string;
  readonly nativeApplicationVersion: string | null;
  readonly nativeBuildVersion: string | null;
}

export function getAppReleaseInfo() {
  // Clients built before expo-application was added keep working. Expo Go's
  // version identifies the host application rather than Setlist.
  const nativeApplication =
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
      ? requireOptionalNativeModule<NativeApplicationInfo>('ExpoApplication')
      : null;
  const isSetlist =
    nativeApplication?.applicationId === appConfig.expo.android.package ||
    nativeApplication?.applicationId === appConfig.expo.ios.bundleIdentifier;
  const release = Constants.expoConfig?.extra?.release;
  const commit =
    typeof release?.commit === 'string' && /^[a-f0-9]{40}$/.test(release.commit)
      ? release.commit
      : null;

  return {
    version:
      (isSetlist ? nativeApplication?.nativeApplicationVersion : null) ??
      Constants.expoConfig?.version ??
      appConfig.expo.version,
    build: isSetlist ? (nativeApplication?.nativeBuildVersion ?? null) : null,
    commit,
    tag: typeof release?.tag === 'string' ? release.tag : null,
    environment:
      process.env.EXPO_PUBLIC_APP_ENV === 'production'
        ? 'Produção'
        : 'Desenvolvimento',
    platform:
      Platform.OS === 'ios'
        ? 'iOS'
        : Platform.OS === 'android'
          ? 'Android'
          : 'Web',
  };
}
