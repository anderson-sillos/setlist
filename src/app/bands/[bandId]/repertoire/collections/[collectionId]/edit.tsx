import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';

export default function EditRepertoireCollectionRoute() {
  const { bandId, collectionId } = useLocalSearchParams<{
    bandId: string;
    collectionId: string;
  }>();

  return (
    <RepertoireCollectionEditorScreen
      bandId={bandId}
      collectionId={collectionId}
    />
  );
}
