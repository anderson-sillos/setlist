import { useLocalSearchParams } from 'expo-router';

import { ShowExportScreen } from '@/features/shows/ShowExportScreen';

export default function ShowExportRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <ShowExportScreen bandId={bandId} showId={showId} />;
}
