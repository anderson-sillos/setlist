import type { Song } from '@/domain';
import type { AppIconName } from '@/components/ui/AppIcon';
import type { StatusPillTone } from '@/components/ui/StatusPill';

export const lyricStatusLabels: Record<Song['lyricStatus'], string> = {
  incomplete: 'Sincronização incompleta',
  missing: 'Sem letra',
  static: 'Letra estática',
  synchronized: 'Sincronizada',
};

export const lyricStatusIcons: Record<Song['lyricStatus'], AppIconName> = {
  incomplete: 'alert',
  missing: 'fileMissing',
  static: 'fileText',
  synchronized: 'check',
};

export const lyricStatusTones: Record<Song['lyricStatus'], StatusPillTone> = {
  incomplete: 'warning',
  missing: 'warning',
  static: 'default',
  synchronized: 'ready',
};
