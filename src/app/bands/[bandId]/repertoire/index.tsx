import { useLocalSearchParams } from 'expo-router';

import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';

export default function RepertoireRoute() {
  const { bandId, collectionId, addToCollectionId } = useLocalSearchParams<{
    bandId: string;
    collectionId?: string | string[];
    addToCollectionId?: string | string[];
  }>();
  const initialCollectionId = Array.isArray(collectionId)
    ? collectionId[0]
    : collectionId;

  return (
    <RepertoireScreen
      bandId={bandId}
      initialAppendCollectionId={
        Array.isArray(addToCollectionId)
          ? addToCollectionId[0]
          : addToCollectionId
      }
      initialCollectionId={initialCollectionId}
    />
  );
}
