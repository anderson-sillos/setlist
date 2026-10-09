import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';

export default function NewRepertoireCollectionRoute() {
  const { bandId, returnTo, songId } = useLocalSearchParams<{
    bandId: string;
    returnTo?: string;
    songId?: string | string[];
  }>();
  const initialSongIds = Array.isArray(songId)
    ? songId
    : songId
      ? [songId]
      : [];

  return (
    <RepertoireCollectionEditorScreen
      bandId={bandId}
      initialSongIds={initialSongIds}
      returnTo={returnTo === 'repertoire' ? 'repertoire' : 'collections'}
    />
  );
}
