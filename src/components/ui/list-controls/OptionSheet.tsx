import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

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
  const handlePress = () => {
    blurWebFocus();
    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : undefined}
      accessibilityValue={
        accessibilityValueText ? { text: accessibilityValueText } : undefined
      }
      onPress={handlePress}
      style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
    >
      {icon ? <AppIcon color={colors.violet} name={icon} size={16} /> : null}
      <AppText
        numberOfLines={1}
        style={styles.menuButtonLabel}
        tone="accent"
        variant="caption"
      >
        {label}
      </AppText>
      {active ? (
        <View style={styles.activeIndicator}>
          <AppIcon
            color={colors.violet}
            name="check"
            size={7}
            strokeWidth={2.25}
          />
        </View>
      ) : null}
      <AppIcon color={colors.violet} name="chevronDown" size={16} />
    </Pressable>
  );
}

export function OptionSheet({
  children,
  closeAccessibilityLabel,
  label,
  onClose,
  showCloseButton = true,
  testID,
  visible,
}: OptionSheetProps) {
  const handleClose = () => {
    blurWebFocus();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
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
        <View style={styles.sheet} testID={testID}>
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
                <AppIcon color={colors.muted} name="close" size={20} />
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
    backgroundColor: colors.surface,
    borderColor: colors.line,
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
    backgroundColor: colors.violetSoft,
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
    backgroundColor: 'rgba(11, 16, 32, 0.56)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});
