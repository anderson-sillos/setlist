import { useLocalSearchParams } from 'expo-router';

import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';

export default function NewRepertoireCollectionRoute() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();

  return <RepertoireCollectionEditorScreen bandId={bandId} />;
}
