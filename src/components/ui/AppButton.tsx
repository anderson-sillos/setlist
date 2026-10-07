import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type PressableStateCallbackType,
} from 'react-native';
import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, motion, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
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
    onPressIn,
    onPressOut,
    style,
    variant = 'primary',
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  const pressProgress = useSharedValue(0);
  const contentColor = disabled ? colors.text.disabled : buttonColors[variant];
  const animatedSurface = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        pressProgress.value,
        [0, 1],
        ['rgba(0, 0, 0, 0)', surfaces[variant].pressed],
      ),
    };
  });
  const animatePress = (pressed: boolean) => {
    pressProgress.value = withTiming(pressed && !disabled ? 1 : 0, {
      duration: reducedMotion ? 0 : motion.short,
    });
  };
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
      onPressIn={(event) => {
        animatePress(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animatePress(false);
        onPressOut?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={(state: PressableStateCallbackType) => [
        styles.base,
        variants[variant],
        disabled && disabledVariants[variant],
        state.pressed && pressedVariants[variant],
        focused && styles.focused,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AnimatedSurface
        pointerEvents="none"
        style={[styles.pressOverlay, animatedSurface]}
      />
      <View pointerEvents="box-none" style={styles.content}>
        {leading ??
          (icon ? (
            <AppIcon color={contentColor} name={icon} size={18} />
          ) : null)}
        <AppText style={[styles.label, { color: contentColor }]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
});

const AnimatedSurface = Animated.createAnimatedComponent(View);

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
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  pressOverlay: {
    borderRadius: radii.md - 1,
    bottom: 1,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 1,
    zIndex: 0,
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
    borderColor: colors.action.pressed,
  },
  secondary: {},
  tertiary: {},
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
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.semantic.dangerSurface,
    borderColor: colors.semantic.dangerSurface,
  },
});

const surfaces: Record<ButtonVariant, { readonly pressed: string }> = {
  primary: {
    pressed: colors.action.pressed,
  },
  secondary: {
    pressed: colors.background.pressed,
  },
  tertiary: {
    pressed: colors.background.hover,
  },
  destructive: {
    pressed: colors.semantic.danger,
  },
};

const buttonColors: Record<ButtonVariant, string> = {
  primary: colors.text.onAccent,
  secondary: colors.text.primary,
  tertiary: colors.text.secondary,
  destructive: colors.text.onAccent,
};
