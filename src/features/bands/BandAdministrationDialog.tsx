import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { Band } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export type BandAdministrationMode = 'delete' | 'menu' | 'rename';

interface BandAdministrationDialogProps {
  readonly band: Band | null;
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly mode: BandAdministrationMode | null;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly onRename: (name: string) => void;
  readonly onModeChange: (mode: BandAdministrationMode) => void;
}

export function BandAdministrationDialog({
  band,
  errorMessage,
  isSubmitting,
  mode,
  onClose,
  onDelete,
  onModeChange,
  onRename,
}: BandAdministrationDialogProps) {
  const [name, setName] = useState('');
  const [confirmationName, setConfirmationName] = useState('');

  if (!band || !mode) {
    return null;
  }

  const canDelete = confirmationName.trim() === band.name;
  const title =
    mode === 'menu'
      ? 'Administrar banda'
      : mode === 'rename'
        ? 'Editar nome da banda'
        : 'Excluir banda';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar administração da banda"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrim}
        />
        <View style={styles.dialog} testID="band-administration-dialog">
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              {title}
            </AppText>
            <Pressable
              accessibilityLabel="Fechar administração da banda"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon color={colors.muted} name="close" size={20} />
            </Pressable>
          </View>

          {mode === 'menu' ? (
            <View style={styles.actionList}>
              <AppText>
                {band.name} · ações disponíveis para Proprietário
              </AppText>
              <AppButton
                accessibilityLabel="Editar nome da banda"
                icon="edit"
                label="Editar nome"
                onPress={() => {
                  setName(band.name);
                  onModeChange('rename');
                }}
                variant="secondary"
              />
              <AppButton
                accessibilityLabel="Excluir banda"
                icon="close"
                label="Excluir banda"
                onPress={() => {
                  setConfirmationName('');
                  onModeChange('delete');
                }}
                variant="secondary"
              />
            </View>
          ) : null}

          {mode === 'rename' ? (
            <View style={styles.actionList}>
              <AppText tone="muted">
                O novo nome será exibido para todos os integrantes.
              </AppText>
              <TextInput
                accessibilityLabel="Novo nome da banda"
                autoCapitalize="words"
                maxLength={120}
                onChangeText={setName}
                placeholder="Nome da banda"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={name}
              />
              {errorMessage ? (
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}
              <View style={styles.actions}>
                <AppButton
                  disabled={isSubmitting}
                  label="Voltar"
                  onPress={() => onModeChange('menu')}
                  variant="secondary"
                />
                <AppButton
                  accessibilityLabel="Confirmar novo nome da banda"
                  disabled={isSubmitting || name.trim().length === 0}
                  icon="check"
                  label={isSubmitting ? 'Salvando…' : 'Salvar nome'}
                  onPress={() => onRename(name)}
                />
              </View>
            </View>
          ) : null}

          {mode === 'delete' ? (
            <View style={styles.actionList}>
              <AppText>
                Esta ação é permanente e remove repertório, shows e integrantes
                da banda. Para confirmar, digite exatamente:
              </AppText>
              <AppText variant="heading">{band.name}</AppText>
              <TextInput
                accessibilityLabel="Confirmação do nome da banda"
                autoCapitalize="none"
                onChangeText={setConfirmationName}
                placeholder={band.name}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={confirmationName}
              />
              {errorMessage ? (
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}
              <View style={styles.actions}>
                <AppButton
                  disabled={isSubmitting}
                  label="Voltar"
                  onPress={() => onModeChange('menu')}
                  variant="secondary"
                />
                <AppButton
                  accessibilityLabel="Confirmar exclusão da banda"
                  disabled={isSubmitting || !canDelete}
                  icon="close"
                  label={
                    isSubmitting ? 'Excluindo…' : 'Excluir definitivamente'
                  }
                  onPress={onDelete}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  closeButton: {
    alignItems: 'center',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.lg,
    maxWidth: 520,
    padding: spacing.xl,
    width: '100%',
  },
  errorText: {
    color: '#b91c1c',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
