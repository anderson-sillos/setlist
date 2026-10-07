import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<
  Pick<ScrollViewProps, 'testID'> & {
    readonly contentStyle?: StyleProp<ViewStyle>;
  }
>;

export function Screen({ children, contentStyle, testID }: ScreenProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.base,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
});

function getHorizontalPadding(width: number) {
  if (width >= layout.desktopBreakpoint) return layout.desktopHorizontalMargin;
  if (width >= layout.tabletBreakpoint) return layout.tabletHorizontalMargin;
  return layout.phoneHorizontalMargin;
}
