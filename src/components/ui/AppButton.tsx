import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  icon?: AppIconName;
  label: string;
  variant?: ButtonVariant;
};

export function AppButton({
  icon,
  label,
  style,
  variant = 'primary',
  ...props
}: AppButtonProps) {
  const contentColor = variant === 'primary' ? colors.surface : colors.violet;

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
      {icon ? <AppIcon color={contentColor} name={icon} size={18} /> : null}
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
    flexDirection: 'row',
    gap: spacing.sm,
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
