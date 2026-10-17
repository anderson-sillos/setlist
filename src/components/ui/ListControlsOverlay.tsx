import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { colors, layout, motion, spacing } from '@/theme/tokens';
import {
  getListControlsToolbarHeight,
  listControlDimensions,
  listControlsSearchHeight,
} from '@/components/ui/list-controls/dimensions';

interface ListControlsOverlayProps {
  readonly children: ReactNode;
  readonly controlsVisible: boolean;
  readonly horizontalPadding: number;
  readonly additionalControlRows?: number;
  readonly onExpandedHeightChange: (height: number) => void;
  readonly search: ReactNode;
}

export function ListControlsOverlay({
  children,
  controlsVisible,
  horizontalPadding,
  additionalControlRows = 0,
  onExpandedHeightChange,
  search,
}: ListControlsOverlayProps) {
  const [searchHeight, setSearchHeight] = useState(listControlsSearchHeight);
  const [controlsHeight, setControlsHeight] = useState(() =>
    getListControlsToolbarHeight(additionalControlRows),
  );
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

  useLayoutEffect(() => {
    if (searchHeight > 0 && controlsHeight > 0) {
      // Reserve the expanded height once; hiding controls must not move the list.
      onExpandedHeightChange(
        searchHeight + controlsHeight + listControlDimensions.borderWidth,
      );
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
    borderBottomWidth: listControlDimensions.borderWidth,
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
    paddingVertical: listControlDimensions.searchPadding,
  },
  collapse: {
    overflow: 'hidden',
  },
  controls: {
    gap: listControlDimensions.toolbarGap,
    left: 0,
    paddingBottom: listControlDimensions.toolbarPaddingBottom,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
