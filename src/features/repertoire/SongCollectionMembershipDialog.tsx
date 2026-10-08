import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { EntityId, RepertoireCollection } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface SongCollectionMembershipDialogProps {
  readonly collections: readonly RepertoireCollection[];
  readonly errorMessage: string | null;
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onCreateCollection: () => void;
  readonly onDismiss: () => void;
  readonly onSave: () => void;
  readonly onToggle: (collectionId: EntityId) => void;
  readonly selectedCollectionIds: ReadonlySet<EntityId>;
  readonly saveDisabled: boolean;
  readonly songTitle: string;
  readonly visible: boolean;
}

export function SongCollectionMembershipDialog({
  collections,
  errorMessage,
  isSaving,
  onClose,
  onCreateCollection,
  onDismiss,
  onSave,
  onToggle,
  selectedCollectionIds,
  saveDisabled,
  songTitle,
  visible,
}: SongCollectionMembershipDialogProps) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onDismiss={onDismiss}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.modalLayer}>
        <Pressable
          accessibilityLabel="Fechar gerenciamento de coleções"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onClose}
          style={styles.scrim}
        />
        <View style={styles.dialog} testID="song-collection-membership-dialog">
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              Coleções da música
            </AppText>
            <Pressable
              accessibilityLabel="Fechar gerenciamento de coleções"
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon color={colors.text.secondary} name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <AppText tone="muted">{songTitle}</AppText>
            {collections.length > 0 ? (
              <ScrollView
                contentContainerStyle={styles.collectionList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.collectionScroll}
              >
                {collections.map((collection) => {
                  const selected = selectedCollectionIds.has(collection.id);
                  return (
                    <Pressable
                      accessibilityLabel={`Coleção ${collection.name}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      key={collection.id}
                      onPress={() => onToggle(collection.id)}
                      style={({ pressed }) => [
                        styles.collectionOption,
                        selected && styles.collectionOptionSelected,
                        pressed && styles.pressed,
                      ]}
                      testID={`song-collection-option-${collection.id}`}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxSelected,
                        ]}
                      >
                        {selected ? (
                          <AppIcon
                            color={colors.text.onAccent}
                            name="check"
                            size={14}
                          />
                        ) : null}
                      </View>
                      <AppText style={styles.collectionName}>
                        {collection.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <AppText>
                Ainda não há coleções cadastradas para esta banda.
              </AppText>
            )}
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <AppButton
              disabled={isSaving}
              label="Cancelar"
              onPress={onClose}
              variant="secondary"
            />
            <AppButton
              disabled={isSaving}
              icon="addCircle"
              label="Criar seleção"
              onPress={onCreateCollection}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Salvar coleções da música"
              disabled={isSaving || saveDisabled || collections.length === 0}
              icon="check"
              label={isSaving ? 'Salvando…' : 'Salvar'}
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  collectionList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  collectionName: {
    flex: 1,
  },
  collectionOption: {
    alignItems: 'center',
    backgroundColor: colors.background.base,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  collectionOptionSelected: {
    backgroundColor: colors.background.selected,
    borderColor: colors.border.selected,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    maxHeight: '80%',
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  errorText: {
    color: colors.semantic.danger,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border.subtle,
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
  collectionScroll: {
    flexGrow: 0,
    maxHeight: 360,
  },
  pressed: {
    opacity: 0.72,
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
