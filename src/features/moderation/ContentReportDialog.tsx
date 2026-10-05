import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import {
  sendContentReport,
  type ContentReportKind,
} from '@/data/supabase/contentReports';
import type { EntityId } from '@/domain';
import { colors, radii, spacing } from '@/theme/tokens';
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

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async () => {
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
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar denúncia"
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.scrim}
        />
        <View style={styles.dialog} testID="content-report-dialog">
          <AppText accessibilityRole="header" variant="heading">
            {kind === 'song' ? 'Denunciar música' : 'Denunciar integrante'}
          </AppText>
          {sent ? (
            <>
              <AppText accessibilityRole="alert">
                Denúncia encaminhada para análise. Obrigado por avisar.
              </AppText>
              <AppButton label="Fechar" onPress={handleClose} />
            </>
          ) : (
            <>
              <AppText tone="muted">{targetName}</AppText>
              <AppText>
                Descreva o motivo da denúncia. Não inclua cópias completas da
                letra nem dados íntimos desnecessários.
              </AppText>
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
              <View style={styles.actions}>
                <AppButton
                  disabled={isSubmitting}
                  label="Cancelar"
                  onPress={handleClose}
                  variant="secondary"
                />
                <AppButton
                  disabled={isSubmitting || description.trim().length < 10}
                  label={isSubmitting ? 'Enviando…' : 'Enviar denúncia'}
                  onPress={() => void handleSubmit()}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    gap: spacing.lg,
    maxWidth: 520,
    padding: spacing.xl,
    width: '100%',
  },
  errorText: { color: colors.semantic.danger },
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
