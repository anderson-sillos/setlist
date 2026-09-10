export const feedbackMessages = {
  'connection-offline-available': {
    sensitive: false,
    variants: [
      'A internet saiu para tomar uma água. Você continua com o que já foi carregado.',
    ],
  },
  'connection-required': {
    sensitive: false,
    variants: [
      'A conexão ainda não voltou para o palco. Reconecte para continuar.',
    ],
  },
  'connection-restored': {
    sensitive: false,
    variants: [
      'A internet voltou para o bis.',
      'Conexão de volta. Podemos continuar.',
    ],
  },
  'content-unavailable': {
    sensitive: true,
    variants: [
      'Este conteúdo está indisponível ou você não possui autorização para acessá-lo.',
    ],
  },
  'item-removed': {
    sensitive: false,
    variants: ['Item removido da setlist.'],
  },
  'load-error': {
    sensitive: false,
    variants: [
      'Essa lista saiu do tom. Não conseguimos carregar; tente novamente.',
      'O palco perdeu o sinal. Não conseguimos carregar; tente novamente.',
    ],
  },
  loading: {
    sensitive: false,
    variants: ['Afinando os instrumentos…', 'Preparando o palco…'],
  },
  'package-corrupted': {
    sensitive: true,
    variants: [
      'O pacote do show está corrompido e precisa ser baixado novamente.',
    ],
  },
  'save-error': {
    sensitive: false,
    variants: [
      'Essa nota saiu do tom. Não conseguimos salvar; tente novamente.',
    ],
  },
  'save-success': {
    sensitive: false,
    variants: [
      'Tudo no compasso. Alterações salvas.',
      'Pronto, ficou redondo. Alterações salvas.',
    ],
  },
  'show-cancelled': {
    sensitive: false,
    variants: ['O modo palco não está disponível para este show cancelado.'],
  },
} as const;

export type FeedbackMessageKey = keyof typeof feedbackMessages;

export function getFeedbackMessage(
  key: FeedbackMessageKey,
  variation = 0,
): string {
  const variants: readonly string[] = feedbackMessages[key].variants;
  const normalizedVariation = Math.abs(variation) % variants.length;
  return variants[normalizedVariation];
}

export function isSensitiveFeedback(key: FeedbackMessageKey): boolean {
  return feedbackMessages[key].sensitive;
}
