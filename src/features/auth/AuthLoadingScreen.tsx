import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { AppLogo } from '@/components/ui/AppLogo';
import { Screen } from '@/components/ui/Screen';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { spacing } from '@/theme/tokens';

interface AuthLoadingScreenProps {
  readonly label: string;
}

export function AuthLoadingScreen({ label }: AuthLoadingScreenProps) {
  return (
    <Screen contentStyle={styles.screenContent} testID="auth-gate-loading">
      <View style={styles.content}>
        <AppLogo size={64} />
        <AppText accessibilityRole="header" variant="heading">
          Setlist
        </AppText>
        <AuthLoadingState label={label} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 320,
    paddingVertical: spacing.xxxl,
  },
});
