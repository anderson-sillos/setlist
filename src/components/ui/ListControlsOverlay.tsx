import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { colors, layout, motion, spacing } from '@/theme/tokens';

interface ListControlsOverlayProps {
  readonly children: ReactNode;
  readonly controlsVisible: boolean;
  readonly horizontalPadding: number;
  readonly onExpandedHeightChange: (height: number) => void;
  readonly search: ReactNode;
}

export function ListControlsOverlay({
  children,
  controlsVisible,
  horizontalPadding,
  onExpandedHeightChange,
  search,
}: ListControlsOverlayProps) {
  const [searchHeight, setSearchHeight] = useState(0);
  const [controlsHeight, setControlsHeight] = useState(0);
  const reducedMotion = useReducedMotionPreference();
  const progress = useSharedValue(controlsVisible ? 1 : 0);
  const collapseStyle = useAnimatedStyle(() => ({
    height: controlsHeight * progress.value,
  }));
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (progress.value - 1) * spacing.sm }],
  }));

  useEffect(() => {
    const target = controlsVisible ? 1 : 0;
    progress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: controlsVisible ? motion.layerOpen : motion.layerClose,
          }),
    );
  }, [controlsVisible, progress, reducedMotion]);

  useEffect(() => {
    if (searchHeight > 0 && controlsHeight > 0) {
      // Reserve the expanded height once; hiding controls must not move the list.
      onExpandedHeightChange(searchHeight + controlsHeight + 1);
    }
  }, [controlsHeight, onExpandedHeightChange, searchHeight]);

  const measureSearch = (event: LayoutChangeEvent) =>
    setSearchHeight(event.nativeEvent.layout.height);
  const measureControls = (event: LayoutChangeEvent) =>
    setControlsHeight(event.nativeEvent.layout.height);

  return (
    <View style={styles.overlay}>
      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        <View
          onLayout={measureSearch}
          style={styles.search}
          testID="list-controls-search"
        >
          {search}
        </View>
        <Animated.View
          accessibilityElementsHidden={!controlsVisible}
          aria-hidden={!controlsVisible}
          importantForAccessibility={
            controlsVisible ? 'auto' : 'no-hide-descendants'
          }
          style={[
            styles.collapse,
            collapseStyle,
            { pointerEvents: controlsVisible ? 'auto' : 'none' },
          ]}
          testID="list-controls-collapse"
        >
          <Animated.View
            onLayout={measureControls}
            style={[styles.controls, controlsStyle]}
            testID="list-controls-toolbar"
          >
            {children}
          </Animated.View>
        </Animated.View>
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
    width: '100%',
  },
  search: {
    paddingVertical: spacing.sm,
  },
  collapse: {
    overflow: 'hidden',
  },
  controls: {
    gap: spacing.sm,
    left: 0,
    paddingBottom: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
