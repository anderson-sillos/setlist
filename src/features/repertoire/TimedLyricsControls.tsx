import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ProgressSlider } from '@/components/ui/ProgressSlider';
import type { ManualTimerStatus } from '@/features/stage/useManualTimer';
import { formatElapsedTime } from '@/features/stage/useManualTimer';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface TimedLyricsControlsProps {
  readonly durationMs: number | null;
  readonly elapsedMs: number;
  readonly onCancelScrub: () => void;
  readonly onCommitPosition: (positionMs: number) => void;
  readonly onPause: () => void;
  readonly onPreviewPositionChange: (positionMs: number | null) => void;
  readonly onResumeFollow: () => void;
  readonly onReset: () => void;
  readonly onSeekBy: (deltaMs: number) => void;
  readonly onStart: () => void;
  readonly previewPositionMs: number | null;
  readonly showResumeFollow: boolean;
  readonly status: ManualTimerStatus;
}

export function TimedLyricsControls({
  durationMs,
  elapsedMs,
  onCancelScrub,
  onCommitPosition,
  onPause,
  onPreviewPositionChange,
  onResumeFollow,
  onReset,
  onSeekBy,
  onStart,
  previewPositionMs,
  showResumeFollow,
  status,
}: TimedLyricsControlsProps) {
  const action =
    status === 'running'
      ? { icon: 'pause' as const, label: 'Pausar', onPress: onPause }
      : {
          icon: 'play' as const,
          label: status === 'paused' ? 'Retomar' : 'Iniciar',
          onPress: onStart,
        };

  return (
    <View style={styles.container} testID="timed-lyrics-controls">
      {durationMs !== null ? (
        <View style={styles.slider}>
          <ProgressSlider
            durationMs={durationMs}
            onCancel={onCancelScrub}
            onCommit={onCommitPosition}
            onPreviewChange={onPreviewPositionChange}
            previewPositionMs={previewPositionMs}
            valueMs={elapsedMs}
          />
        </View>
      ) : null}
      {durationMs === null ? (
        <View style={styles.timeRow}>
          <AppText
            accessibilityLabel={`Tempo decorrido ${formatElapsedTime(previewPositionMs ?? elapsedMs)}`}
            style={styles.time}
            testID="elapsed-time"
            variant="metadata"
          >
            {formatElapsedTime(previewPositionMs ?? elapsedMs)}
          </AppText>
        </View>
      ) : null}
      <View style={styles.row} testID="timed-controls-row">
        <View style={styles.sideControl} testID="timer-reset-container">
          <ControlButton
            hideLabel
            icon="restore"
            label="Reiniciar"
            onPress={onReset}
            shortLabel="Reiniciar"
            testID="timer-reset"
          />
        </View>
        <View style={styles.buttons} testID="timer-main-controls">
          <ControlButton
            compactLabel
            icon="rewind"
            label="Voltar 5 segundos"
            onPress={() => onSeekBy(-5_000)}
            shortLabel="−5 s"
            testID="seek-backward"
          />
          <ControlButton
            primary
            icon={action.icon}
            label={action.label}
            onPress={action.onPress}
            shortLabel={action.label}
            testID="timer-toggle"
          />
          <ControlButton
            compactLabel
            icon="fastForward"
            label="Avançar 5 segundos"
            onPress={() => onSeekBy(5_000)}
            shortLabel="+5 s"
            testID="seek-forward"
          />
        </View>
        <View style={styles.sideControl} testID="resume-follow-container">
          {showResumeFollow ? (
            <ControlButton
              hideLabel
              icon="center"
              label="Acompanhar"
              onPress={onResumeFollow}
              shortLabel="Acompanhar"
              testID="resume-lyric-follow"
            />
          ) : (
            <View importantForAccessibility="no-hide-descendants" />
          )}
        </View>
      </View>
    </View>
  );
}

interface ControlButtonProps {
  readonly alwaysShowLabel?: boolean;
  readonly compactLabel?: boolean;
  readonly hideLabel?: boolean;
  readonly primary?: boolean;
  readonly icon:
    'center' | 'fastForward' | 'pause' | 'play' | 'restore' | 'rewind';
  readonly label: string;
  readonly onPress: () => void;
  readonly shortLabel: string;
  readonly testID: string;
}

function ControlButton({
  alwaysShowLabel = false,
  compactLabel = false,
  hideLabel = false,
  primary = false,
  icon,
  label,
  onPress,
  shortLabel,
  testID,
}: ControlButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primaryButton,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <AppIcon
        color={colors.text.primary}
        name={icon}
        size={primary ? 34 : 18}
      />
      {!hideLabel && (alwaysShowLabel || shortLabel.length < 6) ? (
        <AppText
          numberOfLines={1}
          style={[
            styles.buttonLabel,
            compactLabel && styles.compactButtonLabel,
          ]}
          variant="footer"
        >
          {shortLabel}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  slider: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    paddingTop: 0,
    width: '100%',
  },
  timeRow: {
    paddingHorizontal: spacing.lg,
  },
  time: {
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
    minWidth: 52,
  },
  buttons: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  sideControl: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minHeight: layout.minimumTouchTarget,
    width: layout.minimumTouchTarget,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.background.controlSurface,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    minWidth: layout.minimumTouchTarget,
    paddingHorizontal: 0,
  },
  primaryButton: {
    borderColor: colors.border.control,
    borderRadius: radii.pill,
    height: 72,
    minHeight: 72,
    minWidth: 72,
    width: 72,
  },
  buttonLabel: {
    color: colors.text.primary,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  compactButtonLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  pressed: {
    backgroundColor: colors.background.pressed,
  },
});
