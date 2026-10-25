import type { Song } from '@/domain';
import type { AppIconName } from '@/components/ui/AppIcon';
import type { StatusPillTone } from '@/components/ui/StatusPill';
import { colors } from '@/theme/tokens';

export const lyricStatusLabels: Record<Song['lyricStatus'], string> = {
  incomplete: 'Sincronização incompleta',
  instrumental: 'Instrumental',
  missing: 'Sem letra',
  static: 'Letra estática',
  synchronized: 'Sincronizada',
};

export const lyricStatusIcons: Record<Song['lyricStatus'], AppIconName> = {
  incomplete: 'alert',
  instrumental: 'music',
  missing: 'fileMissing',
  static: 'fileText',
  synchronized: 'check',
};

export const lyricStatusIconColors: Partial<
  Record<Song['lyricStatus'], string>
> = {
  instrumental: colors.semantic.success,
};

export const lyricStatusTones: Record<Song['lyricStatus'], StatusPillTone> = {
  incomplete: 'warning',
  instrumental: 'default',
  missing: 'warning',
  static: 'default',
  synchronized: 'ready',
};
