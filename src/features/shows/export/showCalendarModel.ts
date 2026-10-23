import * as Crypto from 'expo-crypto';

import type { Show } from '@/domain';
import { APP_LOCALE, APP_TIME_ZONE } from '@/config/localization';

export interface CalendarDraft {
  readonly showId: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly startsAt: string;
  readonly startLabel: string;
  readonly timeZone: string;
  readonly venue: string;
  readonly showNotes: string | null;
  readonly endAt: string;
  readonly endLabel: string;
  readonly usesDefaultDurationEstimate: boolean;
}

export interface CalendarEventCopy {
  readonly title: string;
  readonly location: string;
  readonly description: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly timeZone: string;
}

export type CalendarDraftValidation =
  | { readonly valid: true; readonly event: CalendarEventCopy }
  | { readonly valid: false; readonly message: string };

const statusLabels: Record<Show['status'], string> = {
  cancelled: 'Cancelado',
  draft: 'Rascunho',
  ready: 'Pronto',
};

const DEFAULT_ESTIMATED_DURATION_MS = 2 * 60 * 60 * 1000;

interface ZonedParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

function getZonedParts(value: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(value);
  const read = (name: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === name)?.value ?? NaN);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

export function getZonedDateTimeFields(
  value: Date | string,
  timeZone = APP_TIME_ZONE,
): { readonly date: string; readonly time: string } {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const parts = getZonedParts(date, timeZone);
  return {
    date: `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`,
    time: `${parts.hour.toString().padStart(2, '0')}:${parts.minute.toString().padStart(2, '0')}`,
  };
}

function formatStart(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data e horário indisponíveis';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

function formatEventTime(value: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(value);
}

export function createCalendarDraft(
  show: Show,
  bandName: string,
  estimatedDurationMs: number | null,
): CalendarDraft {
  const startsAt = new Date(show.startsAt);
  const hasValidStart = !Number.isNaN(startsAt.getTime());
  const positiveDurationEstimate =
    estimatedDurationMs !== null &&
    Number.isFinite(estimatedDurationMs) &&
    estimatedDurationMs > 0
      ? estimatedDurationMs
      : null;
  const usesDefaultDurationEstimate = positiveDurationEstimate === null;
  const effectiveDuration =
    positiveDurationEstimate ?? DEFAULT_ESTIMATED_DURATION_MS;
  const end = hasValidStart
    ? new Date(startsAt.getTime() + effectiveDuration)
    : new Date(Number.NaN);
  return {
    showId: show.id,
    title: `${bandName} — ${show.name}`,
    statusLabel: statusLabels[show.status],
    startsAt: show.startsAt,
    startLabel: formatStart(show.startsAt),
    timeZone: APP_TIME_ZONE,
    venue: show.venue,
    showNotes: show.notes,
    endAt: Number.isNaN(end.getTime()) ? '' : end.toISOString(),
    endLabel: Number.isNaN(end.getTime())
      ? 'Horário indisponível'
      : formatEventTime(end),
    usesDefaultDurationEstimate,
  };
}

export function validateCalendarDraft(
  draft: CalendarDraft,
  includeNotes: boolean,
): CalendarDraftValidation {
  const startDate = new Date(draft.startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return { valid: false, message: 'O início salvo do show é inválido.' };
  }
  const end = new Date(draft.endAt);
  if (Number.isNaN(end.getTime())) {
    return {
      valid: false,
      message: 'O horário de término estimado é inválido.',
    };
  }
  if (end.getTime() <= startDate.getTime()) {
    return {
      valid: false,
      message: 'O término deve acontecer depois do início do show.',
    };
  }

  const description = [
    `Banda e show: ${draft.title}`,
    `Status no Setlist: ${draft.statusLabel}`,
    `Fuso de referência: ${draft.timeZone}`,
    `Término estimado: ${draft.endLabel}`,
    draft.usesDefaultDurationEstimate
      ? 'A estimativa padrão de duas horas foi usada porque o setlist não tem durações positivas cadastradas.'
      : 'A estimativa considera as durações cadastradas no setlist e pode diferir do término real.',
    ...(includeNotes && draft.showNotes?.trim()
      ? [`Observações: ${draft.showNotes.trim()}`]
      : []),
    'Esta é uma cópia pontual. Alterações no Setlist não atualizam este evento.',
  ].join('\n');
  return {
    valid: true,
    event: {
      title: draft.title,
      location: draft.venue,
      description,
      startDate,
      endDate: end,
      timeZone: draft.timeZone,
    },
  };
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n?|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function utf8Length(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let byteCount = 0;
  let limit = 75;
  for (const character of line) {
    const characterBytes = utf8Length(character);
    if (byteCount + characterBytes > limit && current) {
      parts.push(current);
      current = ' ';
      byteCount = 1;
      limit = 75;
    }
    current += character;
    byteCount += characterBytes;
  }
  parts.push(current);
  return parts.join('\r\n');
}

function formatIcsDate(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Serializa uma cópia RFC 5545 com início e término em UTC (`Z`), preservando
 * os instantes interpretados no fuso explícito do show. SUMMARY recebe banda e
 * show; LOCATION recebe o local; DESCRIPTION recebe status, fuso, a estimativa
 * do término e somente as observações escolhidas. O UID é um SHA-256 estável do
 * ID do show, então novas exportações do mesmo show mantêm a identidade e
 * calendários externos podem tratá-las como duplicatas. Não há
 * `TZID`/`VTIMEZONE`: os horários são UTC. Cada linha é dobrada no limite de 75
 * octetos UTF-8.
 */
export async function createShowCalendarIcs(
  draft: CalendarDraft,
  event: CalendarEventCopy,
  generatedAt = new Date(),
): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `setlist-show:${draft.showId}`,
  );
  const uid = `${digest.toLowerCase()}@setlistbr.app.br`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Setlist//Show Calendar Copy//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(generatedAt)}`,
    `DTSTART:${formatIcsDate(event.startDate)}`,
    `DTEND:${formatIcsDate(event.endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}
