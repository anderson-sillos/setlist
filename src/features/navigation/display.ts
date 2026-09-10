import type { Show, ShowStatus, Song } from '@/domain';

export const showStatusLabels: Record<ShowStatus, string> = {
  cancelled: 'Cancelado',
  draft: 'Rascunho',
  ready: 'Pronto',
};

export const lyricStatusLabels: Record<Song['lyricStatus'], string> = {
  incomplete: 'Sincronização incompleta',
  missing: 'Sem letra',
  static: 'Letra estática',
  synchronized: 'Sincronizada',
};

export function formatShowDate(startsAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(startsAt));
}

export function formatShowTime(startsAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(startsAt));
}

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null) {
    return 'Não informada';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatRelativeUpdate(
  updatedAt: string,
  now: Date = new Date(),
): string {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(updatedAt).getTime()) / 1000),
  );

  if (elapsedSeconds < 60) {
    return 'agora';
  }

  if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60);
    return `há ${minutes} min`;
  }

  if (elapsedSeconds < 86_400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return `há ${hours} h`;
  }

  if (elapsedSeconds < 604_800) {
    const days = Math.floor(elapsedSeconds / 86_400);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(updatedAt));
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function getShowDurationMs(
  show: Show,
  songsById: ReadonlyMap<string, Song>,
): number | null {
  let hasDuration = false;
  let total = 0;

  show.blocks.forEach((block) => {
    block.items.forEach((item) => {
      const duration = songsById.get(item.songId)?.estimatedDurationMs;

      if (duration !== null && duration !== undefined) {
        hasDuration = true;
        total += duration;
      }
    });
  });

  return hasDuration ? total : null;
}
