import {
  formatDateOnly,
  formatDateFilter,
  formatRelativeUpdate,
  formatShowDate,
  formatShowListDate,
  formatShowTime,
  getDateKey,
} from '@/utils/dateTime';

describe('formatação de datas e horários', () => {
  it('combina dia da semana, data média e horário compacto', () => {
    expect(formatShowListDate('2026-09-19T21:00:00-03:00')).toBe(
      'sáb, 19 de set. de 2026 · 21h',
    );
    expect(formatShowListDate('2026-09-19T21:30:00-03:00')).toBe(
      'sáb, 19 de set. de 2026 · 21h30',
    );
  });

  it('usa horário detalhado na data completa e compacto isoladamente', () => {
    expect(formatShowDate('2026-09-19T21:30:45-03:00')).toBe(
      '19 de set. de 2026, 21:30:45',
    );
    expect(formatShowTime('2026-09-19T21:00:00-03:00')).toBe('21h');
    expect(formatShowTime('2026-09-19T21:30:00-03:00')).toBe('21h30');
  });

  it('formata datas simples no fuso do aplicativo e ignora valores inválidos', () => {
    expect(formatDateOnly('2026-09-20T11:00:00.000Z')).toBe('20/09/2026');
    expect(formatDateOnly('não é uma data')).toBeNull();
  });

  it('formata o rótulo de uma data selecionada', () => {
    expect(formatDateFilter('2026-09-19')).toBe('19 set 2026');
  });

  it('converte instantes para a data civil de São Paulo', () => {
    expect(getDateKey('2026-09-10T01:30:00.000Z')).toBe('2026-09-09');
  });

  it('formata atualizações relativas', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');

    expect(formatRelativeUpdate('2026-09-09T11:59:45.000Z', now)).toBe('agora');
    expect(formatRelativeUpdate('2026-09-09T11:45:00.000Z', now)).toBe(
      'há 15 min',
    );
    expect(formatRelativeUpdate('2026-09-09T09:00:00.000Z', now)).toBe(
      'há 3 h',
    );
    expect(formatRelativeUpdate('2026-09-08T12:00:00.000Z', now)).toBe(
      'há 1 dia',
    );
    expect(formatRelativeUpdate('2026-09-06T12:00:00.000Z', now)).toBe(
      'há 3 dias',
    );
    expect(formatRelativeUpdate('2026-08-01T12:00:00.000Z', now)).toMatch(
      /1 de ago\. de 2026/,
    );
  });
});
