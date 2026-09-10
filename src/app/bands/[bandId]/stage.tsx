import { useLocalSearchParams } from 'expo-router';

import { StageHubScreen } from '@/features/navigation/BandSectionScreens';

export default function StageHubRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <StageHubScreen bandId={bandId} />;
}
