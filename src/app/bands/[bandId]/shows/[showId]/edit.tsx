import { useLocalSearchParams } from 'expo-router';

import { ShowSetlistEditorScreen } from '@/features/shows/ShowSetlistEditorScreen';

export default function EditShowSetlistRoute() {
  const { bandId, showId } = useLocalSearchParams<{
    bandId: string;
    showId: string;
  }>();

  return <ShowSetlistEditorScreen bandId={bandId} showId={showId} />;
}
