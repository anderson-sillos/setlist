import { useState } from 'react';
import {
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
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { CURRENT_BAND_TERM } from './legalTerm';

export type BandCreationDialogStatus =
  'error' | 'idle' | 'submitting' | 'success';

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
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar criação de banda"
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
          {status === 'success' ? (
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <AppIcon color={colors.violet} name="check" size={28} />
              </View>
              <AppText accessibilityRole="header" variant="heading">
                Banda criada
              </AppText>
              <AppText>
                A banda foi criada e o aceite do termo foi registrado com o
                horário do servidor.
              </AppText>
              <AppButton label="Voltar para Minhas bandas" onPress={onClose} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <AppText accessibilityRole="header" variant="heading">
                Criar banda
              </AppText>
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

              <Card tone="accent">
                <AppText variant="heading">{CURRENT_BAND_TERM.title}</AppText>
                <AppText style={styles.termBody}>
                  {CURRENT_BAND_TERM.body}
                </AppText>
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
                  Li e aceito o termo de responsabilidade pelo conteúdo da
                  banda.
                </AppText>
              </Pressable>

              {errorMessage ? (
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}

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
            </ScrollView>
          )}
        </View>
      </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
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
  input: {
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
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
  successContent: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  termBody: {
    marginTop: spacing.sm,
  },
});
