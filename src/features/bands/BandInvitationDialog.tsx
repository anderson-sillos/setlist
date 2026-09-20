import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { BandInvitation } from '@/domain';
import type { CreatedInvitation } from '@/data/supabase/invitationMutations';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface BandInvitationDialogProps {
  readonly errorMessage: string | null;
  readonly invitations: readonly BandInvitation[];
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onCreate: (label: string) => Promise<CreatedInvitation | null>;
  readonly onRenew: (invitationId: string) => Promise<CreatedInvitation | null>;
  readonly onRevoke: (invitationId: string) => void;
  readonly visible: boolean;
}

const statusLabels = {
  active: 'Ativo',
  expired: 'Expirado',
  revoked: 'Revogado',
  used: 'Utilizado',
} as const;

export function BandInvitationDialog({
  errorMessage,
  invitations,
  isSubmitting,
  onClose,
  onCreate,
  onRenew,
  onRevoke,
  visible,
}: BandInvitationDialogProps) {
  const [label, setLabel] = useState('');
  const [lastCreated, setLastCreated] = useState<CreatedInvitation | null>(
    null,
  );

  async function handleCreate() {
    const created = await onCreate(label);

    if (created) {
      setLastCreated(created);
      setLabel('');
    }
  }

  async function handleRenew(invitationId: string) {
    const renewed = await onRenew(invitationId);

    if (renewed) {
      setLastCreated(renewed);
    }
  }

  async function shareUrl(url: string) {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }

      return;
    }

    await Share.share({ message: url, url });
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar convites tocando fora"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="band-invitation-dialog"
        >
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              Convites da banda
            </AppText>
            <Pressable
              accessibilityLabel="Fechar janela de convites"
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
              Crie links de uso único. O rótulo ajuda a organizar os convites,
              mas não limita quem pode entrar.
            </AppText>
            <View style={styles.fieldGroup}>
              <AppText variant="caption">Rótulo (opcional)</AppText>
              <TextInput
                accessibilityLabel="Rótulo do convite"
                maxLength={120}
                onChangeText={setLabel}
                placeholder="Ex.: Baixista"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={label}
              />
            </View>
            <AppButton
              accessibilityLabel="Criar convite"
              disabled={isSubmitting}
              icon="add"
              label={isSubmitting ? 'Criando…' : 'Criar convite'}
              onPress={() => void handleCreate()}
            />

            {lastCreated ? (
              <Card style={styles.createdCard} tone="accent">
                <AppText variant="heading">Link pronto para o palco</AppText>
                <AppText selectable variant="caption">
                  {lastCreated.url}
                </AppText>
                <AppButton
                  accessibilityLabel="Compartilhar link"
                  icon="externalLink"
                  label="Compartilhar link"
                  onPress={() => void shareUrl(lastCreated.url)}
                  variant="secondary"
                />
              </Card>
            ) : null}

            <View style={styles.listHeader}>
              <AppText variant="heading">Histórico de convites</AppText>
              <AppText tone="muted" variant="caption">
                {invitations.length} link{invitations.length === 1 ? '' : 's'}
              </AppText>
            </View>
            {invitations.length === 0 ? (
              <AppText tone="muted">
                Nenhum convite ainda. Crie o primeiro quando a banda estiver no
                aquecimento.
              </AppText>
            ) : (
              invitations.map((invitation) => (
                <View key={invitation.id} style={styles.invitationRow}>
                  <View style={styles.invitationCopy}>
                    <AppText>{invitation.label ?? 'Sem rótulo'}</AppText>
                    <AppText tone="muted" variant="caption">
                      {statusLabels[invitation.status]} · válido até{' '}
                      {new Date(invitation.expiresAt).toLocaleDateString(
                        'pt-BR',
                      )}
                    </AppText>
                  </View>
                  {invitation.status === 'active' ? (
                    <AppButton
                      accessibilityLabel="Revogar convite"
                      disabled={isSubmitting}
                      label="Revogar"
                      onPress={() => onRevoke(invitation.id)}
                      variant="secondary"
                    />
                  ) : invitation.status !== 'used' ? (
                    <AppButton
                      accessibilityLabel="Renovar convite"
                      disabled={isSubmitting}
                      label="Renovar"
                      onPress={() => void handleRenew(invitation.id)}
                      variant="secondary"
                    />
                  ) : null}
                </View>
              ))
            )}
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <AppButton label="Fechar" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
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
  createdCard: {
    gap: spacing.md,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxHeight: '90%',
    maxWidth: 560,
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
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  invitationCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  invitationRow: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  listHeader: {
    gap: spacing.xs,
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
