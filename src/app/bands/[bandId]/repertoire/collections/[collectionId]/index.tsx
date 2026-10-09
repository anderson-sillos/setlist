import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionDetailScreen } from '@/features/repertoire/RepertoireCollectionDetailScreen';

export default function RepertoireCollectionDetailRoute() {
  const { bandId, collectionId } = useLocalSearchParams<{
    bandId: string;
    collectionId: string;
  }>();

  return (
    <RepertoireCollectionDetailScreen
      bandId={bandId}
      collectionId={collectionId}
    />
  );
}
