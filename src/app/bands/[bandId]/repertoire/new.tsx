import { useLocalSearchParams } from 'expo-router';

import { SongEditorScreen } from '@/features/repertoire/SongEditorScreen';

export default function NewSongRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <SongEditorScreen bandId={bandId} />;
}
