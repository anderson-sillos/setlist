import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type PressableStateCallbackType,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ChoiceChipsProps } from '@/components/ui/list-controls/types';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { colors, fontSizes, motion, radii, spacing } from '@/theme/tokens';

export function ChoiceChips<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: ChoiceChipsProps<Value>) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      contentContainerStyle={styles.chips}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => (
        <ChoiceChip
          key={option.value}
          onChange={() => onChange(option.value)}
          reducedMotion={reducedMotion}
          selected={option.value === value}
          label={option.label}
        />
      ))}
    </ScrollView>
  );
}

function ChoiceChip({
  label,
  onChange,
  reducedMotion,
  selected,
}: {
  readonly label: string;
  readonly onChange: () => void;
  readonly reducedMotion: boolean;
  readonly selected: boolean;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.background.base, colors.action.primary],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border.control, colors.action.primary],
    ),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.text.secondary, colors.text.onAccent],
    ),
  }));

  useEffect(() => {
    progress.set(
      withTiming(selected ? 1 : 0, {
        duration: reducedMotion ? 0 : motion.surface,
      }),
    );
  }, [progress, reducedMotion, selected]);

  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onChange}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.chip,
        chipStyle,
        pressed && styles.pressed,
      ]}
    >
      <AnimatedText style={[styles.label, labelStyle]}>{label}</AnimatedText>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

const styles = StyleSheet.create({
  chips: {
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.text.secondary,
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
