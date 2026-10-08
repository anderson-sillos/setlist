import { useLocalSearchParams } from 'expo-router';

import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';

export default function RepertoireRoute() {
  const { bandId, collectionId } = useLocalSearchParams<{
    bandId: string;
    collectionId?: string | string[];
  }>();
  const initialCollectionId = Array.isArray(collectionId)
    ? collectionId[0]
    : collectionId;

  return (
    <RepertoireScreen
      bandId={bandId}
      initialCollectionId={initialCollectionId}
    />
  );
}
