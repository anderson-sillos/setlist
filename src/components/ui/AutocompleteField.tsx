import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
  const inputRef = useRef<TextInput>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearBlurTimeout();
    },
    [],
  );

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

  const normalizedValue = normalizeForSearch(value);
  const hasDifferentSingleSuggestion =
    suggestions.length === 1 &&
    normalizeForSearch(suggestions[0] ?? '') !== normalizedValue;
  const showSuggestions =
    focused && (suggestions.length > 1 || hasDifferentSingleSuggestion);

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
        onFocus={() => {
          clearBlurTimeout();
          setFocused(true);
        }}
        onBlur={() => {
          clearBlurTimeout();
          blurTimeoutRef.current = setTimeout(() => {
            blurTimeoutRef.current = null;
            setFocused(false);
          }, 150);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        ref={inputRef}
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
                clearBlurTimeout();
                onChangeText(suggestion);
                setFocused(true);
                inputRef.current?.focus();
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
