import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';

let lastReport: string | null = null;

/** Reports development metadata without changing navigation or displaying alerts. */
export function reportAppReleaseDiagnostics() {
  if (!__DEV__) return;

  const release = getAppReleaseInfo();
  const manifestVersion = Constants.expoConfig?.version ?? null;
  const expectsNativeVersion =
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
  const messages: string[] = [];

  if (manifestVersion && manifestVersion !== release.codeVersion) {
    messages.push(
      'O manifesto difere do código carregado. Encerre o app e abra novamente o projeto pelo Metro atual; se persistir, atualize o development client.',
    );
  }
  if (
    release.installedVersion &&
    release.installedVersion !== release.codeVersion
  ) {
    messages.push(
      'O binário instalado difere do código carregado. Instale um novo build para validar esta versão como entrega. Alterações somente em JavaScript podem continuar em desenvolvimento.',
    );
  }
  if (expectsNativeVersion && (!release.installedVersion || !release.build)) {
    messages.push(
      'Não foi possível identificar a versão/build do Setlist instalado. Atualize o development client com expo-application antes de validar os dados nativos da entrega.',
    );
  }

  const report = JSON.stringify({
    platform: release.platform,
    codeVersion: release.codeVersion,
    manifestVersion,
    installedVersion: release.installedVersion,
    build: release.build,
    messages,
  });
  if (lastReport === report) return;
  lastReport = report;
  // console.info keeps diagnostics out of LogBox and never blocks the app.
  console.info(`[Setlist: versão] ${report}`);
}
