import type { ReactElement } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

interface KeyboardDismissRegionProps {
  readonly children: ReactElement;
}

/** Dismisses the software keyboard when a non-input area is pressed. */
export function KeyboardDismissRegion({
  children,
}: KeyboardDismissRegionProps) {
  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
}
