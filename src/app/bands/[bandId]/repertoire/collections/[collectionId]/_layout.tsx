import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { getStackScreenOptions } from '@/features/navigation/stackOptions';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export default function RepertoireCollectionDetailLayout() {
  const reducedMotion = useReducedMotionPreference();

  return (
    <Stack screenOptions={getStackScreenOptions(Platform.OS, reducedMotion)}>
      <Stack.Screen name="index" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="edit" options={{ animationTypeForReplace: 'pop' }} />
    </Stack>
  );
}
