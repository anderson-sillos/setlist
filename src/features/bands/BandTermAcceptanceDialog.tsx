import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors, fontSizes, layout, radii, spacing } from '@/theme/tokens';
import { CURRENT_BAND_TERM } from './legalTerm';

interface BandTermAcceptanceDialogProps {
  readonly errorMessage: string | null;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly visible: boolean;
}

export function BandTermAcceptanceDialog({
  errorMessage,
  onClose,
  onSubmit,
  submitting,
  visible,
}: BandTermAcceptanceDialogProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalLayer}
      >
        <Pressable
          accessibilityLabel="Cancelar aceite do termo tocando fora"
          accessibilityRole="button"
          disabled={submitting}
          onPress={onClose}
          style={styles.scrim}
        />
        <View accessibilityLiveRegion="polite" style={styles.dialog}>
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              Antes de editar
            </AppText>
            <Pressable
              accessibilityLabel="Cancelar aceite do termo"
              accessibilityRole="button"
              disabled={submitting}
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
          >
            <AppText>
              Para criar ou alterar músicas, confirme que você conhece as
              responsabilidades sobre o conteúdo da banda.
            </AppText>
            <Card style={styles.termCard} tone="accent">
              <AppText style={styles.termTitle} variant="heading">
                {CURRENT_BAND_TERM.title}
              </AppText>
              <ScrollView
                contentContainerStyle={styles.termScrollContent}
                nestedScrollEnabled
                style={styles.termScroll}
              >
                <AppText variant="caption">{CURRENT_BAND_TERM.body}</AppText>
              </ScrollView>
              <AppText tone="muted" variant="caption">
                Versão {CURRENT_BAND_TERM.version}
              </AppText>
            </Card>
            <Pressable
              accessibilityLabel="Aceitar termo de responsabilidade para editar"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
              disabled={submitting}
              onPress={() => setAccepted((current) => !current)}
              style={({ pressed }) => [
                styles.acceptanceRow,
                pressed && styles.pressed,
              ]}
              testID="song-editor-term-acceptance"
            >
              <View
                style={[styles.checkbox, accepted && styles.checkboxChecked]}
              >
                {accepted ? (
                  <AppIcon color={colors.surface} name="check" size={16} />
                ) : null}
              </View>
              <AppText style={styles.acceptanceText}>
                Li e aceito o termo de responsabilidade pelo conteúdo da banda.
              </AppText>
            </Pressable>
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <AppButton
              disabled={submitting}
              label="Cancelar"
              onPress={onClose}
              variant="secondary"
            />
            <AppButton
              disabled={!accepted || submitting}
              icon="check"
              label={submitting ? 'Registrando…' : 'Aceitar e editar'}
              onPress={onSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  acceptanceRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minimumTouchTarget,
    paddingVertical: spacing.xs,
  },
  acceptanceText: {
    flex: 1,
  },
  actions: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.violet,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.violet,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxHeight: '90%',
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  errorText: {
    color: '#b91c1c',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
  termCard: {
    gap: spacing.sm,
    maxHeight: 230,
  },
  termScroll: {
    maxHeight: 132,
  },
  termScrollContent: {
    paddingBottom: spacing.xs,
  },
  termTitle: {
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
});
