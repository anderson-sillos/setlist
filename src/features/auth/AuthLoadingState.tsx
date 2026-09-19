import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

interface AuthLoadingStateProps {
  readonly label: string;
  readonly testID?: string;
}

export function AuthLoadingState({
  label,
  testID = 'auth-loading',
}: AuthLoadingStateProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.container}
      testID={testID}
    >
      <ActivityIndicator color={colors.violet} size="small" />
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
