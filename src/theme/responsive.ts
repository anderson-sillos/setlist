import { layout } from '@/theme/tokens';

export type LayoutMode = 'phone' | 'tablet' | 'desktop';

export function getLayoutMode(viewportWidth: number): LayoutMode {
  if (viewportWidth >= layout.desktopBreakpoint) {
    return 'desktop';
  }

  if (viewportWidth >= layout.tabletBreakpoint) {
    return 'tablet';
  }

  return 'phone';
}

export function getCatalogColumnCount(layoutMode: LayoutMode): number {
  switch (layoutMode) {
    case 'desktop':
      return 3;
    case 'tablet':
      return 2;
    case 'phone':
      return 1;
  }
}
