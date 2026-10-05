import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  icon?: AppIconName;
  label: string;
  leading?: ReactNode;
  onBlur?: PressableProps['onBlur'];
  onFocus?: PressableProps['onFocus'];
  variant?: ButtonVariant;
};

export const AppButton = forwardRef<
  ComponentRef<typeof Pressable>,
  AppButtonProps
>(function AppButton(
  {
    disabled,
    icon,
    label,
    leading,
    onBlur,
    onFocus,
    onPress,
    style,
    variant = 'primary',
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const contentColor = disabled ? colors.text.disabled : buttonColors[variant];
  const handlePress: NonNullable<PressableProps['onPress']> = (event) => {
    blurWebFocus();
    onPress?.(event);
  };

  return (
    <Pressable
      disabled={disabled}
      {...props}
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={handlePress}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={(state) => [
        styles.base,
        variants[variant],
        disabled && disabledVariants[variant],
        state.pressed && pressedVariants[variant],
        focused && styles.focused,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {leading ??
        (icon ? <AppIcon color={contentColor} name={icon} size={18} /> : null)}
      <AppText style={[styles.label, { color: contentColor }]}>{label}</AppText>
    </Pressable>
  );
});

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
  focused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
  },
});

const variants = StyleSheet.create({
  primary: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
  secondary: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.control,
  },
  tertiary: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.semantic.danger,
    borderColor: colors.semantic.danger,
  },
});

const pressedVariants = StyleSheet.create({
  primary: {
    backgroundColor: colors.action.pressed,
    borderColor: colors.action.pressed,
  },
  secondary: {
    backgroundColor: colors.background.pressed,
  },
  tertiary: {
    backgroundColor: colors.background.hover,
  },
  destructive: {
    opacity: 0.84,
  },
});

const disabledVariants = StyleSheet.create({
  primary: {
    backgroundColor: colors.background.pressed,
    borderColor: colors.border.subtle,
  },
  secondary: {
    backgroundColor: colors.background.base,
    borderColor: colors.border.subtle,
  },
  tertiary: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.semantic.dangerSurface,
    borderColor: colors.semantic.dangerSurface,
  },
});

const buttonColors: Record<ButtonVariant, string> = {
  primary: colors.text.onAccent,
  secondary: colors.text.primary,
  tertiary: colors.text.secondary,
  destructive: colors.text.onAccent,
};
