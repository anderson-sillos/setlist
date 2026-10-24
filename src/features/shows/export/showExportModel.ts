import type { BandContext, EntityId, Show, SongSummary } from '@/domain';
import { getShowDurationBreakdown } from '@/domain/setlistDuration';
import { APP_LOCALE, APP_TIME_ZONE } from '@/config/localization';
import { formatShowDuration, formatSongDuration } from '@/utils/duration';

export interface ShowExportOptions {
  readonly includeArtist: boolean;
  readonly includeKey: boolean;
  readonly includeBpm: boolean;
  readonly includeDurations: boolean;
  readonly includePlanning: boolean;
  readonly includeShowNotes: boolean;
  readonly includeOccurrenceNotes: boolean;
}

export const DEFAULT_SHOW_EXPORT_OPTIONS: ShowExportOptions = {
  includeArtist: true,
  includeKey: true,
  includeBpm: false,
  includeDurations: true,
  includePlanning: true,
  includeShowNotes: false,
  includeOccurrenceNotes: false,
};

export type ShowExportItem =
  | {
      readonly kind: 'song';
      readonly title: string;
      readonly artist: string | null;
      readonly key: string | null;
      readonly bpm: number | null;
      readonly durationMs: number | null;
      readonly occurrenceNotes: string | null;
    }
  | {
      readonly kind: 'planning';
      readonly description: string;
      readonly durationMs: number | null;
    }
  | { readonly kind: 'separator' };

export interface ShowExportBlock {
  readonly name: string;
  readonly items: readonly ShowExportItem[];
}

export interface ShowExportDocument {
  readonly bandName: string;
  readonly showName: string;
  readonly startsAt: string;
  readonly startLabel: string;
  readonly venue: string;
  readonly status: Show['status'];
  readonly statusLabel: string;
  readonly generatedAtLabel: string;
  readonly notes: string | null;
  readonly songCount: number;
  readonly duration: {
    readonly hasDuration: boolean;
    readonly musicMs: number;
    readonly planningMs: number;
    readonly totalMs: number | null;
  };
  readonly blocks: readonly ShowExportBlock[];
}

export type ExportLineStyle =
  | 'brand'
  | 'title'
  | 'meta'
  | 'section'
  | 'song'
  | 'detail'
  | 'note'
  | 'planning'
  | 'separator'
  | 'empty'
  | 'total';

export interface ShowExportLine {
  readonly style: ExportLineStyle;
  readonly text: string;
  readonly indent?: number;
  readonly keepWithNext?: boolean;
}

const statusLabels: Record<Show['status'], string> = {
  cancelled: 'Cancelado',
  draft: 'Rascunho',
  ready: 'Pronto',
};

function formatDateTime(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data e horário indisponíveis';

  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

function formatCompactDateTime(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '00/00/0000 00:00';

  const parts = new Intl.DateTimeFormat(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`;
}

function countSongs(show: Show): number {
  return show.blocks.reduce(
    (count, block) =>
      count + block.items.filter((item) => item.type === 'song').length,
    0,
  );
}

/** Cria uma cópia enxuta para exportação; nunca recebe documentos de letra. */
export function prepareShowExportDocument(
  show: Show,
  band: Pick<BandContext, 'bandName'>,
  songsById: ReadonlyMap<EntityId, SongSummary>,
  generatedAt = new Date().toISOString(),
): ShowExportDocument {
  const duration = getShowDurationBreakdown(show, songsById);

  return {
    bandName: band.bandName,
    showName: show.name,
    startsAt: show.startsAt,
    startLabel: formatDateTime(show.startsAt, APP_TIME_ZONE),
    venue: show.venue,
    status: show.status,
    statusLabel: statusLabels[show.status],
    generatedAtLabel: formatCompactDateTime(generatedAt, APP_TIME_ZONE),
    notes: show.notes,
    songCount: countSongs(show),
    duration,
    blocks: show.blocks.map((block) => ({
      name: block.name,
      items: block.items.map((item): ShowExportItem => {
        if (item.type === 'separator') return { kind: 'separator' };
        if (item.type === 'planning') {
          return {
            kind: 'planning',
            description: item.description,
            durationMs: item.estimatedDurationMs,
          };
        }

        const song = songsById.get(item.songId);
        return {
          kind: 'song',
          title: song?.title ?? 'Música indisponível',
          artist: song?.originalArtist ?? null,
          key: song?.musicalKey ?? null,
          bpm: song?.bpm ?? null,
          durationMs: song?.estimatedDurationMs ?? null,
          occurrenceNotes: item.notes,
        };
      }),
    })),
  };
}

/** Conteúdo comum consumido pelo TXT, PDF e PNG. */
export function getShowExportLines(
  document: ShowExportDocument,
  options: ShowExportOptions,
): ShowExportLine[] {
  const lines: ShowExportLine[] = [
    { style: 'brand', text: document.bandName },
    { style: 'title', text: document.showName },
    { style: 'meta', text: `Início: ${document.startLabel}` },
    { style: 'meta', text: `Local: ${document.venue || 'Não informado'}` },
    { style: 'meta', text: `Situação: ${document.statusLabel}` },
  ];

  if (options.includeShowNotes && document.notes?.trim()) {
    lines.push({ style: 'section', text: 'Observações do show' });
    lines.push({ style: 'note', text: document.notes, indent: 10 });
  }

  let number = 0;
  document.blocks.forEach((block, blockIndex) => {
    lines.push({
      style: 'section',
      text: `${toRoman(blockIndex + 1)}. ${block.name}`,
      keepWithNext: block.items.length > 0,
    });

    block.items.forEach((item) => {
      if (item.kind === 'separator') {
        lines.push({ style: 'separator', text: '' });
        return;
      }

      if (item.kind === 'planning') {
        if (options.includePlanning) {
          lines.push({
            style: 'planning',
            text: `Planejamento: ${item.description}`,
          });
        }
        if (options.includeDurations && item.durationMs !== null) {
          lines.push({
            style: 'detail',
            text: `Duração do planejamento: ${formatSongDuration(item.durationMs)}`,
            indent: 14,
          });
        }
        return;
      }

      number += 1;
      lines.push({
        style: 'song',
        text: `${number}. ${item.title}`,
        keepWithNext: true,
      });
      const details: string[] = [];
      if (options.includeArtist && item.artist) {
        details.push(`Artista: ${item.artist}`);
      }
      if (options.includeKey && item.key) details.push(`Tom: ${item.key}`);
      if (options.includeBpm && item.bpm !== null) {
        details.push(`BPM: ${item.bpm}`);
      }
      if (options.includeDurations) {
        details.push(`Duração: ${formatSongDuration(item.durationMs)}`);
      }
      if (details.length) {
        lines.push({ style: 'detail', text: details.join(' · '), indent: 14 });
      }
      if (options.includeOccurrenceNotes && item.occurrenceNotes?.trim()) {
        lines.push({
          style: 'note',
          text: `Observação: ${item.occurrenceNotes}`,
          indent: 14,
        });
      }
    });
  });

  if (document.songCount === 0) {
    lines.push({ style: 'empty', text: 'Este show ainda não tem músicas.' });
  }

  if (options.includeDurations) {
    lines.push({
      style: 'total',
      text: `Duração total estimada: ${formatShowDuration(document.duration.totalMs)}`,
    });
    if (document.duration.hasDuration) {
      lines.push({
        style: 'detail',
        text: `Músicas: ${formatShowDuration(document.duration.musicMs)} · Planejamento: ${formatShowDuration(document.duration.planningMs)}`,
        indent: 10,
      });
    }
  }

  return lines;
}

export function sanitizeDocumentText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function toRoman(value: number): string {
  const digits: readonly [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  digits.forEach(([amount, numeral]) => {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  });
  return result;
}
