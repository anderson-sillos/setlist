import {
  formatDuration,
  formatShowDuration,
  formatSongDuration,
} from '@/utils/duration';

describe('formatação de durações', () => {
  it('formata a duração técnica em minutos e segundos', () => {
    expect(formatDuration(218_000)).toBe('3:38');
    expect(formatDuration(3_661_000)).toBe('1:01:01');
    expect(formatDuration(null)).toBe('Não informada');
  });

  it('apresenta a duração total em horas e minutos sem segundos', () => {
    expect(formatShowDuration(1_177_000)).toBe('19min');
    expect(formatShowDuration(3_661_000)).toBe('1h 1min');
    expect(formatShowDuration(3_600_000)).toBe('1h');
    expect(formatShowDuration(null)).toBe('Não informada');
  });

  it('apresenta a duração da música com horas, minutos e segundos', () => {
    expect(formatSongDuration(218_000)).toBe('3min38s');
    expect(formatSongDuration(5_535_000)).toBe('1h32min15s');
    expect(formatSongDuration(3_605_000)).toBe('1h0min5s');
    expect(formatSongDuration(45_000)).toBe('45s');
    expect(formatSongDuration(null)).toBe('Não informada');
  });
});
