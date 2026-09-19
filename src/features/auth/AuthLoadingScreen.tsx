import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { radii, spacing } from '@/theme/tokens';

interface AuthLoadingScreenProps {
  readonly label: string;
}

export function AuthLoadingScreen({ label }: AuthLoadingScreenProps) {
  return (
    <Screen contentStyle={styles.screenContent} testID="auth-gate-loading">
      <View style={styles.content}>
        <Image
          accessibilityLabel="Logo do Setlist"
          accessibilityRole="image"
          source={require('../../../assets/icons/app-icon-512.png')}
          style={styles.logo}
        />
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
  logo: {
    borderRadius: radii.lg,
    height: 88,
    width: 88,
  },
});
