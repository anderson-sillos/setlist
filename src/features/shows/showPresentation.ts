import type { ShowStatus } from '@/domain';
import type { AppIconName } from '@/components/ui/AppIcon';
import type { StatusPillTone } from '@/components/ui/StatusPill';

export const showStatusLabels: Record<ShowStatus, string> = {
  cancelled: 'Cancelado',
  draft: 'Rascunho',
  ready: 'Pronto',
};

export const showStatusIcons: Record<ShowStatus, AppIconName> = {
  cancelled: 'showCancelled',
  draft: 'showDraft',
  ready: 'check',
};

export const showStatusTones: Record<ShowStatus, StatusPillTone> = {
  cancelled: 'danger',
  draft: 'default',
  ready: 'ready',
};
