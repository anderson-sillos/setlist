export const colors = {
  background: {
    canvas: '#0b0b0d',
    base: '#121214',
    raised: '#1c1c1f',
    hover: '#28282d',
    pressed: '#34343b',
    selected: '#2b203d',
    overlay: 'rgba(0, 0, 0, 0.72)',
  },
  text: {
    primary: '#f4f4f5',
    secondary: '#b8b8c2',
    muted: '#92929f',
    onAccent: '#160d24',
    onBrand: '#ffffff',
    disabled: '#92929f',
  },
  action: {
    primary: '#b692ff',
    hover: '#c5aaff',
    pressed: '#a37cf0',
  },
  border: {
    subtle: '#303035',
    control: '#74747f',
    selected: '#b692ff',
    focus: '#d0b8ff',
    error: '#ff949d',
  },
  semantic: {
    success: '#73d99f',
    successSurface: '#182b20',
    warning: '#f0c36b',
    warningSurface: '#302719',
    danger: '#ff949d',
    dangerSurface: '#341f24',
    info: '#91c9f7',
    infoSurface: '#192938',
    neutralSurface: '#28282d',
  },
  brand: {
    original: '#7c3aed',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSizes = {
  caption: 12,
  metadata: 14,
  body: 16,
  heading: 20,
  detail: 26,
  title: 30,
  display: 38,
  lyric: 24,
  footer: 12,
  version: 11,
} as const;

export const layout = {
  contentMaxWidth: 1120,
  phoneHorizontalMargin: 16,
  tabletHorizontalMargin: 24,
  desktopHorizontalMargin: 32,
  tabletBreakpoint: 768,
  desktopBreakpoint: 1180,
  minimumTouchTarget: 48,
} as const;

export const motion = {
  short: 120,
  surface: 160,
  layerOpen: 240,
  layerClose: 180,
  navigation: 140,
} as const;
