export interface BrazilianHoliday {
  readonly dateKey: string;
  readonly name: string;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function addUtcDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

export function getBrazilianNationalHolidays(
  year: number,
): readonly BrazilianHoliday[] {
  const easter = getEasterSunday(year);
  const goodFriday = addUtcDays(easter, -2);
  const carnivalTuesday = addUtcDays(easter, -47);
  const corpusChristi = addUtcDays(easter, 60);

  return [
    {
      dateKey: toDateKey(year, 1, 1),
      name: 'Confraternização Universal',
    },
    {
      dateKey: toDateKey(
        carnivalTuesday.getUTCFullYear(),
        carnivalTuesday.getUTCMonth() + 1,
        carnivalTuesday.getUTCDate(),
      ),
      name: 'Carnaval (terça-feira)',
    },
    {
      dateKey: toDateKey(
        goodFriday.getUTCFullYear(),
        goodFriday.getUTCMonth() + 1,
        goodFriday.getUTCDate(),
      ),
      name: 'Paixão de Cristo',
    },
    { dateKey: toDateKey(year, 4, 21), name: 'Tiradentes' },
    { dateKey: toDateKey(year, 5, 1), name: 'Dia Mundial do Trabalho' },
    {
      dateKey: toDateKey(
        corpusChristi.getUTCFullYear(),
        corpusChristi.getUTCMonth() + 1,
        corpusChristi.getUTCDate(),
      ),
      name: 'Corpus Christi',
    },
    { dateKey: toDateKey(year, 9, 7), name: 'Independência do Brasil' },
    { dateKey: toDateKey(year, 10, 12), name: 'Nossa Senhora Aparecida' },
    { dateKey: toDateKey(year, 11, 2), name: 'Finados' },
    { dateKey: toDateKey(year, 11, 15), name: 'Proclamação da República' },
    {
      dateKey: toDateKey(year, 11, 20),
      name: 'Dia Nacional de Zumbi e da Consciência Negra',
    },
    { dateKey: toDateKey(year, 12, 25), name: 'Natal' },
  ];
}

export function getSaoPauloDateKey(value: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).formatToParts(typeof value === 'string' ? new Date(value) : value);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}
