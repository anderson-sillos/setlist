import { layout } from '@/theme/tokens';

export type LayoutMode = 'phone' | 'tablet' | 'desktop';
export type NavigationPresentation = 'bottom-tabs' | 'sidebar';

export function getLayoutMode(viewportWidth: number): LayoutMode {
  if (viewportWidth >= layout.desktopBreakpoint) {
    return 'desktop';
  }

  if (viewportWidth >= layout.tabletBreakpoint) {
    return 'tablet';
  }

  return 'phone';
}

export function getNavigationPresentation(
  viewportWidth: number,
  viewportHeight: number,
): NavigationPresentation {
  const isDesktop = viewportWidth >= layout.desktopBreakpoint;
  const isTabletLandscape =
    Math.min(viewportWidth, viewportHeight) >= layout.tabletBreakpoint &&
    viewportWidth > viewportHeight;

  return isDesktop || isTabletLandscape ? 'sidebar' : 'bottom-tabs';
}
