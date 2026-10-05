import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { getStackScreenOptions } from '@/features/navigation/stackOptions';

export default function ShowLayout() {
  const reducedMotion = useReducedMotionPreference();
  return (
    <Stack screenOptions={getStackScreenOptions(Platform.OS, reducedMotion)} />
  );
}
