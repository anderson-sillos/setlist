import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { BandMember, BandRole } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export type BandMemberManagementAction =
  | { readonly type: 'set-role'; readonly role: BandRole }
  | { readonly type: 'remove' };

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
  const actionLabel = selectedAction
    ? selectedAction.type === 'remove'
      ? 'remoção'
      : `alteração para ${roleLabels[selectedAction.role]}`
    : '';

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
              ? selectedAction?.type === 'remove'
                ? `Remover ${member.displayName} da banda? Essa pessoa perderá o acesso ao conteúdo.`
                : `Alterar ${member.displayName} para ${roleLabels[selectedAction.role]}? As permissões de acesso serão atualizadas.`
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
                icon={selectedAction?.type === 'remove' ? 'close' : 'check'}
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
              {roleActions[member.role].map(({ label, role, verb }) => (
                <AppButton
                  accessibilityLabel={`${verb} ${member.displayName} para ${roleLabels[role].toLocaleLowerCase('pt-BR')}`}
                  icon="check"
                  key={role}
                  label={label}
                  onPress={() =>
                    setPendingAction({
                      action: { role, type: 'set-role' },
                      memberId: member.id,
                    })
                  }
                  variant="secondary"
                />
              ))}
              <AppButton
                accessibilityLabel={`Remover ${member.displayName}`}
                icon="close"
                label="Remover integrante"
                onPress={() =>
                  setPendingAction({
                    action: { type: 'remove' },
                    memberId: member.id,
                  })
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

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

const roleActions: Record<
  BandRole,
  readonly { label: string; role: BandRole; verb: string }[]
> = {
  editor: [
    { label: 'Promover a Proprietário', role: 'owner', verb: 'Promover' },
    { label: 'Rebaixar para Integrante', role: 'member', verb: 'Rebaixar' },
  ],
  member: [
    { label: 'Promover a Editor', role: 'editor', verb: 'Promover' },
    { label: 'Promover a Proprietário', role: 'owner', verb: 'Promover' },
  ],
  owner: [
    { label: 'Rebaixar para Editor', role: 'editor', verb: 'Rebaixar' },
    { label: 'Rebaixar para Integrante', role: 'member', verb: 'Rebaixar' },
  ],
};

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
