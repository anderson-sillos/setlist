import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface DemoActionNoticeProps {
  readonly message: string | null;
  readonly onClose: () => void;
  readonly testID?: string;
  readonly title?: string;
}

export function DemoActionNotice({
  message,
  onClose,
  testID = 'demo-action-notice',
  title = 'Demonstração',
}: DemoActionNoticeProps) {
  const reducedMotion = useReducedMotionPreference();
  if (!message) return null;

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      transparent
      visible
    >
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel={`Fechar popup de ${title.toLocaleLowerCase('pt-BR')}`}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessible
          style={styles.dialog}
          testID={testID}
        >
          <AppText accessibilityRole="header" variant="heading">
            {title}
          </AppText>
          <AppText>{message}</AppText>
          <Pressable
            accessibilityLabel={`Fechar aviso de ${title.toLocaleLowerCase('pt-BR')}`}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="onAccent">Fechar</AppText>
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
    backgroundColor: colors.action.primary,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    borderWidth: 1,
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
    backgroundColor: colors.background.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
