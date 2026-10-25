import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/ui/AppText';
import { formatElapsedTime } from '@/features/stage/useManualTimer';
import {
  getLyricPositionFromTrackX,
  getLyricProgressRatio,
} from '@/features/repertoire/timedLyrics';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface ProgressSliderProps {
  readonly durationMs: number;
  readonly onCancel: () => void;
  readonly onCommit: (positionMs: number) => void;
  readonly onPreviewChange: (positionMs: number | null) => void;
  readonly previewPositionMs: number | null;
  readonly valueMs: number;
}

export type ProgressSliderKeyboardAction =
  'decrement' | 'end' | 'increment' | 'start';

export function getProgressSliderKeyboardAction(
  key: string,
): ProgressSliderKeyboardAction | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return 'decrement';
    case 'ArrowRight':
    case 'ArrowUp':
      return 'increment';
    case 'Home':
      return 'start';
    case 'End':
      return 'end';
    default:
      return null;
  }
}

/** Accessible shared progress control for a bounded media timeline. */
export function ProgressSlider({
  durationMs,
  onCancel,
  onCommit,
  onPreviewChange,
  previewPositionMs,
  valueMs,
}: ProgressSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [localPreviewMs, setLocalPreviewMs] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const sliderRef = useRef<ComponentRef<typeof Pressable>>(null);
  const draggingRef = useRef(false);
  const ignoreNextPressRef = useRef(false);
  const displayValueMs = Number.isFinite(valueMs)
    ? Math.min(Math.max(0, valueMs), durationMs)
    : 0;
  const suppliedPreviewMs =
    previewPositionMs !== null && Number.isFinite(previewPositionMs)
      ? Math.min(Math.max(0, previewPositionMs), durationMs)
      : null;
  const displayPositionMs =
    localPreviewMs ?? suppliedPreviewMs ?? displayValueMs;
  const progressRatio =
    getLyricProgressRatio(displayPositionMs, durationMs) ?? 0;

  const getPositionAtX = useCallback(
    (x: number) =>
      getLyricPositionFromTrackX(x - spacing.xs, trackWidth, durationMs) ?? 0,
    [durationMs, trackWidth],
  );

  const commitPosition = useCallback(
    (positionMs: number) => {
      const boundedPosition = Math.min(durationMs, Math.max(0, positionMs));
      setLocalPreviewMs(null);
      onPreviewChange(null);
      onCommit(boundedPosition);
    },
    [durationMs, onCommit, onPreviewChange],
  );

  const cancelScrub = useCallback(() => {
    setLocalPreviewMs(null);
    onPreviewChange(null);
    onCancel();
  }, [onCancel, onPreviewChange]);

  const panGesture = useMemo(() => {
    let gesture = Gesture.Pan()
      .activeOffsetX([-3, 3])
      .failOffsetY([-12, 12])
      .shouldCancelWhenOutside(false)
      .runOnJS(true);

    gesture = gesture
      // These callbacks are retained by Gesture Handler and run on user input,
      // outside this render; refs hold only the active gesture's transient state.
      // eslint-disable-next-line react-hooks/refs
      .onStart((event) => {
        draggingRef.current = true;
        ignoreNextPressRef.current = true;
        const positionMs = getPositionAtX(event.x);
        setLocalPreviewMs(positionMs);
        onPreviewChange(positionMs);
      })
      .onUpdate((event) => {
        const positionMs = getPositionAtX(event.x);
        setLocalPreviewMs(positionMs);
        onPreviewChange(positionMs);
      })
      // eslint-disable-next-line react-hooks/refs
      .onEnd((event, success) => {
        if (draggingRef.current) {
          if (success) {
            commitPosition(getPositionAtX(event.x));
          } else {
            cancelScrub();
          }
        }
        draggingRef.current = false;
      })
      // eslint-disable-next-line react-hooks/refs
      .onFinalize((_event, success) => {
        if (draggingRef.current && !success) {
          draggingRef.current = false;
          cancelScrub();
        }
      })
      .withTestId('progress-slider-gesture');

    return gesture;
  }, [cancelScrub, commitPosition, getPositionAtX, onPreviewChange]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(0, event.nativeEvent.layout.width - spacing.xs * 2));
  };

  const handleAccessibilityAction = useCallback(
    (actionName: string) => {
      if (actionName === 'increment') {
        commitPosition(displayPositionMs + 5_000);
      } else if (actionName === 'decrement') {
        commitPosition(displayPositionMs - 5_000);
      }
    },
    [commitPosition, displayPositionMs],
  );

  const handleKeyboardKey = useCallback(
    (key: string, preventDefault: () => void) => {
      const action = getProgressSliderKeyboardAction(key);

      if (action === 'decrement') {
        handleAccessibilityAction('decrement');
      } else if (action === 'increment') {
        handleAccessibilityAction('increment');
      } else if (action === 'start') {
        commitPosition(0);
      } else if (action === 'end') {
        commitPosition(durationMs);
      } else {
        return;
      }

      preventDefault();
    },
    [commitPosition, durationMs, handleAccessibilityAction],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const element = sliderRef.current as unknown as HTMLElement | null;
    if (!element) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) =>
      handleKeyboardKey(event.key, () => event.preventDefault());
    element.addEventListener('keydown', onKeyDown);

    return () => element.removeEventListener('keydown', onKeyDown);
  }, [handleKeyboardKey]);

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="progress-slider">
      <View style={styles.timelineRow}>
        <AppText
          accessibilityLabel={`Tempo atual ${formatElapsedTime(displayPositionMs)}`}
          style={styles.timeLabel}
          testID="progress-current-time"
          variant="footer"
        >
          {formatElapsedTime(displayPositionMs)}
        </AppText>
        <GestureDetector gesture={panGesture}>
          <View style={styles.gestureArea}>
            <Pressable
              accessibilityActions={[
                { name: 'decrement', label: 'Voltar 5 segundos' },
                { name: 'increment', label: 'Avançar 5 segundos' },
              ]}
              accessibilityHint="Use as setas ou arraste para escolher o tempo."
              accessibilityLabel="Posição na música"
              accessibilityRole="adjustable"
              accessibilityValue={{
                min: 0,
                max: durationMs,
                now: displayPositionMs,
                text: formatElapsedTime(displayPositionMs),
              }}
              onAccessibilityAction={(event) =>
                handleAccessibilityAction(event.nativeEvent.actionName)
              }
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onLayout={handleLayout}
              onPress={(event) => {
                if (ignoreNextPressRef.current) {
                  ignoreNextPressRef.current = false;
                  return;
                }

                const locationX =
                  Platform.OS === 'web'
                    ? getWebPressLocationX(
                        event.nativeEvent as typeof event.nativeEvent & {
                          clientX?: number;
                        },
                        sliderRef.current as unknown as HTMLElement | null,
                      )
                    : event.nativeEvent.locationX;
                if (locationX !== null && Number.isFinite(locationX)) {
                  commitPosition(getPositionAtX(locationX));
                }
              }}
              ref={sliderRef}
              style={styles.hitArea}
              testID="progress-slider-hit-area"
            >
              <View style={styles.trackArea}>
                <View style={styles.track} />
                <View
                  style={[
                    styles.progress,
                    { width: `${progressRatio * 100}%` },
                  ]}
                  testID="progress-fill"
                />
                <View
                  style={[
                    styles.thumb,
                    focused && styles.focusedThumb,
                    { left: `${progressRatio * 100}%` },
                  ]}
                  testID="progress-thumb"
                />
                {localPreviewMs !== null || suppliedPreviewMs !== null ? (
                  <View
                    style={[
                      styles.previewBubble,
                      { left: `${progressRatio * 100}%` },
                    ]}
                    testID="progress-preview-bubble"
                  >
                    <AppText style={styles.previewText} variant="footer">
                      {formatElapsedTime(displayPositionMs)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>
        </GestureDetector>
        <AppText
          accessibilityLabel={`Duração total ${formatElapsedTime(durationMs)}`}
          style={styles.timeLabel}
          testID="progress-total-time"
          variant="footer"
        >
          {formatElapsedTime(durationMs)}
        </AppText>
      </View>
    </View>
  );
}

function getWebPressLocationX(
  event: { readonly clientX?: number },
  element: HTMLElement | null,
): number | null {
  if (
    !element ||
    typeof event.clientX !== 'number' ||
    !Number.isFinite(event.clientX)
  ) {
    return null;
  }

  return event.clientX - element.getBoundingClientRect().left;
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    minWidth: 0,
  },
  timelineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gestureArea: {
    flex: 1,
    minHeight: layout.minimumTouchTarget,
    minWidth: 0,
  },
  hitArea: {
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    width: '100%',
  },
  trackArea: {
    height: 28,
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'relative',
    width: '100%',
  },
  track: {
    backgroundColor: colors.border.control,
    borderRadius: radii.pill,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  progress: {
    backgroundColor: colors.action.primary,
    borderRadius: radii.pill,
    height: 4,
    left: 0,
    position: 'absolute',
  },
  thumb: {
    backgroundColor: colors.text.primary,
    borderColor: colors.action.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 16,
    marginLeft: -8,
    position: 'absolute',
    width: 16,
  },
  focusedThumb: {
    borderColor: colors.border.focus,
    borderWidth: 3,
    height: 20,
    marginLeft: -10,
    width: 20,
  },
  previewBubble: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    bottom: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    transform: [{ translateX: -20 }],
  },
  previewText: {
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontVariant: ['tabular-nums'],
    minWidth: 44,
  },
});
