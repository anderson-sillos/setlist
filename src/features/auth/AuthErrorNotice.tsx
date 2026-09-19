import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface AuthErrorNoticeProps {
  readonly message: string;
  readonly testID?: string;
}

export function AuthErrorNotice({
  message,
  testID = 'auth-error',
}: AuthErrorNoticeProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={styles.container}
      testID={testID}
    >
      <AppText accessibilityRole="alert" tone="accent">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
});
