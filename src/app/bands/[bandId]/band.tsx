import { useLocalSearchParams } from 'expo-router';

import { BandScreen } from '@/features/bands/BandScreen';

export default function BandRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <BandScreen bandId={bandId} />;
}
