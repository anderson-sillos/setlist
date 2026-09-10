import type { Show, ShowSetlistBlock, ShowStatus, Song } from '@/domain';

export interface SetlistDurationBreakdown {
  readonly hasDuration: boolean;
  readonly musicMs: number;
  readonly planningMs: number;
  readonly totalMs: number | null;
}

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
  return getShowDurationBreakdown(show, songsById).totalMs;
}

export function getBlockDurationBreakdown(
  block: ShowSetlistBlock,
  songsById: ReadonlyMap<string, Song>,
): SetlistDurationBreakdown {
  let hasDuration = false;
  let musicMs = 0;
  let planningMs = 0;

  block.items.forEach((item) => {
    const duration =
      item.type === 'song'
        ? songsById.get(item.songId)?.estimatedDurationMs
        : item.type === 'planning'
          ? item.estimatedDurationMs
          : null;

    if (duration !== null && duration !== undefined) {
      hasDuration = true;

      if (item.type === 'planning') {
        planningMs += duration;
      } else {
        musicMs += duration;
      }
    }
  });

  return {
    hasDuration,
    musicMs,
    planningMs,
    totalMs: hasDuration ? musicMs + planningMs : null,
  };
}

export function getShowDurationBreakdown(
  show: Show,
  songsById: ReadonlyMap<string, Song>,
): SetlistDurationBreakdown {
  let hasDuration = false;
  let musicMs = 0;
  let planningMs = 0;

  show.blocks.forEach((block) => {
    const blockDuration = getBlockDurationBreakdown(block, songsById);
    hasDuration ||= blockDuration.hasDuration;
    musicMs += blockDuration.musicMs;
    planningMs += blockDuration.planningMs;
  });

  return {
    hasDuration,
    musicMs,
    planningMs,
    totalMs: hasDuration ? musicMs + planningMs : null,
  };
}
