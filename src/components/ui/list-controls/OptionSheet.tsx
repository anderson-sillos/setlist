import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface MenuButtonProps {
  readonly accessibilityLabel: string;
  readonly accessibilityValueText?: string;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
}

interface OptionSheetProps {
  readonly children: ReactNode;
  readonly closeAccessibilityLabel: string;
  readonly label: string;
  readonly onClose: () => void;
  readonly visible: boolean;
}

export function MenuButton({
  accessibilityLabel,
  accessibilityValueText,
  icon,
  label,
  onPress,
}: MenuButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityValue={
        accessibilityValueText ? { text: accessibilityValueText } : undefined
      }
      onPress={onPress}
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
      <AppIcon color={colors.violet} name="chevronDown" size={16} />
    </Pressable>
  );
}

export function OptionSheet({
  children,
  closeAccessibilityLabel,
  label,
  onClose,
  visible,
}: OptionSheetProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel={closeAccessibilityLabel}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalScrim}
        />
        <View style={styles.sheet}>
          <AppText accessibilityRole="header" variant="heading">
            {label}
          </AppText>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.md,
  },
  menuButtonLabel: {
    flexShrink: 1,
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
