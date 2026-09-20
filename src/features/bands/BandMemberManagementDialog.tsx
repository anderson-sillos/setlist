import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { BandMember } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export type BandMemberManagementAction = 'promote' | 'remove';

interface BandMemberManagementDialogProps {
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly member: BandMember | null;
  readonly onClose: () => void;
  readonly onConfirm: (action: BandMemberManagementAction) => void;
}

export function BandMemberManagementDialog({
  errorMessage,
  isSubmitting,
  member,
  onClose,
  onConfirm,
}: BandMemberManagementDialogProps) {
  const [pendingAction, setPendingAction] = useState<{
    action: BandMemberManagementAction;
    memberId: string;
  } | null>(null);

  if (!member) {
    return null;
  }

  const selectedAction =
    pendingAction?.memberId === member.id ? pendingAction.action : null;
  const isConfirmation = selectedAction !== null;
  const actionLabel = selectedAction === 'promote' ? 'promoção' : 'remoção';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar administração de integrante"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrim}
        />
        <View style={styles.dialog} testID="band-member-management-dialog">
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              Administrar integrante
            </AppText>
            <Pressable
              accessibilityLabel="Fechar administração de integrante"
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

          <AppText>
            {isConfirmation
              ? selectedAction === 'promote'
                ? `Promover ${member.displayName} para Proprietário? Essa pessoa passará a administrar a banda.`
                : `Remover ${member.displayName} da banda? Essa pessoa perderá o acesso ao conteúdo.`
              : `Escolha uma ação para ${member.displayName}.`}
          </AppText>

          {errorMessage ? (
            <AppText accessibilityRole="alert" style={styles.errorText}>
              {errorMessage}
            </AppText>
          ) : null}

          {isConfirmation ? (
            <View style={styles.actions}>
              <AppButton
                disabled={isSubmitting}
                label="Voltar"
                onPress={() => setPendingAction(null)}
                variant="secondary"
              />
              <AppButton
                accessibilityLabel={`Confirmar ${actionLabel} de ${member.displayName}`}
                disabled={isSubmitting}
                icon={selectedAction === 'promote' ? 'check' : 'close'}
                label={isSubmitting ? 'Salvando…' : 'Confirmar'}
                onPress={() => {
                  if (selectedAction) {
                    onConfirm(selectedAction);
                  }
                }}
              />
            </View>
          ) : (
            <View style={styles.actionList}>
              {member.role !== 'owner' ? (
                <AppButton
                  accessibilityLabel={`Promover ${member.displayName} a proprietário`}
                  icon="check"
                  label="Promover a Proprietário"
                  onPress={() =>
                    setPendingAction({ action: 'promote', memberId: member.id })
                  }
                  variant="secondary"
                />
              ) : null}
              <AppButton
                accessibilityLabel={`Remover ${member.displayName}`}
                icon="close"
                label="Remover integrante"
                onPress={() =>
                  setPendingAction({ action: 'remove', memberId: member.id })
                }
                variant="secondary"
              />
            </View>
          )}
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
