import { useLocalSearchParams } from 'expo-router';

import { ShowsScreen } from '@/features/shows/ShowsScreen';

export default function ShowsRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <ShowsScreen bandId={bandId} />;
}
