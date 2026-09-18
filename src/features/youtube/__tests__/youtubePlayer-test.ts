import {
  extractYouTubeVideoId,
  formatYouTubeTime,
  getYouTubePlayerState,
} from '@/features/youtube/youtubePlayer';

describe('youtubePlayer', () => {
  it.each([
    ['https://www.youtube.com/watch?v=M7lc1UVf-VE', 'M7lc1UVf-VE'],
    ['https://youtu.be/M7lc1UVf-VE?t=12', 'M7lc1UVf-VE'],
    ['https://www.youtube.com/embed/M7lc1UVf-VE', 'M7lc1UVf-VE'],
    ['https://www.youtube.com/shorts/M7lc1UVf-VE', 'M7lc1UVf-VE'],
    ['M7lc1UVf-VE', 'M7lc1UVf-VE'],
  ])('extrai o vídeo de %s', (reference, expected) => {
    expect(extractYouTubeVideoId(reference)).toBe(expected);
  });

  it.each(['', 'https://example.com/watch?v=M7lc1UVf-VE', 'not-valid'])(
    'rejeita referência inválida %s',
    (reference) => {
      expect(extractYouTubeVideoId(reference)).toBeNull();
    },
  );

  it.each([
    [0, '0:00'],
    [65, '1:05'],
    [3661, '1:01:01'],
    [Number.NaN, '0:00'],
  ])('formata %s segundos como %s', (seconds, expected) => {
    expect(formatYouTubeTime(seconds)).toBe(expected);
  });

  it.each([
    [-1, 'unstarted'],
    [0, 'ended'],
    [1, 'playing'],
    [2, 'paused'],
    [3, 'buffering'],
    [5, 'cued'],
    [99, 'unstarted'],
  ] as const)('mapeia o estado %s', (state, expected) => {
    expect(getYouTubePlayerState(state)).toBe(expected);
  });
});
