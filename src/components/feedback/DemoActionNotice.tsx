import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface DemoActionNoticeProps {
  readonly message: string | null;
  readonly onClose: () => void;
}

export function DemoActionNotice({ message, onClose }: DemoActionNoticeProps) {
  if (!message) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar popup de demonstração"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessible
          style={styles.dialog}
          testID="demo-action-notice"
        >
          <AppText accessibilityRole="header" variant="heading">
            Demonstração
          </AppText>
          <AppText>{message}</AppText>
          <Pressable
            accessibilityLabel="Fechar aviso de demonstração"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="inverse">Fechar</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  modalLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  pressed: {
    opacity: 0.72,
  },
  scrim: {
    backgroundColor: 'rgba(11, 16, 32, 0.56)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
