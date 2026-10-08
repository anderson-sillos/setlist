import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';

export default function EditRepertoireCollectionRoute() {
  const { bandId, collectionId, returnTo } = useLocalSearchParams<{
    bandId: string;
    collectionId: string;
    returnTo?: string;
  }>();

  return (
    <RepertoireCollectionEditorScreen
      bandId={bandId}
      collectionId={collectionId}
      returnTo={returnTo === 'repertoire' ? 'repertoire' : 'collections'}
    />
  );
}
