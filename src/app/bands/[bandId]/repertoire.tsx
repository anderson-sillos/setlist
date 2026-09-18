import { useLocalSearchParams } from 'expo-router';

import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';

export default function RepertoireRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <RepertoireScreen bandId={bandId} />;
}
