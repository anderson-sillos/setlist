import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
import type { ShowBlockDraft } from '@/data/supabase/showBlockMutations';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface ShowBlockEditorDialogProps {
  readonly errorMessage: string | null;
  readonly initialBlocks: readonly ShowBlockDraft[];
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (blocks: readonly ShowBlockDraft[]) => void;
  readonly visible: boolean;
}

function moveBlock(
  blocks: readonly ShowBlockDraft[],
  sourceIndex: number,
  targetIndex: number,
): ShowBlockDraft[] {
  if (sourceIndex === targetIndex) return [...blocks];
  const next = [...blocks];
  const [block] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, block);
  return next;
}

export function ShowBlockEditorDialog({
  errorMessage,
  initialBlocks,
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: ShowBlockEditorDialogProps) {
  const [blocks, setBlocks] = useState<ShowBlockDraft[]>(() =>
    initialBlocks.map((block) => ({ ...block })),
  );
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

  const updateBlockName = (id: string, name: string) => {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, name } : block)),
    );
  };

  const addBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `new-block-${Date.now()}-${current.length}`,
        isNew: true,
        name: `Bloco ${current.length + 1}`,
      },
    ]);
  };

  const canSubmit =
    blocks.length > 0 &&
    blocks.every((block) => block.name.trim().length > 0) &&
    !isSubmitting;

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
          accessibilityLabel="Fechar edição de blocos tocando fora"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="show-block-editor-dialog"
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText accessibilityRole="header" variant="heading">
                Editar blocos
              </AppText>
              <AppText tone="muted" variant="caption">
                Arraste pela alça para reordenar.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Fechar edição de blocos"
              accessibilityRole="button"
              disabled={isSubmitting}
              hitSlop={spacing.sm}
              onPress={onClose}
              style={styles.closeButton}
            >
              <AppIcon color={colors.muted} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
          >
            {blocks.map((block, index) => (
              <BlockRow
                block={block}
                count={blocks.length}
                dragging={draggingBlockId === block.id}
                index={index}
                key={block.id}
                onChangeName={updateBlockName}
                onMove={(source, target) =>
                  setBlocks((current) => moveBlock(current, source, target))
                }
                onSetDragging={setDraggingBlockId}
              />
            ))}
            <AppButton
              disabled={isSubmitting}
              icon="add"
              label="Adicionar bloco"
              onPress={addBlock}
              variant="secondary"
            />
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
              accessibilityLabel="Salvar blocos"
              disabled={!canSubmit}
              icon="check"
              label={isSubmitting ? 'Salvando…' : 'Salvar'}
              onPress={() => onSubmit(blocks)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createBlockPanResponder(
  index: number,
  count: number,
  blockId: string,
  onMove: (sourceIndex: number, targetIndex: number) => void,
  onSetDragging: (blockId: string | null) => void,
) {
  let startIndex = index;
  let currentIndex = index;

  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      startIndex = index;
      currentIndex = index;
      onSetDragging(blockId);
    },
    onPanResponderMove: (_, gesture) => {
      const targetIndex = Math.max(
        0,
        Math.min(count - 1, startIndex + Math.round(gesture.dy / 64)),
      );
      if (targetIndex === currentIndex) return;
      onMove(currentIndex, targetIndex);
      currentIndex = targetIndex;
    },
    onPanResponderRelease: () => onSetDragging(null),
    onPanResponderTerminate: () => onSetDragging(null),
    onStartShouldSetPanResponder: () => true,
  });
}

function BlockRow({
  block,
  count,
  dragging,
  index,
  onChangeName,
  onMove,
  onSetDragging,
}: {
  readonly block: ShowBlockDraft;
  readonly count: number;
  readonly dragging: boolean;
  readonly index: number;
  readonly onChangeName: (id: string, name: string) => void;
  readonly onMove: (sourceIndex: number, targetIndex: number) => void;
  readonly onSetDragging: (blockId: string | null) => void;
}) {
  const panResponder = createBlockPanResponder(
    index,
    count,
    block.id,
    onMove,
    onSetDragging,
  );

  return (
    <View style={[styles.blockRow, dragging && styles.draggingRow]}>
      <TextInput
        accessibilityLabel={`Nome do bloco ${index + 1}`}
        onChangeText={(value) => onChangeName(block.id, value)}
        placeholder="Nome do bloco"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={block.name}
      />
      <View
        accessibilityLabel={`Alça para mover o bloco ${block.name}`}
        accessibilityRole="button"
        style={styles.dragHandleTouchTarget}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandle}>
          <AppIcon
            color={dragging ? colors.violet : colors.muted}
            name="dragHandle"
            size={18}
            strokeWidth={2.5}
          />
        </View>
      </View>
    </View>
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
  blockRow: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.minimumTouchTarget,
    padding: spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  content: { gap: spacing.md, padding: spacing.xl },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    elevation: 8,
    maxHeight: '92%',
    maxWidth: 640,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    width: '92%',
  },
  dragHandle: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dragHandleTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    width: layout.minimumTouchTarget,
  },
  draggingRow: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
    borderWidth: 2,
    elevation: 4,
    shadowColor: colors.violet,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    transform: [{ translateY: -2 }, { scale: 1.01 }],
    zIndex: 1,
  },
  errorText: { color: colors.amber },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    minHeight: layout.minimumTouchTarget,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  modalLayer: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 45, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scroll: { flexGrow: 0 },
  scrim: { ...StyleSheet.absoluteFill },
});
