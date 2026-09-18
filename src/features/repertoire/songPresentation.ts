import type { Song } from '@/domain';

export const lyricStatusLabels: Record<Song['lyricStatus'], string> = {
  incomplete: 'Sincronização incompleta',
  missing: 'Sem letra',
  static: 'Letra estática',
  synchronized: 'Sincronizada',
};
