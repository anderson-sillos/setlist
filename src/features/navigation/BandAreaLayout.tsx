import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';

import { useBand } from '@/data/queries';
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
  readonly currentRoute: string;
  readonly editActions?: EditActions;
  readonly fixedContent?: ReactNode;
  readonly headerAction?: HeaderAction;
  readonly screenKind?: NavigationScreenKind;
  readonly scrollable?: boolean;
  readonly title: string;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

export function BandAreaLayout({
  activeSection,
  backHref,
  bandId,
  children,
  currentRoute,
  editActions,
  fixedContent,
  headerAction,
  screenKind,
  scrollable,
  title,
  viewportHeight,
  viewportWidth,
}: BandAreaLayoutProps) {
  const bandQuery = useBand(bandId);
  const bandName = bandQuery.data?.name ?? 'Carregando banda…';

  return (
    <AppNavigationShell
      activeSection={activeSection}
      backHref={backHref}
      bandId={bandId}
      bandName={bandName}
      currentRoute={currentRoute}
      editActions={editActions}
      fixedContent={fixedContent}
      headerAction={headerAction}
      screenKind={screenKind}
      scrollable={scrollable}
      subtitle={sectionLabels[activeSection]}
      testID={`band-area-${activeSection}`}
      title={title}
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {children}
    </AppNavigationShell>
  );
}
