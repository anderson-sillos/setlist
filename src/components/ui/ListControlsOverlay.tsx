import type { ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, layout, spacing } from '@/theme/tokens';

interface ListControlsOverlayProps {
  readonly children: ReactNode;
  readonly horizontalPadding: number;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
}

export function ListControlsOverlay({
  children,
  horizontalPadding,
  onLayout,
}: ListControlsOverlayProps) {
  return (
    <View onLayout={onLayout} style={styles.overlay}>
      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.background.canvas,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  content: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.sm,
    width: '100%',
  },
});
