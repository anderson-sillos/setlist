import { APP_LOCALE } from '@/config/localization';

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(APP_LOCALE)
    .trim();
}
