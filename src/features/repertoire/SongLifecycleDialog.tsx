import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { Song } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface SongLifecycleDialogProps {
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly visible: boolean;
  readonly onArchive: () => void;
  readonly onClose: () => void;
  readonly onRemove: () => void;
  readonly onRestore: () => void;
  readonly song: Song | null;
}

export function SongLifecycleDialog({
  errorMessage,
  isSubmitting,
  onArchive,
  onClose,
  onRemove,
  onRestore,
  song,
  visible,
}: SongLifecycleDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!song || !visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar opções da música"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="song-lifecycle-dialog"
        >
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              {confirmDelete ? 'Excluir música' : 'Opções da música'}
            </AppText>
            <Pressable
              accessibilityLabel="Fechar opções da música"
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon color={colors.muted} name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <AppText variant="heading">{song.title}</AppText>
            {confirmDelete ? (
              <>
                <AppText>
                  Se a música estiver em algum show, ela será arquivada para
                  preservar a setlist. Sem referências, será excluída
                  definitivamente.
                </AppText>
                <AppText tone="muted">
                  Essa decisão não altera músicas já incluídas em shows.
                </AppText>
              </>
            ) : (
              <>
                <AppText tone="muted">
                  Arquive músicas que não devem aparecer em novas setlists e
                  restaure-as quando voltarem ao repertório.
                </AppText>
                {song.archivedAt ? (
                  <AppButton
                    accessibilityLabel="Restaurar música"
                    disabled={isSubmitting}
                    icon="renew"
                    label={isSubmitting ? 'Restaurando…' : 'Restaurar música'}
                    onPress={onRestore}
                    variant="secondary"
                  />
                ) : (
                  <AppButton
                    accessibilityLabel="Arquivar música"
                    disabled={isSubmitting}
                    icon="archive"
                    label={isSubmitting ? 'Arquivando…' : 'Arquivar música'}
                    onPress={onArchive}
                    variant="secondary"
                  />
                )}
                <AppButton
                  accessibilityLabel="Excluir música"
                  disabled={isSubmitting}
                  icon="remove"
                  label="Excluir música"
                  onPress={() => setConfirmDelete(true)}
                  variant="secondary"
                />
              </>
            )}
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <AppButton
              disabled={isSubmitting}
              label={confirmDelete ? 'Voltar' : 'Cancelar'}
              onPress={confirmDelete ? () => setConfirmDelete(false) : onClose}
              variant="secondary"
            />
            {confirmDelete ? (
              <AppButton
                accessibilityLabel="Confirmar exclusão da música"
                disabled={isSubmitting}
                icon="remove"
                label={isSubmitting ? 'Excluindo…' : 'Confirmar exclusão'}
                onPress={onRemove}
              />
            ) : null}
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
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
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
});
