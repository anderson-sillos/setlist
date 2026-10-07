import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, motion, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface MenuButtonProps {
  readonly active?: boolean;
  readonly accessibilityLabel: string;
  readonly accessibilityValueText?: string;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
}

interface OptionSheetProps {
  readonly children: ReactNode;
  readonly closeAccessibilityLabel: string;
  readonly testID?: string;
  readonly label: string;
  readonly onClose: () => void;
  readonly onDismiss?: () => void;
  readonly sheetStyle?: StyleProp<ViewStyle>;
  readonly showCloseButton?: boolean;
  readonly visible: boolean;
}

export function MenuButton({
  active = false,
  accessibilityLabel,
  accessibilityValueText,
  icon,
  label,
  onPress,
}: MenuButtonProps) {
  const reducedMotion = useReducedMotionPreference();
  const pressProgress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      [colors.background.raised, colors.background.pressed],
    ),
  }));
  const handlePress = () => {
    blurWebFocus();
    onPress();
  };

  return (
    <AnimatedMenuButton
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : undefined}
      accessibilityValue={
        accessibilityValueText ? { text: accessibilityValueText } : undefined
      }
      onPress={handlePress}
      onPressIn={() => {
        pressProgress.set(
          withTiming(1, {
            duration: reducedMotion ? 0 : motion.short,
          }),
        );
      }}
      onPressOut={() => {
        pressProgress.set(
          withTiming(0, {
            duration: reducedMotion ? 0 : motion.short,
          }),
        );
      }}
      style={[styles.menuButton, animatedStyle]}
    >
      {icon ? (
        <AppIcon
          color={active ? colors.action.primary : colors.text.secondary}
          name={icon}
          size={16}
        />
      ) : null}
      <AppText
        numberOfLines={1}
        style={styles.menuButtonLabel}
        tone={active ? 'accent' : 'muted'}
        variant="caption"
      >
        {label}
      </AppText>
      {active ? (
        <View style={styles.activeIndicator}>
          <AppIcon
            color={colors.action.primary}
            name="check"
            size={7}
            strokeWidth={2.25}
          />
        </View>
      ) : null}
      <AppIcon color={colors.text.secondary} name="chevronDown" size={16} />
    </AnimatedMenuButton>
  );
}

export function OptionSheet({
  children,
  closeAccessibilityLabel,
  label,
  onClose,
  onDismiss,
  sheetStyle,
  showCloseButton = true,
  testID,
  visible,
}: OptionSheetProps) {
  const reducedMotion = useReducedMotionPreference();
  const handleClose = () => {
    blurWebFocus();
    onClose();
  };

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={handleClose}
      onDismiss={onDismiss}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel={
            showCloseButton
              ? `${closeAccessibilityLabel} tocando fora`
              : closeAccessibilityLabel
          }
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.modalScrim}
        />
        <View style={[styles.sheet, sheetStyle]} testID={testID}>
          {showCloseButton ? (
            <View style={styles.header}>
              <AppText
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.headerLabel}
                variant="heading"
              >
                {label}
              </AppText>
              <Pressable
                accessibilityLabel={closeAccessibilityLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon color={colors.text.primary} name="close" size={20} />
              </Pressable>
            </View>
          ) : (
            <AppText accessibilityRole="header" variant="heading">
              {label}
            </AppText>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerLabel: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  menuButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  menuButtonLabel: {
    flexShrink: 1,
  },
  activeIndicator: {
    alignItems: 'center',
    backgroundColor: colors.background.selected,
    borderRadius: radii.pill,
    height: 10,
    justifyContent: 'center',
    width: 10,
  },
  modalLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalScrim: {
    backgroundColor: colors.background.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});

const AnimatedMenuButton = Animated.createAnimatedComponent(Pressable);
