import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface ListEmptyStateProps {
  readonly actionLabel?: string;
  readonly message: string;
  readonly onAction?: () => void;
  readonly title: string;
}

export function ListEmptyState({
  actionLabel,
  message,
  onAction,
  title,
}: ListEmptyStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <AppText variant="heading">{title}</AppText>
      <AppText tone="muted">{message}</AppText>
      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          style={styles.action}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    margin: spacing.xl,
    maxWidth: 560,
    padding: spacing.xl,
    width: '90%',
  },
  action: {
    marginTop: spacing.sm,
  },
});
