import { useLocalSearchParams } from 'expo-router';

import { BandScreen } from '@/features/navigation/BandSectionScreens';

export default function BandRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <BandScreen bandId={bandId} />;
}
