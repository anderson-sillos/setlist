import { useLocalSearchParams } from 'expo-router';

import { StageScreen } from '@/features/stage/StageScreen';

export default function StageRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <StageScreen bandId={bandId} showId={showId} />;
}
