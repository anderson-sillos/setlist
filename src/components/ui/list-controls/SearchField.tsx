import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { SearchFieldProps } from '@/components/ui/list-controls/types';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export function SearchField({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <View
        style={Platform.OS === 'web' ? styles.webSearchIcon : undefined}
        testID="search-field-icon"
      >
        <AppIcon color={colors.text.secondary} name="search" size={20} />
      </View>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Limpar busca"
          accessibilityRole="button"
          hitSlop={14}
          onPress={() => onChangeText('')}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.action.primary} name="close" size={10} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderColor: colors.border.control,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
  },
  webSearchIcon: {
    flexShrink: 0,
    height: 20,
    width: 20,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.background.hover,
    borderRadius: radii.pill,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
