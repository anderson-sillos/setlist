export type NativeGoogleModule = {
  readonly GoogleSignin: {
    configure(options: {
      readonly webClientId?: string;
      readonly iosClientId?: string;
    }): void;
    hasPlayServices(options?: {
      readonly showPlayServicesUpdateDialog?: boolean;
    }): Promise<boolean>;
    signOut(): Promise<null>;
    signIn(options?: { readonly nonce?: string }): Promise<{
      readonly idToken: string | null;
    }>;
  };
  readonly statusCodes: { readonly SIGN_IN_CANCELLED: string };
};
export type IosNativeGoogleModule = NativeGoogleModule;

/**
 * Mantém o carregamento do módulo nativo fora do caminho de importação do
 * Expo Go. O módulo só é resolvido quando o ambiente já foi considerado apto.
 */
export async function loadNativeGoogleModule(): Promise<NativeGoogleModule> {
  return require('@react-native-google-signin/google-signin') as NativeGoogleModule;
}

/** O módulo Objective-C clássico mantém compatibilidade com o RN 0.72 do iOS. */
export async function loadIosNativeGoogleModule(): Promise<IosNativeGoogleModule> {
  return require('@react-native-google-signin/google-signin') as IosNativeGoogleModule;
}
