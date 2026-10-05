import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface AccountDeletionDialogProps {
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly visible: boolean;
}

const CONFIRMATION_TEXT = 'EXCLUIR';

export function AccountDeletionDialog({
  errorMessage,
  isSubmitting,
  onClose,
  onConfirm,
  visible,
}: AccountDeletionDialogProps) {
  const reducedMotion = useReducedMotionPreference();
  const [confirmation, setConfirmation] = useState('');

  if (!visible) {
    return null;
  }

  const canDelete = confirmation.trim().toUpperCase() === CONFIRMATION_TEXT;

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardAvoidingView}
        testID="account-deletion-keyboard-layout"
      >
        <View accessibilityViewIsModal style={styles.modalLayer}>
          <Pressable
            accessibilityLabel="Fechar exclusão da conta"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onClose}
            style={styles.scrim}
          />
          <View
            accessibilityLiveRegion="polite"
            style={styles.dialog}
            testID="account-deletion-dialog"
          >
            <View style={styles.header}>
              <AppText accessibilityRole="header" variant="heading">
                Excluir conta
              </AppText>
              <Pressable
                accessibilityLabel="Fechar exclusão da conta"
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={spacing.sm}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon color={colors.text.secondary} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
            >
              <AppText>
                Esta ação é permanente. Seu perfil e sua sessão serão removidos.
                O conteúdo das bandas continuará disponível para os demais
                integrantes.
              </AppText>
              <AppText tone="muted">
                Se você for o único integrante de uma banda, exclua essa banda
                antes de excluir a conta.
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText variant="caption">
                  Digite {CONFIRMATION_TEXT} para confirmar
                </AppText>
                <TextInput
                  accessibilityLabel="Confirmação da exclusão da conta"
                  autoCapitalize="characters"
                  autoFocus
                  onChangeText={setConfirmation}
                  placeholder={CONFIRMATION_TEXT}
                  placeholderTextColor={colors.text.muted}
                  style={styles.input}
                  value={confirmation}
                />
              </View>
              {errorMessage ? (
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <AppButton
                disabled={isSubmitting}
                label="Cancelar"
                onPress={onClose}
                variant="secondary"
              />
              <AppButton
                accessibilityLabel="Confirmar exclusão da conta"
                disabled={isSubmitting || !canDelete}
                icon="delete"
                label={isSubmitting ? 'Excluindo…' : 'Excluir definitivamente'}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    maxHeight: '90%',
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  errorText: {
    color: colors.semantic.danger,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  formScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  input: {
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  keyboardAvoidingView: {
    flex: 1,
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
