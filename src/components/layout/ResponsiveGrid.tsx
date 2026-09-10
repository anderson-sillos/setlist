import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { getCatalogColumnCount, getLayoutMode } from '@/theme/responsive';
import { layout, spacing } from '@/theme/tokens';

interface ResponsiveGridProps<Item> {
  readonly items: readonly Item[];
  readonly keyExtractor: (item: Item) => string;
  readonly renderItem: (item: Item, itemWidth: number) => ReactNode;
  readonly viewportWidth?: number;
}

export function ResponsiveGrid<Item>({
  items,
  keyExtractor,
  renderItem,
  viewportWidth,
}: ResponsiveGridProps<Item>) {
  const window = useWindowDimensions();
  const width = viewportWidth ?? window.width;
  const layoutMode = getLayoutMode(width);
  const columns = getCatalogColumnCount(layoutMode);
  const usableWidth = Math.min(
    Math.max(width - spacing.xl * 2, 0),
    layout.contentMaxWidth - spacing.xl * 2,
  );
  const itemWidth =
    (usableWidth - spacing.lg * (columns - 1)) / Math.max(columns, 1);

  return (
    <View style={styles.grid} testID={`responsive-grid-${layoutMode}`}>
      {items.map((item) => (
        <View key={keyExtractor(item)} style={{ width: itemWidth }}>
          {renderItem(item, itemWidth)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
});
