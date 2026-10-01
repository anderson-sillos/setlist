import { useLocalSearchParams } from 'expo-router';

import { StageUnavailableScreen } from '@/features/stage/StageUnavailableScreen';

export default function StageRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <StageUnavailableScreen bandId={bandId} showId={showId} />;
}
