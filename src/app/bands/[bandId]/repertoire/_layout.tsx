import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { getStackScreenOptions } from '@/features/navigation/stackOptions';

export default function RepertoireLayout() {
  const reducedMotion = useReducedMotionPreference();
  return (
    <Stack screenOptions={getStackScreenOptions(Platform.OS, reducedMotion)}>
      <Stack.Screen name="index" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen
        name="collections"
        options={{ animationTypeForReplace: 'pop' }}
      />
    </Stack>
  );
}
