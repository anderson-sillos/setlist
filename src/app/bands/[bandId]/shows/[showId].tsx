import { useLocalSearchParams } from 'expo-router';

import { ShowDetailScreen } from '@/features/navigation/ContentDetailScreens';

export default function ShowDetailRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <ShowDetailScreen bandId={bandId} showId={showId} />;
}
