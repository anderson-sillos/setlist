import { useMemo, useState } from 'react';
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
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { SpinButton } from '@/components/ui/SpinButton';
import type { EntityId, ShowSetlistItem, Song } from '@/domain';
import { moveSetlistItem } from '@/domain';
import { getBlockDurationBreakdown } from '@/domain/setlistDuration';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatShowDuration } from '@/utils/duration';

export type ShowSetlistItemDraft = ShowSetlistItem & {
  readonly isNew?: boolean;
};

export interface ShowBlockDraft {
  readonly id: EntityId;
  readonly isNew?: boolean;
  readonly items: readonly ShowSetlistItemDraft[];
  readonly name: string;
}

interface ShowBlockEditorDialogProps {
  readonly errorMessage: string | null;
  readonly initialBlocks: readonly ShowBlockDraft[];
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (blocks: readonly ShowBlockDraft[]) => void;
  readonly songs: readonly Song[];
  readonly visible: boolean;
}

interface MoveItemState {
  readonly itemId: EntityId;
  readonly sourceBlockId: EntityId;
}

function cloneBlocks(blocks: readonly ShowBlockDraft[]): ShowBlockDraft[] {
  return blocks.map((block) => ({
    ...block,
    items: block.items.map((item) => ({ ...item })),
  }));
}

function createDraftId(prefix: string, index: number) {
  return 'draft-' + prefix + '-' + Date.now() + '-' + index;
}

function getDurationParts(durationMs: number | null) {
  if (durationMs === null) {
    return { minutes: '', seconds: '' };
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  return {
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  };
}

function toDurationMs(minutes: string, seconds: string) {
  const normalizedMinutes = Number(minutes.trim() || 0);
  const normalizedSeconds = Number(seconds.trim() || 0);
  if (
    !Number.isFinite(normalizedMinutes) ||
    !Number.isFinite(normalizedSeconds)
  ) {
    return null;
  }

  const safeMinutes = Math.max(0, Math.floor(normalizedMinutes));
  const safeSeconds = Math.max(0, Math.min(59, Math.floor(normalizedSeconds)));
  const totalMs = (safeMinutes * 60 + safeSeconds) * 1000;
  return totalMs > 0 ? totalMs : null;
}

function moveBlock(
  blocks: readonly ShowBlockDraft[],
  sourceIndex: number,
  targetIndex: number,
): ShowBlockDraft[] {
  if (sourceIndex === targetIndex) return [...blocks];
  const next = [...blocks];
  const [block] = next.splice(sourceIndex, 1);
  if (!block) return next;
  next.splice(targetIndex, 0, block);
  return next;
}

export function ShowBlockEditorDialog({
  errorMessage,
  initialBlocks,
  isSubmitting,
  onClose,
  onSubmit,
  songs,
  visible,
}: ShowBlockEditorDialogProps) {
  const [blocks, setBlocks] = useState<ShowBlockDraft[]>(() =>
    cloneBlocks(initialBlocks),
  );
  const [activeBlockId, setActiveBlockId] = useState<EntityId>(
    initialBlocks[0]?.id ?? '',
  );
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [songSheetVisible, setSongSheetVisible] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<readonly EntityId[]>(
    [],
  );
  const [moveItem, setMoveItem] = useState<MoveItemState | null>(null);
  const [moveTargetBlockId, setMoveTargetBlockId] = useState<EntityId>(
    initialBlocks[0]?.id ?? '',
  );
  const [movePosition, setMovePosition] = useState('1');
  const [discardVisible, setDiscardVisible] = useState(false);
  const initialSnapshot = useMemo(
    () => JSON.stringify(initialBlocks),
    [initialBlocks],
  );
  const hasChanges = JSON.stringify(blocks) !== initialSnapshot;
  const requestClose = () => {
    if (isSubmitting) return;
    if (hasChanges) {
      setDiscardVisible(true);
      return;
    }
    onClose();
  };

  const activeBlock = blocks.find((block) => block.id === activeBlockId);
  const moveSourceBlock = moveItem
    ? blocks.find((block) => block.id === moveItem.sourceBlockId)
    : undefined;
  const moveTargetBlock = blocks.find(
    (block) => block.id === moveTargetBlockId,
  );
  const moveMaxPosition = Math.max(
    1,
    (moveTargetBlock?.items.length ?? 0) -
      (moveTargetBlockId === moveItem?.sourceBlockId ? 1 : 0) +
      1,
  );

  const songById = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );
  const durations = useMemo(() => {
    const blockDurations = new Map<EntityId, number | null>();
    let hasDuration = false;
    let totalMs = 0;

    blocks.forEach((block) => {
      const breakdown = getBlockDurationBreakdown(block, songById);
      const durationMs = breakdown.totalMs;
      blockDurations.set(block.id, durationMs);
      if (durationMs !== null) {
        hasDuration = true;
        totalMs += durationMs;
      }
    });

    return {
      blockDurations,
      totalMs: hasDuration ? totalMs : null,
    };
  }, [blocks, songById]);

  const updateBlock = (
    blockId: EntityId,
    updater: (block: ShowBlockDraft) => ShowBlockDraft,
  ) => {
    setBlocks((current) =>
      current.map((block) => (block.id === blockId ? updater(block) : block)),
    );
  };

  const updateItem = (
    blockId: EntityId,
    itemId: EntityId,
    updater: (item: ShowSetlistItemDraft) => ShowSetlistItemDraft,
  ) => {
    updateBlock(blockId, (block) => ({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    }));
  };

  const addBlock = () => {
    const id = createDraftId('block', blocks.length);
    setBlocks((current) => [
      ...current,
      { id, isNew: true, items: [], name: 'Novo bloco' },
    ]);
    setActiveBlockId(id);
    setAddSheetVisible(false);
  };

  const addPlanning = () => {
    if (!activeBlock) return;
    const id = createDraftId('planning', activeBlock.items.length);
    updateBlock(activeBlock.id, (block) => ({
      ...block,
      items: [
        ...block.items,
        {
          description: 'Nova anotação',
          estimatedDurationMs: null,
          id,
          isNew: true,
          type: 'planning',
        },
      ],
    }));
    setAddSheetVisible(false);
  };

  const addSeparator = () => {
    if (!activeBlock) return;
    const id = createDraftId('separator', activeBlock.items.length);
    updateBlock(activeBlock.id, (block) => ({
      ...block,
      items: [...block.items, { id, isNew: true, type: 'separator' }],
    }));
    setAddSheetVisible(false);
  };

  const addSelectedSongs = () => {
    if (!activeBlock || selectedSongIds.length === 0) return;
    updateBlock(activeBlock.id, (block) => ({
      ...block,
      items: [
        ...block.items,
        ...selectedSongIds.map((songId, index) => ({
          id: createDraftId('song-' + songId, block.items.length + index),
          isNew: true,
          notes: null,
          songId,
          type: 'song' as const,
        })),
      ],
    }));
    setSelectedSongIds([]);
    setSongSheetVisible(false);
    setAddSheetVisible(false);
  };

  const removeItem = (blockId: EntityId, itemId: EntityId) => {
    updateBlock(blockId, (block) => ({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    }));
  };

  const openMoveItem = (blockId: EntityId, itemId: EntityId) => {
    const sourceBlock = blocks.find((block) => block.id === blockId);
    const sourceIndex = sourceBlock?.items.findIndex(
      (item) => item.id === itemId,
    );
    if (!sourceBlock || sourceIndex === undefined || sourceIndex < 0) return;

    setMoveItem({ itemId, sourceBlockId: blockId });
    setMoveTargetBlockId(blockId);
    setMovePosition(String(sourceIndex + 1));
  };

  const confirmMoveItem = () => {
    if (!moveItem) return;
    const position = Number(movePosition);
    if (!Number.isSafeInteger(position) || position < 1) return;

    const targetIndex = Math.min(moveMaxPosition - 1, position - 1);
    setBlocks(
      (current) =>
        moveSetlistItem(current, {
          itemId: moveItem.itemId,
          sourceBlockId: moveItem.sourceBlockId,
          targetBlockId: moveTargetBlockId,
          targetIndex,
        }) as ShowBlockDraft[],
    );
    setMoveItem(null);
  };

  const canSubmit =
    blocks.length > 0 &&
    blocks.every(
      (block) =>
        block.name.trim().length > 0 &&
        block.items.every((item) => {
          if (item.type === 'song') {
            return songById.has(item.songId);
          }
          if (item.type === 'planning') {
            return item.description.trim().length > 0;
          }
          return true;
        }),
    ) &&
    !isSubmitting;

  return (
    <Modal
      animationType="fade"
      onRequestClose={requestClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalLayer}
      >
        <Pressable
          accessibilityLabel="Fechar edição da setlist tocando fora"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={requestClose}
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
                Escolha um bloco e use Adicionar para montar a setlist.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Fechar edição de blocos"
              accessibilityRole="button"
              disabled={isSubmitting}
              hitSlop={spacing.sm}
              onPress={requestClose}
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
            <View style={styles.editorToolbar}>
              <View style={styles.toolbarCopy}>
                <AppText tone="muted" variant="caption">
                  Destino: {activeBlock?.name ?? 'nenhum bloco'}
                </AppText>
                <AppText tone="muted" variant="caption">
                  Tempo total:{' '}
                  {durations.totalMs === null
                    ? 'Duração não informada'
                    : formatShowDuration(durations.totalMs)}
                </AppText>
              </View>
              <AppButton
                disabled={isSubmitting || !activeBlock}
                icon="add"
                label="Adicionar"
                onPress={() => setAddSheetVisible(true)}
                style={styles.compactButton}
                variant="secondary"
              />
            </View>

            {blocks.map((block, index) => (
              <BlockRow
                block={block}
                count={blocks.length}
                dragging={draggingBlockId === block.id}
                durationMs={durations.blockDurations.get(block.id) ?? null}
                index={index}
                isActive={activeBlockId === block.id}
                key={block.id}
                onChangeItem={updateItem}
                onChangeName={(id, name) =>
                  updateBlock(id, (current) => ({ ...current, name }))
                }
                onMoveBlock={(source, target) =>
                  setBlocks((current) => moveBlock(current, source, target))
                }
                onMoveItem={openMoveItem}
                onRemoveItem={removeItem}
                onSelect={() => setActiveBlockId(block.id)}
                onSetDragging={setDraggingBlockId}
                songById={songById}
              />
            ))}

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
              onPress={requestClose}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Salvar setlist"
              disabled={!canSubmit}
              icon="check"
              label={isSubmitting ? 'Salvando…' : 'Salvar'}
              onPress={() => onSubmit(blocks)}
            />
          </View>
          <OptionSheet
            closeAccessibilityLabel="Continuar editando a setlist"
            label="Descartar alterações?"
            onClose={() => setDiscardVisible(false)}
            testID="show-block-editor-discard-sheet"
            visible={discardVisible}
          >
            <AppText tone="muted">
              Você fez alterações na setlist. Quer sair sem salvar?
            </AppText>
            <AppButton
              accessibilityLabel="Continuar editando"
              label="Continuar editando"
              onPress={() => setDiscardVisible(false)}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Descartar alterações"
              icon="remove"
              label="Descartar alterações"
              onPress={() => {
                setDiscardVisible(false);
                onClose();
              }}
            />
          </OptionSheet>
        </View>
      </KeyboardAvoidingView>

      <OptionSheet
        closeAccessibilityLabel="Fechar opções de inclusão"
        label="Adicionar à setlist"
        onClose={() => setAddSheetVisible(false)}
        visible={addSheetVisible}
      >
        <AppText tone="muted">
          Os itens entram em “{activeBlock?.name ?? 'nenhum bloco'}”. Toque no
          cabeçalho de outro bloco para trocar o destino.
        </AppText>
        <View style={styles.optionList}>
          <AppButton
            icon="musicAdd"
            label="Adicionar músicas"
            onPress={() => {
              setAddSheetVisible(false);
              setSongSheetVisible(true);
            }}
            variant="secondary"
          />
          <AppButton
            icon="planning"
            label="Adicionar anotação"
            onPress={addPlanning}
            variant="secondary"
          />
          <AppButton
            icon="remove"
            label="Adicionar separador"
            onPress={addSeparator}
            variant="secondary"
          />
          <AppButton
            icon="add"
            label="Adicionar bloco"
            onPress={addBlock}
            variant="secondary"
          />
        </View>
      </OptionSheet>

      <OptionSheet
        closeAccessibilityLabel="Fechar seleção de músicas"
        label="Adicionar músicas"
        onClose={() => {
          setSelectedSongIds([]);
          setSongSheetVisible(false);
        }}
        visible={songSheetVisible}
      >
        <ScrollView
          contentContainerStyle={styles.songOptions}
          keyboardShouldPersistTaps="handled"
          style={styles.songPickerScroll}
        >
          {songs.length === 0 ? (
            <AppText tone="muted">
              Nenhuma música ativa para incluir neste repertório.
            </AppText>
          ) : (
            songs.map((song) => {
              const selected = selectedSongIds.includes(song.id);
              return (
                <Pressable
                  accessibilityLabel={
                    selected
                      ? 'Remover seleção de ' + song.title
                      : 'Selecionar ' + song.title
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={song.id}
                  onPress={() =>
                    setSelectedSongIds((current) =>
                      selected
                        ? current.filter((id) => id !== song.id)
                        : [...current, song.id],
                    )
                  }
                  style={({ pressed }) => [
                    styles.songOption,
                    selected && styles.songOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.songOptionCopy}>
                    <AppText>{song.title}</AppText>
                    {song.originalArtist ? (
                      <AppText tone="muted" variant="caption">
                        {song.originalArtist}
                      </AppText>
                    ) : null}
                  </View>
                  {selected ? (
                    <AppIcon color={colors.violet} name="check" size={18} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
        <AppButton
          disabled={selectedSongIds.length === 0}
          icon="check"
          label={
            selectedSongIds.length === 0
              ? 'Selecione músicas'
              : 'Adicionar ' + selectedSongIds.length + ' música(s)'
          }
          onPress={addSelectedSongs}
        />
      </OptionSheet>

      <OptionSheet
        closeAccessibilityLabel="Fechar reordenação do item"
        label="Reordenar item"
        onClose={() => setMoveItem(null)}
        visible={moveItem !== null}
      >
        {moveSourceBlock && moveTargetBlock ? (
          <>
            <AppText tone="muted">
              Escolha o bloco de destino e a posição do item.
            </AppText>
            <View style={styles.targetList}>
              {blocks.map((block) => {
                const selected = block.id === moveTargetBlockId;
                return (
                  <Pressable
                    accessibilityLabel={'Mover para o bloco ' + block.name}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={block.id}
                    onPress={() => {
                      setMoveTargetBlockId(block.id);
                      setMovePosition('1');
                    }}
                    style={({ pressed }) => [
                      styles.targetOption,
                      selected && styles.targetOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText>{block.name}</AppText>
                    {selected ? (
                      <AppIcon color={colors.violet} name="check" size={16} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.positionRow}>
              <AppText>Posição</AppText>
              <SpinButton
                accessibilityLabel="Posição do item"
                max={moveMaxPosition}
                min={1}
                onChangeText={setMovePosition}
                value={movePosition}
              />
              <AppText tone="muted" variant="caption">
                de {moveMaxPosition}
              </AppText>
            </View>
            <AppButton
              disabled={!movePosition.trim()}
              icon="check"
              label="Mover item"
              onPress={confirmMoveItem}
            />
          </>
        ) : null}
      </OptionSheet>
    </Modal>
  );
}

function BlockRow({
  block,
  count,
  dragging,
  durationMs,
  index,
  isActive,
  onChangeItem,
  onChangeName,
  onMoveBlock,
  onMoveItem,
  onRemoveItem,
  onSelect,
  onSetDragging,
  songById,
}: {
  readonly block: ShowBlockDraft;
  readonly count: number;
  readonly dragging: boolean;
  readonly durationMs: number | null;
  readonly index: number;
  readonly isActive: boolean;
  readonly onChangeItem: (
    blockId: EntityId,
    itemId: EntityId,
    updater: (item: ShowSetlistItemDraft) => ShowSetlistItemDraft,
  ) => void;
  readonly onChangeName: (id: string, name: string) => void;
  readonly onMoveBlock: (sourceIndex: number, targetIndex: number) => void;
  readonly onMoveItem: (blockId: EntityId, itemId: EntityId) => void;
  readonly onRemoveItem: (blockId: EntityId, itemId: EntityId) => void;
  readonly onSelect: () => void;
  readonly onSetDragging: (blockId: string | null) => void;
  readonly songById: ReadonlyMap<string, Song>;
}) {
  const panResponder = createBlockPanResponder(
    index,
    count,
    block.id,
    onMoveBlock,
    onSetDragging,
  );

  return (
    <View style={[styles.blockCard, isActive && styles.activeBlockCard]}>
      <View style={styles.blockHeader}>
        <View style={styles.blockSelect}>
          <TextInput
            accessibilityLabel={'Nome do bloco ' + (index + 1)}
            onChangeText={(name) => onChangeName(block.id, name)}
            onFocus={onSelect}
            placeholder="Nome do bloco"
            placeholderTextColor={colors.muted}
            style={styles.blockNameInput}
            value={block.name}
          />
          <View style={styles.blockStatus}>
            <Pressable
              accessibilityLabel={'Selecionar bloco ' + block.name}
              accessibilityRole="button"
              onPress={onSelect}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <AppText tone="muted" variant="caption">
                {isActive ? 'Destino selecionado' : 'Toque para selecionar'}
              </AppText>
            </Pressable>
            <AppText tone="muted" variant="caption">
              {durationMs === null
                ? 'Duração não informada'
                : formatShowDuration(durationMs)}
            </AppText>
          </View>
        </View>
        <View
          accessibilityLabel={'Alça para mover o bloco ' + block.name}
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

      {block.items.length === 0 ? (
        <AppText tone="muted" variant="caption">
          Bloco vazio. Use Adicionar para incluir itens.
        </AppText>
      ) : (
        block.items.map((item, itemIndex) => (
          <SetlistItemRow
            index={itemIndex}
            item={item}
            key={item.id}
            onChange={(updater) => onChangeItem(block.id, item.id, updater)}
            onMove={() => onMoveItem(block.id, item.id)}
            onRemove={() => onRemoveItem(block.id, item.id)}
            song={item.type === 'song' ? songById.get(item.songId) : undefined}
          />
        ))
      )}
    </View>
  );
}

function SetlistItemRow({
  index,
  item,
  onChange,
  onMove,
  onRemove,
  song,
}: {
  readonly index: number;
  readonly item: ShowSetlistItemDraft;
  readonly onChange: (
    updater: (item: ShowSetlistItemDraft) => ShowSetlistItemDraft,
  ) => void;
  readonly onMove: () => void;
  readonly onRemove: () => void;
  readonly song?: Song;
}) {
  if (item.type === 'separator') {
    return (
      <View style={styles.itemRow}>
        <View accessibilityLabel="Separador visual" style={styles.separator} />
        <ItemActions
          itemLabel={'separador ' + (index + 1)}
          onMove={onMove}
          onRemove={onRemove}
        />
      </View>
    );
  }

  if (item.type === 'planning') {
    const parts = getDurationParts(item.estimatedDurationMs);
    return (
      <View style={[styles.itemRow, styles.planningRow]}>
        <AppIcon color={colors.violet} name="planning" size={16} />
        <View style={styles.itemFields}>
          <TextInput
            accessibilityLabel={'Descrição do planejamento ' + (index + 1)}
            onChangeText={(description) =>
              onChange((current) =>
                current.type === 'planning'
                  ? { ...current, description }
                  : current,
              )
            }
            placeholder="Ex.: Troca de instrumento"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={item.description}
          />
          <View style={styles.durationRow}>
            <AppText tone="muted" variant="caption">
              Duração
            </AppText>
            <SpinButton
              accessibilityLabel={'Minutos do planejamento ' + (index + 1)}
              max={999}
              onChangeText={(minutes) =>
                onChange((current) =>
                  current.type === 'planning'
                    ? {
                        ...current,
                        estimatedDurationMs: toDurationMs(
                          minutes,
                          getDurationParts(current.estimatedDurationMs).seconds,
                        ),
                      }
                    : current,
                )
              }
              value={parts.minutes}
            />
            <AppText tone="muted" variant="caption">
              min
            </AppText>
            <SpinButton
              accessibilityLabel={'Segundos do planejamento ' + (index + 1)}
              max={59}
              maxLength={2}
              onChangeText={(seconds) =>
                onChange((current) =>
                  current.type === 'planning'
                    ? {
                        ...current,
                        estimatedDurationMs: toDurationMs(
                          getDurationParts(current.estimatedDurationMs).minutes,
                          seconds,
                        ),
                      }
                    : current,
                )
              }
              value={parts.seconds}
            />
            <AppText tone="muted" variant="caption">
              s
            </AppText>
          </View>
        </View>
        <ItemActions
          itemLabel={'planejamento ' + (index + 1)}
          onMove={onMove}
          onRemove={onRemove}
        />
      </View>
    );
  }

  return (
    <View style={styles.itemRow}>
      <AppIcon color={colors.violet} name="music" size={16} />
      <View style={styles.itemFields}>
        <AppText>{song?.title ?? 'Música indisponível'}</AppText>
        {song?.originalArtist ? (
          <AppText tone="muted" variant="caption">
            {song.originalArtist}
          </AppText>
        ) : null}
        <TextInput
          accessibilityLabel={'Observação da música ' + (index + 1)}
          onChangeText={(notes) =>
            onChange((current) =>
              current.type === 'song'
                ? { ...current, notes: notes.trim() || null }
                : current,
            )
          }
          placeholder="Observação opcional para este show"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={item.notes ?? ''}
        />
      </View>
      <ItemActions
        itemLabel={'música ' + (index + 1)}
        onMove={onMove}
        onRemove={onRemove}
      />
    </View>
  );
}

function ItemActions({
  itemLabel,
  onMove,
  onRemove,
}: {
  readonly itemLabel: string;
  readonly onMove: () => void;
  readonly onRemove: () => void;
}) {
  return (
    <View style={styles.itemActions}>
      <Pressable
        accessibilityLabel={'Reordenar ' + itemLabel}
        accessibilityRole="button"
        hitSlop={spacing.xs}
        onPress={onMove}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <AppIcon color={colors.muted} name="dragHandle" size={18} />
      </Pressable>
      <Pressable
        accessibilityLabel={'Remover ' + itemLabel}
        accessibilityRole="button"
        hitSlop={spacing.xs}
        onPress={onRemove}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <AppIcon color={colors.violet} name="remove" size={17} />
      </Pressable>
    </View>
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
  activeBlockCard: {
    borderColor: colors.violet,
    borderWidth: 2,
  },
  blockCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  blockNameInput: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  blockSelect: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  compactButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    elevation: 8,
    maxHeight: '92%',
    maxWidth: 720,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    width: '94%',
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
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  editorToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  blockStatus: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  errorText: { color: colors.amber },
  toolbarCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
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
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  itemFields: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  itemRow: {
    alignItems: 'flex-start',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalLayer: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 45, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  optionList: { gap: spacing.sm },
  planningRow: {
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  positionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  scrim: { ...StyleSheet.absoluteFill },
  scroll: { flexGrow: 0 },
  separator: {
    alignSelf: 'center',
    borderTopColor: colors.violet,
    borderTopWidth: 2,
    flex: 1,
    marginVertical: spacing.sm,
    opacity: 0.42,
  },
  songOption: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  songOptionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  songOptionSelected: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
  },
  songOptions: { gap: spacing.sm, paddingBottom: spacing.md },
  songPickerScroll: { maxHeight: 360 },
  targetList: { gap: spacing.sm },
  targetOption: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  targetOptionSelected: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
  },
});
