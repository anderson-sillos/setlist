import { useLocalSearchParams } from 'expo-router';

import { StageUnavailableScreen } from '@/features/stage/StageUnavailableScreen';

export default function StageHubRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <StageUnavailableScreen bandId={bandId} />;
}
