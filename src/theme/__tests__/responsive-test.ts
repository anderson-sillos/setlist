import {
  getCatalogColumnCount,
  getLayoutMode,
  getNavigationPresentation,
  type LayoutMode,
} from '@/theme/responsive';

describe('getLayoutMode', () => {
  it.each([
    [320, 'phone'],
    [767, 'phone'],
    [768, 'tablet'],
    [1179, 'tablet'],
    [1180, 'desktop'],
    [1920, 'desktop'],
  ] as const)('classifica %d px como %s', (width, expected) => {
    expect(getLayoutMode(width)).toBe(expected);
  });
});

describe('getCatalogColumnCount', () => {
  it.each([
    { mode: 'phone', expected: 1 },
    { mode: 'tablet', expected: 2 },
    { mode: 'desktop', expected: 3 },
  ] as const)('define $expected coluna(s) para $mode', ({ mode, expected }) => {
    expect(getCatalogColumnCount(mode as LayoutMode)).toBe(expected);
  });
});

describe('getNavigationPresentation', () => {
  it.each([
    { expected: 'bottom-tabs', height: 844, width: 390 },
    { expected: 'bottom-tabs', height: 390, width: 844 },
    { expected: 'bottom-tabs', height: 1180, width: 820 },
    { expected: 'sidebar', height: 768, width: 1024 },
    { expected: 'sidebar', height: 900, width: 1440 },
  ] as const)(
    'usa $expected em ${width}x${height}',
    ({ expected, height, width }) => {
      expect(getNavigationPresentation(width, height)).toBe(expected);
    },
  );
});
