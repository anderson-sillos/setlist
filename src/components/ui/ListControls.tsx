import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export interface ChoiceOption<Value extends string> {
  readonly label: string;
  readonly value: Value;
}

interface SearchFieldProps {
  readonly accessibilityLabel: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}

interface ChoiceChipsProps<Value extends string> {
  readonly accessibilityLabel: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value;
}

interface OptionMenuProps<Value extends string> {
  readonly accessibilityLabel: string;
  readonly compact?: boolean;
  readonly label: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value;
}

interface FilterMenuProps {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly label: string;
  readonly summary?: string;
}

export function ListControls({ children }: { readonly children: ReactNode }) {
  return <View style={styles.controls}>{children}</View>;
}

export function SearchField({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value,
}: SearchFieldProps) {
  return (
    <View style={styles.searchField}>
      <AppText tone="muted">⌕</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

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
              selected && styles.chipSelected,
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

export function FilterMenu({
  accessibilityLabel,
  children,
  label,
  summary,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <AppText numberOfLines={1} tone="accent" variant="caption">
          {label}
          {summary ? `: ${summary}` : ''}⌄
        </AppText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          accessibilityLabel="Fechar filtros"
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={styles.modalScrim}
        >
          <View style={styles.optionSheet}>
            <AppText accessibilityRole="header" variant="heading">
              {label}
            </AppText>
            <View style={styles.filterContent}>{children}</View>
            <Pressable
              accessibilityLabel="Aplicar filtros"
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText tone="inverse">Concluir</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function OptionMenu<Value extends string>({
  accessibilityLabel,
  compact = false,
  label,
  onChange,
  options,
  value,
}: OptionMenuProps<Value>) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityValue={{ text: selectedLabel }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <AppText numberOfLines={1} tone="accent" variant="caption">
          {compact ? label : `${label}: ${selectedLabel}`}⌄
        </AppText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          accessibilityLabel="Fechar opções"
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={styles.modalScrim}
        >
          <View style={styles.optionSheet}>
            <AppText accessibilityRole="header" variant="heading">
              {label}
            </AppText>
            <View accessibilityRole="radiogroup" style={styles.optionList}>
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText>{selected ? '✓  ' : ''}</AppText>
                    <AppText style={styles.optionLabel}>{option.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.sm,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
  },
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
  chipSelected: {
    backgroundColor: colors.violet,
  },
  menuButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  modalScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 32, 0.56)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  optionSheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
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
  optionSelected: {
    backgroundColor: colors.violetSoft,
  },
  optionLabel: {
    flex: 1,
  },
  filterContent: {
    gap: spacing.lg,
  },
  applyButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    opacity: 0.72,
  },
});
