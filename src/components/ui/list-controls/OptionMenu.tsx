import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import {
  MenuButton,
  OptionSheet,
} from '@/components/ui/list-controls/OptionSheet';
import type { OptionMenuProps } from '@/components/ui/list-controls/types';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

export function OptionMenu<Value extends string>({
  active = false,
  accessibilityLabel,
  compact = false,
  icon,
  label,
  onChange,
  options,
  value,
}: OptionMenuProps<Value>) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;
  const close = () => setOpen(false);

  return (
    <>
      <MenuButton
        active={active}
        accessibilityLabel={accessibilityLabel}
        accessibilityValueText={selectedLabel}
        icon={icon}
        label={compact ? label : `${label}: ${selectedLabel}`}
        onPress={() => setOpen(true)}
      />

      <OptionSheet
        closeAccessibilityLabel="Fechar opções"
        label={label}
        onClose={close}
        visible={open}
      >
        <View accessibilityRole="radiogroup" style={styles.optionList}>
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <Pressable
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={option.value}
                onPress={() => {
                  blurWebFocus();
                  onChange(option.value);
                  close();
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.indicator}>
                  {selected ? (
                    <AppIcon
                      color={colors.violet}
                      name="check"
                      size={18}
                      strokeWidth={2.5}
                    />
                  ) : null}
                </View>
                <AppText style={styles.label}>{option.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  optionList: {
    gap: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.violetSoft,
  },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
