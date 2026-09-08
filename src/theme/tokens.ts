export const colors = {
  ink: '#172033',
  muted: '#64748b',
  paper: '#f8f7fc',
  surface: '#ffffff',
  navy: '#0b1020',
  navyRaised: '#18213f',
  violet: '#7c3aed',
  violetDark: '#5b21b6',
  violetSoft: '#ede9fe',
  cyan: '#22d3ee',
  cyanSoft: '#cffafe',
  green: '#22c55e',
  amber: '#f59e0b',
  line: '#e2e3ef',
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
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const fontSizes = {
  caption: 12,
  body: 16,
  heading: 20,
  title: 34,
  display: 44,
} as const;

export const layout = {
  contentMaxWidth: 1200,
  tabletBreakpoint: 768,
  desktopBreakpoint: 1180,
  minimumTouchTarget: 48,
} as const;
