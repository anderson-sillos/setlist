import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { ChoiceChipsProps } from '@/components/ui/list-controls/types';
import { colors, radii, spacing } from '@/theme/tokens';

export function ChoiceChips<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: ChoiceChipsProps<Value>) {
  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      contentContainerStyle={styles.chips}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone={selected ? 'inverse' : 'accent'} variant="caption">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    borderColor: colors.violet,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.violet,
  },
  pressed: {
    opacity: 0.72,
  },
});
