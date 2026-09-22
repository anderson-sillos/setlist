import {
  APP_LOCALE,
  APP_TIME_ZONE,
  UTC_TIME_ZONE,
} from '@/config/localization';

export function formatShowDate(startsAt: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(startsAt));
}

export function formatDateOnly(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
  }).format(date);
}

export function formatShowListDate(startsAt: string): string {
  const date = new Date(startsAt);
  const weekday = new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    weekday: 'short',
  })
    .format(date)
    .replace(/\.$/, '');
  const calendarDate = new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(date);

  return `${weekday}, ${calendarDate} · ${formatShowTime(startsAt)}`;
}

export function formatShowTime(startsAt: string): string {
  const parts = new Intl.DateTimeFormat(APP_LOCALE, {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  }).formatToParts(new Date(startsAt));
  const hour = parts.find(({ type }) => type === 'hour')?.value ?? '';
  const minute = parts.find(({ type }) => type === 'minute')?.value ?? '';

  return minute === '00' ? `${hour}h` : `${hour}h${minute}`;
}

export function formatDateFilter(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const monthLabel = new Intl.DateTimeFormat(APP_LOCALE, {
    month: 'short',
    timeZone: UTC_TIME_ZONE,
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(/\.$/, '');

  return `${day.toString().padStart(2, '0')} ${monthLabel} ${year}`;
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

  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(updatedAt));
}

export function getDateKey(
  value: Date | string,
  timeZone: string = APP_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(typeof value === 'string' ? new Date(value) : value);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}
