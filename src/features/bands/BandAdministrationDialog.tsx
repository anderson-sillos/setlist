import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  UnsavedChangesPrompt,
  type UnsavedChangesPromptProps,
} from '@/components/feedback/UnsavedChangesPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { KeyboardDismissRegion } from '@/components/ui/KeyboardDismissRegion';
import type { Band } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export type BandAdministrationMode = 'delete' | 'rename';

interface BandAdministrationDialogProps {
  readonly band: Pick<Band, 'id' | 'name'> | null;
  readonly discardPrompt?: UnsavedChangesPromptProps;
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly mode: BandAdministrationMode | null;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onRename: (name: string) => void;
  readonly onModeChange: (mode: BandAdministrationMode) => void;
}

export function BandAdministrationDialog({
  band,
  discardPrompt,
  errorMessage,
  isSubmitting,
  mode,
  onClose,
  onModeChange,
  onDelete,
  onDirtyChange,
  onRename,
}: BandAdministrationDialogProps) {
  const reducedMotion = useReducedMotionPreference();
  const [name, setName] = useState(band?.name ?? '');
  const [confirmationName, setConfirmationName] = useState('');
  const hasChanges = mode === 'rename' && !!band && name !== band.name;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  if (!band || !mode) {
    return null;
  }

  const canDelete = confirmationName.trim() === band.name;
  const title = mode === 'rename' ? 'Editar nome da banda' : 'Excluir banda';

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      testID="band-administration-modal"
      transparent
      visible
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.modalLayer}
        testID="band-administration-keyboard-layout"
      >
        <Pressable
          accessibilityLabel="Fechar edição da banda"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => {
            if (Keyboard.isVisible()) Keyboard.dismiss();
            else onClose();
          }}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="band-administration-dialog"
        >
          <KeyboardDismissRegion>
            <View style={styles.header}>
              <AppText accessibilityRole="header" variant="heading">
                {title}
              </AppText>
              <Pressable
                accessibilityLabel="Fechar edição da banda"
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
          </KeyboardDismissRegion>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            keyboardShouldPersistTaps="handled"
            style={styles.formScroll}
            testID="band-administration-form-scroll"
          >
            {mode === 'rename' ? (
              <>
                <KeyboardDismissRegion>
                  <View>
                    <AppText tone="muted">
                      O novo nome será exibido para todos os integrantes.
                    </AppText>
                  </View>
                </KeyboardDismissRegion>
                <View style={styles.fieldGroup}>
                  <KeyboardDismissRegion>
                    <View>
                      <AppText variant="caption">Nome da banda</AppText>
                    </View>
                  </KeyboardDismissRegion>
                  <TextInput
                    accessibilityLabel="Novo nome da banda"
                    autoCapitalize="words"
                    autoFocus
                    maxLength={120}
                    onChangeText={setName}
                    placeholder="Nome da banda"
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    value={name}
                  />
                </View>
                <View style={styles.deleteAction}>
                  <AppButton
                    accessibilityLabel="Excluir banda"
                    disabled={isSubmitting}
                    icon="delete"
                    label="Excluir banda"
                    onPress={() => {
                      Keyboard.dismiss();
                      setConfirmationName('');
                      onModeChange('delete');
                    }}
                    variant="secondary"
                  />
                </View>
              </>
            ) : (
              <>
                <KeyboardDismissRegion>
                  <View style={styles.confirmationCopy}>
                    <AppText>
                      Esta ação é permanente e remove repertório, shows e
                      integrantes da banda. Para confirmar, digite exatamente:
                    </AppText>
                    <AppText variant="heading">{band.name}</AppText>
                  </View>
                </KeyboardDismissRegion>
                <View style={styles.fieldGroup}>
                  <KeyboardDismissRegion>
                    <View>
                      <AppText variant="caption">Confirmação</AppText>
                    </View>
                  </KeyboardDismissRegion>
                  <TextInput
                    accessibilityLabel="Confirmação do nome da banda"
                    autoCapitalize="none"
                    autoFocus
                    onChangeText={setConfirmationName}
                    placeholder={band.name}
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    value={confirmationName}
                  />
                </View>
              </>
            )}
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </ScrollView>

          <KeyboardDismissRegion>
            <View style={styles.actions}>
              <AppButton
                disabled={isSubmitting}
                label={mode === 'rename' ? 'Cancelar' : 'Voltar'}
                onPress={
                  mode === 'rename' ? onClose : () => onModeChange('rename')
                }
                variant="secondary"
              />
              {mode === 'rename' ? (
                <AppButton
                  accessibilityLabel="Confirmar novo nome da banda"
                  disabled={isSubmitting || name.trim().length === 0}
                  icon="check"
                  label={isSubmitting ? 'Salvando…' : 'Salvar nome'}
                  onPress={() => onRename(name)}
                />
              ) : (
                <AppButton
                  accessibilityLabel="Confirmar exclusão da banda"
                  disabled={isSubmitting || !canDelete}
                  icon="delete"
                  label={
                    isSubmitting ? 'Excluindo…' : 'Excluir definitivamente'
                  }
                  onPress={onDelete}
                  variant="destructive"
                />
              )}
            </View>
          </KeyboardDismissRegion>
        </View>
      </KeyboardAvoidingView>
      {discardPrompt ? <UnsavedChangesPrompt {...discardPrompt} /> : null}
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
  confirmationCopy: {
    gap: spacing.md,
  },
  deleteAction: {
    alignSelf: 'flex-start',
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
  formContent: {
    gap: spacing.lg,
    padding: spacing.xl,
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
