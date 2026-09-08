import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

export function AppButton({
  label,
  style,
  variant = 'primary',
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        variants[variant],
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText
        style={styles.label}
        tone={variant === 'primary' ? 'inverse' : 'accent'}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  label: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});

const variants = StyleSheet.create({
  primary: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.violet,
  },
});
