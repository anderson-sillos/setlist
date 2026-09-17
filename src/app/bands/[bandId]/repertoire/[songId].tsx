import { useLocalSearchParams } from 'expo-router';

import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';

export default function SongDetailRoute() {
  const { bandId, songId } = useLocalSearchParams<{
    bandId: string;
    songId: string;
  }>();

  return <SongDetailScreen bandId={bandId} songId={songId} />;
}
