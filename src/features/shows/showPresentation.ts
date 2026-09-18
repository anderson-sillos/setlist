import type { ShowStatus } from '@/domain';

export const showStatusLabels: Record<ShowStatus, string> = {
  cancelled: 'Cancelado',
  draft: 'Rascunho',
  ready: 'Pronto',
};
