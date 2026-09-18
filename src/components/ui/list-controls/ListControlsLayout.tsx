import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

export function ListControls({ children }: { readonly children: ReactNode }) {
  return <View style={styles.controls}>{children}</View>;
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.sm,
  },
});
