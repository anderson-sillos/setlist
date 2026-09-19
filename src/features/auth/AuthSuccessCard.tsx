import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors, radii, spacing } from '@/theme/tokens';

interface AuthSuccessCardProps {
  readonly email?: string;
  readonly onContinue: () => void;
  readonly testID?: string;
  readonly withInvite?: boolean;
}

export function AuthSuccessCard({
  email,
  onContinue,
  testID = 'auth-success-card',
  withInvite = false,
}: AuthSuccessCardProps) {
  return (
    <Card style={styles.card} testID={testID} tone="accent">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        <AppIcon color={colors.violetDark} name="check" size={28} />
      </View>
      <AppText accessibilityRole="header" variant="heading">
        Login concluído
      </AppText>
      <AppText tone="muted">
        Sua conta foi autenticada com sucesso. Você já pode continuar no
        Setlist.
      </AppText>
      {email ? (
        <AppText selectable style={styles.email} testID="auth-success-email">
          {email}
        </AppText>
      ) : null}
      <AppButton
        icon="forward"
        label={
          withInvite
            ? 'Continuar para o convite'
            : 'Continuar para Minhas bandas'
        }
        onPress={onContinue}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  email: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    color: colors.violetDark,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    justifyContent: 'center',
    padding: spacing.sm,
  },
});
