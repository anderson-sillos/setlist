import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { getStackScreenOptions } from '@/features/navigation/stackOptions';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export default function RepertoireCollectionsLayout() {
  const reducedMotion = useReducedMotionPreference();

  return (
    <Stack screenOptions={getStackScreenOptions(Platform.OS, reducedMotion)}>
      <Stack.Screen name="index" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen
        name="new"
        options={{
          animation: reducedMotion ? 'none' : 'fade',
          animationTypeForReplace: 'pop',
          contentStyle: { backgroundColor: 'transparent' },
          presentation: 'transparentModal',
        }}
      />
      <Stack.Screen
        name="[collectionId]"
        options={{ animationTypeForReplace: 'pop' }}
      />
    </Stack>
  );
}
