import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
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
      [colors.background.raised, colors.background.selected],
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
      [colors.text.secondary, colors.action.primary],
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
      <View style={styles.content}>
        {selected ? (
          <View style={styles.checkSlot}>
            <AppIcon color={colors.action.primary} name="check" size={16} />
          </View>
        ) : null}
        <AnimatedText numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </AnimatedText>
      </View>
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
    flexShrink: 0,
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  content: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.xs,
  },
  checkSlot: {
    flexShrink: 0,
    height: 16,
    width: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
