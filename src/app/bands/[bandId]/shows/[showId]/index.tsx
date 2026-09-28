import { useLocalSearchParams } from 'expo-router';

import { ShowDetailScreen } from '@/features/shows/ShowDetailScreen';

export default function ShowDetailRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <ShowDetailScreen bandId={bandId} showId={showId} />;
}
