import { useLocalSearchParams } from 'expo-router';

import { StageHubScreen } from '@/features/stage/StageHubScreen';

export default function StageHubRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <StageHubScreen bandId={bandId} />;
}
