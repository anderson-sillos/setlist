import { useLocalSearchParams } from 'expo-router';

import { SongEditorScreen } from '@/features/repertoire/SongEditorScreen';

export default function EditSongRoute() {
  const { bandId, songId } = useLocalSearchParams<{
    bandId: string;
    songId: string;
  }>();

  return <SongEditorScreen bandId={bandId} songId={songId} />;
}
