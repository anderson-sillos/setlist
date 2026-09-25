import type { AppIconName } from '@/components/ui/AppIcon';

export interface ChoiceOption<Value extends string> {
  readonly label: string;
  readonly value: Value;
}

export interface SearchFieldProps {
  readonly accessibilityLabel: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}

export interface ChoiceChipsProps<Value extends string> {
  readonly accessibilityLabel: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value;
}

export interface OptionMenuProps<Value extends string> {
  readonly active?: boolean;
  readonly accessibilityLabel: string;
  readonly compact?: boolean;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value;
}
