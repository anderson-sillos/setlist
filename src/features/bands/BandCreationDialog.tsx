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
import { Card } from '@/components/ui/Card';
import { colors, fontSizes, layout, radii, spacing } from '@/theme/tokens';
import { CURRENT_BAND_TERM } from './legalTerm';

export type BandCreationDialogStatus = 'error' | 'idle' | 'submitting';

interface BandCreationDialogProps {
  readonly errorMessage: string | null;
  readonly onClose: () => void;
  readonly onSubmit: (input: {
    readonly acceptedTerm: boolean;
    readonly name: string;
  }) => void;
  readonly status: BandCreationDialogStatus;
  readonly visible: boolean;
}

export function BandCreationDialog({
  errorMessage,
  onClose,
  onSubmit,
  status,
  visible,
}: BandCreationDialogProps) {
  const [name, setName] = useState('');
  const [acceptedTerm, setAcceptedTerm] = useState(false);

  const isSubmitting = status === 'submitting';
  const canSubmit = name.trim().length > 0 && acceptedTerm && !isSubmitting;

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
        keyboardVerticalOffset={0}
        style={styles.modalLayer}
        testID="band-creation-keyboard-layout"
      >
        <Pressable
          accessibilityLabel="Fechar criação de banda tocando fora"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="create-band-dialog"
        >
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              Criar banda
            </AppText>
            <Pressable
              accessibilityLabel="Fechar janela de criação de banda"
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
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            style={styles.formScroll}
          >
            <AppText tone="muted">
              Dê um nome ao seu palco. Depois você poderá convidar os outros
              integrantes.
            </AppText>

            <View style={styles.fieldGroup}>
              <AppText variant="caption">Nome da banda</AppText>
              <TextInput
                accessibilityLabel="Nome da banda"
                autoCapitalize="words"
                autoFocus
                maxLength={120}
                onChangeText={setName}
                placeholder="Ex.: Banda Horizonte"
                placeholderTextColor={colors.muted}
                style={styles.input}
                testID="create-band-name"
                value={name}
              />
            </View>

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
              accessibilityLabel="Aceitar termo de responsabilidade"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerm }}
              onPress={() => setAcceptedTerm((current) => !current)}
              style={({ pressed }) => [
                styles.acceptanceRow,
                pressed && styles.pressed,
              ]}
              testID="create-band-term-acceptance"
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerm && styles.checkboxChecked,
                ]}
              >
                {acceptedTerm ? (
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
              disabled={isSubmitting}
              label="Cancelar"
              onPress={onClose}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Confirmar criação da banda"
              disabled={!canSubmit}
              icon="check"
              label={isSubmitting ? 'Criando…' : 'Criar banda'}
              onPress={() => onSubmit({ acceptedTerm, name })}
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
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
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
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  input: {
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
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
  termTitle: {
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
  termScroll: {
    maxHeight: 132,
  },
  termScrollContent: {
    paddingBottom: spacing.xs,
  },
});
