import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionsScreen } from '@/features/repertoire/RepertoireCollectionsScreen';

export default function RepertoireCollectionsRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <RepertoireCollectionsScreen bandId={bandId} />;
}
