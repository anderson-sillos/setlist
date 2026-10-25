import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useBandContext } from '@/data/queries';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import type { EntityId } from '@/domain';
import {
  AppNavigationShell,
  type EditActions,
  type HeaderAction,
  type NavigationScreenKind,
} from '@/features/navigation/AppNavigationShell';
import type { BandSection } from '@/features/navigation/routes';

const sectionLabels: Record<BandSection, string> = {
  band: 'Banda',
  repertoire: 'Repertório',
  shows: 'Shows',
  stage: 'Modo palco',
};

interface BandAreaLayoutProps extends PropsWithChildren {
  readonly activeSection: BandSection;
  readonly backHref?: Href;
  readonly bandId: EntityId;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly currentRoute: string;
  readonly editActions?: EditActions;
  readonly fixedContent?: ReactNode;
  readonly headerAction?: HeaderAction;
  readonly leadingHeaderAction?: HeaderAction;
  readonly onRefresh?: () => void | Promise<void>;
  readonly refreshing?: boolean;
  readonly renderContentOverlay?: (contentTop: number) => ReactNode;
  readonly screenKind?: NavigationScreenKind;
  readonly scrollable?: boolean;
  readonly subtitle?: string;
  readonly title: string;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

export function BandAreaLayout({
  activeSection,
  backHref,
  bandId,
  children,
  contentStyle,
  currentRoute,
  editActions,
  fixedContent,
  headerAction,
  leadingHeaderAction,
  onRefresh,
  refreshing,
  renderContentOverlay,
  screenKind,
  scrollable,
  subtitle,
  title,
  viewportHeight,
  viewportWidth,
}: BandAreaLayoutProps) {
  const bandContextQuery = useBandContext(bandId);
  useScreenDataRefresh([bandContextQuery]);
  const bandName = bandContextQuery.data?.bandName ?? 'Carregando banda…';

  return (
    <AppNavigationShell
      activeSection={activeSection}
      backHref={backHref}
      bandId={bandId}
      bandName={bandName}
      contentStyle={contentStyle}
      currentRoute={currentRoute}
      editActions={editActions}
      fixedContent={fixedContent}
      headerAction={headerAction}
      leadingHeaderAction={leadingHeaderAction}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderContentOverlay={renderContentOverlay}
      screenKind={screenKind}
      scrollable={scrollable}
      subtitle={subtitle ?? sectionLabels[activeSection]}
      testID={`band-area-${activeSection}`}
      title={title}
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {children}
    </AppNavigationShell>
  );
}
