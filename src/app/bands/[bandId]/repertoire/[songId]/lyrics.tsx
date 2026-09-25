import { useLocalSearchParams } from 'expo-router';

import { SongLyricsScreen } from '@/features/repertoire/SongLyricsScreen';

export default function SongLyricsRoute() {
  const { bandId, songId } = useLocalSearchParams<{
    bandId: string;
    songId: string;
  }>();

  return <SongLyricsScreen bandId={bandId} songId={songId} />;
}
