import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import {
  sendContentReport,
  type ContentReportKind,
} from '@/data/supabase/contentReports';
import type { EntityId } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface ContentReportDialogProps {
  readonly bandId: EntityId;
  readonly kind: ContentReportKind;
  readonly onClose: () => void;
  readonly targetId: EntityId;
  readonly targetName: string;
  readonly visible: boolean;
}

export function ContentReportDialog({
  visible,
  ...props
}: ContentReportDialogProps) {
  if (!visible) return null;
  return <VisibleContentReportDialog key={props.targetId} {...props} />;
}

function VisibleContentReportDialog({
  bandId,
  kind,
  onClose,
  targetId,
  targetName,
}: Omit<ContentReportDialogProps, 'visible'>) {
  const reducedMotion = useReducedMotionPreference();
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [discardPromptVisible, setDiscardPromptVisible] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    if (description.trim().length > 0 && !sent) {
      setDiscardPromptVisible(true);
      return;
    }

    onClose();
  };

  const handleBackdropPress = () => {
    if (Platform.OS !== 'web' && Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    handleClose();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendContentReport({ bandId, description, kind, targetId });
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível confirmar o envio da denúncia. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={handleClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
        style={styles.keyboardLayout}
      >
        <SafeAreaView
          accessibilityViewIsModal
          edges={{
            top: 'maximum',
            bottom: 'maximum',
            left: 'maximum',
            right: 'maximum',
          }}
          style={styles.modalLayer}
        >
          <Pressable
            accessibilityLabel="Fechar janela de denúncia tocando fora"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleBackdropPress}
            style={styles.scrim}
          />
          <View style={styles.dialog} testID="content-report-dialog">
            <TouchableWithoutFeedback
              accessible={false}
              onPress={Keyboard.dismiss}
            >
              <View style={styles.header}>
                <AppText
                  accessibilityRole="header"
                  style={styles.title}
                  variant="heading"
                >
                  {kind === 'song'
                    ? 'Denunciar música'
                    : 'Denunciar integrante'}
                </AppText>
                <Pressable
                  accessibilityLabel="Fechar janela de denúncia"
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  hitSlop={spacing.sm}
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon
                    color={colors.text.secondary}
                    name="close"
                    size={20}
                  />
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
            >
              {sent ? (
                <AppText accessibilityRole="alert">
                  Denúncia encaminhada para análise. Obrigado por avisar.
                </AppText>
              ) : (
                <>
                  <TouchableWithoutFeedback
                    accessible={false}
                    onPress={Keyboard.dismiss}
                  >
                    <View style={styles.formInstructions}>
                      <AppText tone="muted">{targetName}</AppText>
                      <AppText>
                        Descreva o motivo da denúncia. Não inclua cópias
                        completas da letra nem dados íntimos desnecessários.
                      </AppText>
                    </View>
                  </TouchableWithoutFeedback>
                  <TextInput
                    accessibilityLabel="Motivo da denúncia"
                    maxLength={2000}
                    multiline
                    onChangeText={setDescription}
                    placeholder="Explique o que ocorreu"
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    textAlignVertical="top"
                    value={description}
                  />
                  {error ? (
                    <AppText accessibilityRole="alert" style={styles.errorText}>
                      {error}
                    </AppText>
                  ) : null}
                </>
              )}
            </ScrollView>
            <TouchableWithoutFeedback
              accessible={false}
              onPress={Keyboard.dismiss}
            >
              <View style={styles.actions}>
                {sent ? (
                  <AppButton label="Fechar" onPress={handleClose} />
                ) : (
                  <>
                    <AppButton
                      disabled={isSubmitting}
                      label="Cancelar"
                      onPress={handleClose}
                      style={styles.actionButton}
                      variant="secondary"
                    />
                    <AppButton
                      disabled={isSubmitting || description.trim().length < 10}
                      label={isSubmitting ? 'Enviando…' : 'Enviar denúncia'}
                      onPress={() => void handleSubmit()}
                      style={styles.actionButton}
                    />
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <UnsavedChangesPrompt
        onContinue={() => setDiscardPromptVisible(false)}
        onDiscard={() => {
          setDiscardPromptVisible(false);
          onClose();
        }}
        visible={discardPromptVisible}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  actionButton: { paddingHorizontal: spacing.sm },
  dialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    maxHeight: '100%',
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  errorText: { color: colors.semantic.danger },
  formContent: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  formInstructions: { gap: spacing.lg },
  formScroll: { flexGrow: 0, flexShrink: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  input: {
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text.primary,
    minHeight: 120,
    padding: spacing.md,
  },
  modalLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  keyboardLayout: { flex: 1 },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  pressed: { opacity: 0.7 },
  scrim: {
    backgroundColor: colors.background.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: { flex: 1 },
});
