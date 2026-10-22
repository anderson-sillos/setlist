import { useLocalSearchParams } from 'expo-router';

import { ShowCalendarScreen } from '@/features/shows/ShowCalendarScreen';

export default function ShowCalendarRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <ShowCalendarScreen bandId={bandId} showId={showId} />;
}
