import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { BandInvitation } from '@/domain';
import type { CreatedInvitation } from '@/data/supabase/invitationMutations';
import { formatDateOnly } from '@/utils/dateTime';
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

function formatInvitationStatus(invitation: BandInvitation): string {
  const date =
    invitation.status === 'used'
      ? invitation.usedAt
        ? formatDateOnly(invitation.usedAt)
        : null
      : formatDateOnly(invitation.expiresAt);

  if (!date) {
    return statusLabels[invitation.status];
  }

  const dateDescription =
    invitation.status === 'used' ? 'aceito em' : 'válido até';

  return `${statusLabels[invitation.status]} · ${dateDescription} ${date}`;
}

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
  const [shareableUrls, setShareableUrls] = useState<Record<string, string>>(
    {},
  );

  function handleClose() {
    setLastCreated(null);
    onClose();
  }

  async function handleCreate() {
    const created = await onCreate(label);

    if (created) {
      setLastCreated(created);
      setShareableUrls((current) => ({
        ...current,
        [created.id]: created.url,
      }));
      setLabel('');
    }
  }

  async function handleRenew(invitationId: string) {
    const renewed = await onRenew(invitationId);

    if (renewed) {
      setLastCreated(renewed);
      setShareableUrls((current) => ({
        ...current,
        [renewed.id]: renewed.url,
      }));
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

  async function handleShareAgain(invitation: BandInvitation) {
    const knownUrl = shareableUrls[invitation.id];

    if (knownUrl) {
      await shareUrl(knownUrl);
      return;
    }

    const created = await onCreate(invitation.label ?? '');

    if (created) {
      setShareableUrls((current) => ({
        ...current,
        [created.id]: created.url,
      }));

      await shareUrl(created.url);
    }
  }

  return (
    <>
      <Modal
        animationType="fade"
        onRequestClose={handleClose}
        transparent
        visible={visible}
      >
        <KeyboardAvoidingView
          accessibilityViewIsModal
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.modalLayer}
          testID="band-invitation-keyboard-layout"
        >
          <Pressable
            accessibilityLabel="Fechar convites tocando fora"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleClose}
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
                onPress={handleClose}
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

              <View style={styles.listHeader}>
                <AppText variant="heading">Histórico de convites</AppText>
                <AppText tone="muted" variant="caption">
                  {invitations.length} link{invitations.length === 1 ? '' : 's'}
                </AppText>
              </View>
              {invitations.length === 0 ? (
                <AppText tone="muted">
                  Nenhum convite ainda. Crie o primeiro quando a banda estiver
                  no aquecimento.
                </AppText>
              ) : (
                invitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationRow}>
                    <View style={styles.invitationCopy}>
                      <AppText>{invitation.label ?? 'Sem rótulo'}</AppText>
                      <AppText tone="muted" variant="caption">
                        {formatInvitationStatus(invitation)}
                      </AppText>
                    </View>
                    {invitation.status === 'active' ? (
                      <View style={styles.invitationActions}>
                        <InvitationIconButton
                          accessibilityLabel="Compartilhar convite novamente"
                          disabled={isSubmitting}
                          icon="share"
                          onPress={() => void handleShareAgain(invitation)}
                        />
                        <InvitationIconButton
                          accessibilityLabel="Revogar convite"
                          disabled={isSubmitting}
                          icon="revoke"
                          onPress={() => onRevoke(invitation.id)}
                        />
                      </View>
                    ) : invitation.status !== 'used' ? (
                      <InvitationIconButton
                        accessibilityLabel="Renovar convite"
                        disabled={isSubmitting}
                        icon="renew"
                        onPress={() => void handleRenew(invitation.id)}
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
              <AppButton
                label="Fechar"
                onPress={handleClose}
                variant="secondary"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <InvitationLinkReadyDialog
        invitation={lastCreated}
        onClose={() => setLastCreated(null)}
        onShare={() => {
          if (lastCreated) {
            void shareUrl(lastCreated.url);
          }
        }}
      />
    </>
  );
}

interface InvitationLinkReadyDialogProps {
  readonly invitation: CreatedInvitation | null;
  readonly onClose: () => void;
  readonly onShare: () => void;
}

function InvitationLinkReadyDialog({
  invitation,
  onClose,
  onShare,
}: InvitationLinkReadyDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={invitation !== null}
    >
      <View style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar link pronto tocando fora"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrim}
        />
        {invitation ? (
          <View
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
            style={styles.linkDialog}
            testID="band-invitation-link-dialog"
          >
            <View style={styles.header}>
              <AppText accessibilityRole="header" variant="heading">
                Link pronto para o palco
              </AppText>
              <Pressable
                accessibilityLabel="Fechar link pronto"
                accessibilityRole="button"
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
            <View style={styles.linkContent}>
              <AppText tone="muted">
                Compartilhe este link com a pessoa que vai entrar na banda.
              </AppText>
              <AppText selectable style={styles.linkText} variant="caption">
                {invitation.url}
              </AppText>
              <AppButton
                accessibilityLabel="Compartilhar link"
                icon="externalLink"
                label="Compartilhar link"
                onPress={onShare}
                variant="secondary"
              />
            </View>
            <View style={styles.actions}>
              <AppButton label="Fechar" onPress={onClose} variant="secondary" />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

interface InvitationIconButtonProps {
  readonly accessibilityLabel: string;
  readonly disabled: boolean;
  readonly icon: AppIconName;
  readonly onPress: () => void;
}

function InvitationIconButton({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
}: InvitationIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.invitationIconButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        color={disabled ? colors.muted : colors.violet}
        name={icon}
        size={18}
      />
    </Pressable>
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
  linkContent: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  linkDialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxWidth: 560,
    overflow: 'hidden',
    width: '100%',
  },
  linkText: {
    color: colors.ink,
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
  },
  invitationActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  invitationIconButton: {
    alignItems: 'center',
    borderColor: colors.violet,
    borderRadius: radii.md,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
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
  disabled: {
    opacity: 0.5,
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
