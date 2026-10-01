import { useRouter } from 'expo-router';

import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getShowHref,
  getStageHref,
} from '@/features/navigation/routes';
import { StageAvailabilityDialog } from '@/features/stage/StageAvailabilityDialog';

interface StageUnavailableScreenProps {
  readonly bandId: EntityId;
  readonly showId?: EntityId;
}

export function StageUnavailableScreen({
  bandId,
  showId,
}: StageUnavailableScreenProps) {
  const router = useRouter();
  const backHref = showId
    ? getShowHref(bandId, showId)
    : getBandSectionHref(bandId, 'shows');

  return (
    <BandAreaLayout
      activeSection="stage"
      backHref={backHref}
      bandId={bandId}
      currentRoute={
        (showId
          ? getStageHref(bandId, showId)
          : getBandSectionHref(bandId, 'stage')) as string
      }
      screenKind="detail"
      subtitle={showId ? 'o show' : 'Shows'}
      title="Modo palco"
    >
      <StageAvailabilityDialog
        onClose={() => router.replace(backHref)}
        visible
      />
    </BandAreaLayout>
  );
}
