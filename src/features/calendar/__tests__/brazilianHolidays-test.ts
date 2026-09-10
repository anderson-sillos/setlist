import {
  getBrazilianNationalHolidays,
  getEasterSunday,
  getSaoPauloDateKey,
} from '@/features/calendar/brazilianHolidays';

describe('feriados nacionais do Brasil', () => {
  it('calcula a Páscoa e a Paixão de Cristo sem consultar API', () => {
    expect(getEasterSunday(2026).toISOString()).toBe(
      '2026-04-05T00:00:00.000Z',
    );
    expect(getBrazilianNationalHolidays(2026)).toContainEqual({
      dateKey: '2026-04-03',
      name: 'Paixão de Cristo',
    });
    expect(getBrazilianNationalHolidays(2026)).toContainEqual({
      dateKey: '2026-02-17',
      name: 'Carnaval (terça-feira)',
    });
    expect(getBrazilianNationalHolidays(2026)).toContainEqual({
      dateKey: '2026-06-04',
      name: 'Corpus Christi',
    });
  });

  it('inclui os feriados nacionais fixos vigentes', () => {
    const holidays = getBrazilianNationalHolidays(2026);

    expect(holidays).toContainEqual({
      dateKey: '2026-09-07',
      name: 'Independência do Brasil',
    });
    expect(holidays).toContainEqual({
      dateKey: '2026-11-20',
      name: 'Dia Nacional de Zumbi e da Consciência Negra',
    });
    expect(holidays).toHaveLength(12);
  });

  it('converte instantes para a data civil de São Paulo', () => {
    expect(getSaoPauloDateKey('2026-09-10T01:30:00.000Z')).toBe('2026-09-09');
  });
});
