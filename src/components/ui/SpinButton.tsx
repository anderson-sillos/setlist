import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface SpinButtonProps {
  readonly accessibilityLabel: string;
  readonly decrementLabel?: string;
  readonly incrementLabel?: string;
  readonly maxLength?: number;
  readonly max?: number;
  readonly min?: number;
  readonly onChangeText: (value: string) => void;
  readonly value: string;
}

export function SpinButton({
  accessibilityLabel,
  decrementLabel = 'Diminuir valor',
  incrementLabel = 'Aumentar valor',
  maxLength = 3,
  max = 999,
  min = 0,
  onChangeText,
  value,
}: SpinButtonProps) {
  const inputRef = useRef<TextInput>(null);
  const numericValue = value.trim() ? Number(value) : null;
  const canDecrement = numericValue !== null && numericValue > min;
  const canIncrement = numericValue === null || numericValue < max;

  const changeBy = (amount: number) => {
    if (numericValue === null && amount < 0) {
      return;
    }

    const baseValue = numericValue ?? min;
    const nextValue = Math.min(max, Math.max(min, baseValue + amount));
    const nextText = String(nextValue);

    onChangeText(nextText);
    inputRef.current?.focus();
    inputRef.current?.setNativeProps({
      selection: { end: nextText.length, start: 0 },
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="spinbutton"
        keyboardType="number-pad"
        maxLength={maxLength}
        onChangeText={(nextValue) => onChangeText(nextValue.replace(/\D/g, ''))}
        placeholder="00"
        placeholderTextColor={colors.muted}
        ref={inputRef}
        selectTextOnFocus
        style={styles.input}
        value={value}
      />
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={incrementLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrement }}
          disabled={!canIncrement}
          hitSlop={8}
          onPress={() => changeBy(1)}
          style={({ pressed }) => [
            styles.control,
            !canIncrement && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.violet} name="add" size={16} />
        </Pressable>
        <Pressable
          accessibilityLabel={decrementLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrement }}
          disabled={!canDecrement}
          hitSlop={8}
          onPress={() => changeBy(-1)}
          style={({ pressed }) => [
            styles.control,
            !canDecrement && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.violet} name="minus" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    flex: 1,
    minHeight: layout.minimumTouchTarget,
    minWidth: 0,
    paddingLeft: spacing.xs,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    minWidth: 0,
    outlineWidth: 0,
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
    paddingRight: spacing.xs,
    width: 32,
  },
  control: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 20,
    justifyContent: 'center',
    width: 28,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.violetSoft,
  },
});
