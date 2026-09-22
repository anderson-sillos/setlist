import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { normalizeForSearch } from '@/utils/text';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface AutocompleteFieldProps {
  readonly accessibilityLabel: string;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly error?: string;
  readonly label: string;
  readonly onChangeText: (value: string) => void;
  readonly options: readonly string[];
  readonly placeholder: string;
  readonly value: string;
}

export function AutocompleteField({
  accessibilityLabel,
  containerStyle,
  error,
  label,
  onChangeText,
  options,
  placeholder,
  value,
}: AutocompleteFieldProps) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => {
    const query = normalizeForSearch(value);
    const seen = new Set<string>();

    return options.filter((option) => {
      const normalizedOption = normalizeForSearch(option);

      if (
        !normalizedOption ||
        seen.has(normalizedOption) ||
        (query.length > 0 && !normalizedOption.includes(query))
      ) {
        return false;
      }

      seen.add(normalizedOption);
      return true;
    });
  }, [options, value]);

  const showSuggestions = focused && suggestions.length > 0;

  return (
    <View style={[styles.field, containerStyle]}>
      <AppText variant="caption">{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          showSuggestions
            ? 'Sugestões disponíveis; escolha uma para preencher o campo.'
            : undefined
        }
        autoCapitalize="sentences"
        autoCorrect={false}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
      {showSuggestions ? (
        <View style={styles.suggestions}>
          {suggestions.slice(0, 6).map((suggestion) => (
            <Pressable
              accessibilityLabel={`Usar ${suggestion}`}
              accessibilityRole="button"
              key={suggestion}
              onPress={() => {
                onChangeText(suggestion);
                setFocused(false);
              }}
              style={({ pressed }) => [
                styles.suggestion,
                pressed && styles.pressed,
              ]}
            >
              <AppText>{suggestion}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.xs,
    minWidth: 160,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    outlineWidth: Platform.OS === 'web' ? 0 : undefined,
    paddingHorizontal: spacing.md,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
    zIndex: 10,
  },
  suggestion: {
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.violetSoft,
  },
  error: {
    color: '#b91c1c',
  },
});
