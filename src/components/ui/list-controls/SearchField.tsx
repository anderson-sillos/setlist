import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { SearchFieldProps } from '@/components/ui/list-controls/types';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export function SearchField({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value,
}: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <AppIcon color={colors.muted} name="search" size={20} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
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
          <AppIcon color={colors.violet} name="close" size={10} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
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
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
