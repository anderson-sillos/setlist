/**
 * O Google Sign-In depende de módulos nativos. A implementação web mantém
 * esses pacotes fora do bundle do navegador; o fluxo web usa OAuth no browser.
 */
export async function loadNativeGoogleModule(): Promise<never> {
  throw new Error('Google Sign-In nativo não está disponível na web.');
}

export async function loadIosNativeGoogleModule(): Promise<never> {
  throw new Error('Google Sign-In nativo não está disponível na web.');
}
