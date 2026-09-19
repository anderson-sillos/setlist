export type NativeGoogleModule =
  typeof import('react-native-nitro-google-signin');

/**
 * Mantém o carregamento do módulo nativo fora do caminho de importação do
 * Expo Go. O módulo só é resolvido quando o ambiente já foi considerado apto.
 */
export async function loadNativeGoogleModule(): Promise<NativeGoogleModule> {
  const importedGoogle = await import('react-native-nitro-google-signin');

  return 'default' in importedGoogle && importedGoogle.default
    ? importedGoogle.default
    : importedGoogle;
}
