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

interface ProfileDisplayNameDialogProps {
  readonly errorMessage: string | null;
  readonly initialName: string;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: string) => void;
  readonly visible: boolean;
}

export function ProfileDisplayNameDialog({
  errorMessage,
  initialName,
  isSubmitting,
  onClose,
  onSave,
  visible,
}: ProfileDisplayNameDialogProps) {
  const [draftName, setDraftName] = useState(initialName);

  if (!visible) {
    return null;
  }

  const normalizedName = draftName.trim();
  const normalizedLength = Array.from(normalizedName).length;
  const canSave = normalizedLength > 0 && normalizedLength <= 120;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardAvoidingView}
        testID="profile-display-name-keyboard-layout"
      >
        <View accessibilityViewIsModal style={styles.modalLayer}>
          <Pressable
            accessibilityLabel="Fechar edição do nome"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onClose}
            style={styles.scrim}
          />
          <View
            accessibilityLiveRegion="polite"
            style={styles.dialog}
            testID="profile-display-name-dialog"
          >
            <View style={styles.header}>
              <AppText accessibilityRole="header" variant="heading">
                Editar nome de exibição
              </AppText>
              <Pressable
                accessibilityLabel="Fechar edição do nome"
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={spacing.sm}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon color={colors.muted} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
            >
              <AppText tone="muted">
                Esse é o nome que aparece para você e para os integrantes das
                suas bandas.
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText variant="caption">Nome</AppText>
                <TextInput
                  accessibilityLabel="Nome de exibição"
                  autoCapitalize="words"
                  autoFocus
                  maxLength={240}
                  onChangeText={setDraftName}
                  placeholder="Como devemos chamar você?"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={styles.input}
                  value={draftName}
                />
                <AppText style={styles.characterCount} variant="caption">
                  {normalizedLength}/120
                </AppText>
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
                style={styles.actionButton}
                variant="secondary"
              />
              <AppButton
                accessibilityLabel="Salvar nome de exibição"
                disabled={!canSave || isSubmitting}
                icon="check"
                label={isSubmitting ? 'Salvando…' : 'Salvar'}
                onPress={() => onSave(normalizedName)}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 16, 32, 0.6)',
  },
  dialog: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: '85%',
    maxWidth: layout.contentMaxWidth,
    padding: spacing.lg,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  formScroll: {
    flexShrink: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: colors.muted,
  },
  errorText: {
    color: colors.violetDark,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  pressed: {
    opacity: 0.72,
  },
});
