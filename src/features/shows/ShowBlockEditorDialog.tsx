import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  type PanResponderInstance,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { SpinButton } from '@/components/ui/SpinButton';
import { SearchField } from '@/components/ui/list-controls/SearchField';
import { moveSetlistItem } from '@/domain';
import type { EntityId, ShowSetlistItem, Song } from '@/domain';
import { getBlockDurationBreakdown } from '@/domain/setlistDuration';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatShowDuration, formatSongDuration } from '@/utils/duration';

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
  readonly addSheetVisible: boolean;
  readonly errorMessage: string | null;
  readonly fullScreen?: boolean;
  readonly initialBlocks: readonly ShowBlockDraft[];
  readonly isSubmitting: boolean;
  readonly onAddSheetVisibilityChange: (visible: boolean) => void;
  readonly onClose: () => void;
  readonly onSubmit: (blocks: readonly ShowBlockDraft[]) => void;
  readonly songs: readonly Song[];
  readonly visible: boolean;
}

interface BlockLayout {
  readonly height: number;
  readonly y: number;
}

interface ItemLayout {
  readonly blockId: EntityId;
  readonly height: number;
  readonly localY: number;
  readonly y: number;
}

interface ItemDragSession {
  readonly itemId: EntityId;
  readonly originCenterY: number;
  readonly originScrollOffset: number;
  readonly originTopY: number;
  readonly sourceBlockId: EntityId;
  lastDy: number;
  targetBlockId: EntityId;
  targetIndex: number;
}

interface BlockDragSession {
  readonly blockId: EntityId;
  readonly originCenterY: number;
  readonly originScrollOffset: number;
  readonly originTopY: number;
  readonly sourceIndex: number;
  lastDy: number;
  targetIndex: number;
}

interface DragPreview {
  readonly height: number;
  readonly icon: AppIconName;
  readonly label: string;
  readonly top: number;
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
    return { hours: '', minutes: '', seconds: '' };
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  return {
    hours: String(Math.floor(totalMinutes / 60)).padStart(2, '0'),
    minutes: String(totalMinutes % 60).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  };
}

function toDurationMs(hours: string, minutes: string, seconds: string) {
  const normalizedHours = Number(hours.trim() || 0);
  const normalizedMinutes = Number(minutes.trim() || 0);
  const normalizedSeconds = Number(seconds.trim() || 0);
  if (
    !Number.isFinite(normalizedHours) ||
    !Number.isFinite(normalizedMinutes) ||
    !Number.isFinite(normalizedSeconds)
  ) {
    return null;
  }

  const safeHours = Math.max(0, Math.floor(normalizedHours));
  const safeMinutes = Math.max(0, Math.min(59, Math.floor(normalizedMinutes)));
  const safeSeconds = Math.max(0, Math.min(59, Math.floor(normalizedSeconds)));
  const totalMs = ((safeHours * 60 + safeMinutes) * 60 + safeSeconds) * 1000;
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
  addSheetVisible,
  errorMessage,
  fullScreen = false,
  initialBlocks,
  isSubmitting,
  onAddSheetVisibilityChange,
  onClose,
  onSubmit,
  songs,
  visible,
}: ShowBlockEditorDialogProps) {
  const [blocks, setBlocks] = useState<ShowBlockDraft[]>(() =>
    cloneBlocks(initialBlocks),
  );
  const blocksRef = useRef<ShowBlockDraft[]>(cloneBlocks(initialBlocks));
  const blockLayoutsRef = useRef(new Map<EntityId, BlockLayout>());
  const itemLayoutsRef = useRef(new Map<EntityId, ItemLayout>());
  const itemDragSessionRef = useRef<ItemDragSession | null>(null);
  const blockDragSessionRef = useRef<BlockDragSession | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollFrameYRef = useRef(0);
  const scrollOffsetYRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);
  const scrollContentHeightRef = useRef(0);
  const autoScrollVelocityRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);
  useEffect(
    () => () => {
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
    },
    [],
  );
  const [activeBlockId, setActiveBlockId] = useState<EntityId>(
    initialBlocks[0]?.id ?? '',
  );
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<{
    readonly blockId: EntityId;
    readonly itemId: EntityId;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<EntityId | null>(null);
  const [songSheetVisible, setSongSheetVisible] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<readonly EntityId[]>(
    [],
  );
  const [songSearchText, setSongSearchText] = useState('');
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
  const blockToDelete = blocks.find((block) => block.id === deleteBlockId);
  const songById = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );
  const filteredSongs = useMemo(() => {
    const query = songSearchText.trim().toLocaleLowerCase('pt-BR');
    if (!query) return songs;
    return songs.filter((song) =>
      `${song.title} ${song.originalArtist ?? ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(query),
    );
  }, [songs, songSearchText]);
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
      { id, isNew: true, items: [], name: `Bloco ${current.length + 1}` },
    ]);
    setActiveBlockId(id);
    onAddSheetVisibilityChange(false);
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
    onAddSheetVisibilityChange(false);
  };

  const addSeparator = () => {
    if (!activeBlock) return;
    const id = createDraftId('separator', activeBlock.items.length);
    updateBlock(activeBlock.id, (block) => ({
      ...block,
      items: [...block.items, { id, isNew: true, type: 'separator' }],
    }));
    onAddSheetVisibilityChange(false);
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
    setSongSearchText('');
    setSongSheetVisible(false);
    onAddSheetVisibilityChange(false);
  };

  const removeItem = (blockId: EntityId, itemId: EntityId) => {
    updateBlock(blockId, (block) => ({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    }));
  };

  const registerBlockLayout = (blockId: EntityId, layout: BlockLayout) => {
    blockLayoutsRef.current.set(blockId, layout);
    itemLayoutsRef.current.forEach((itemLayout, itemId) => {
      if (itemLayout.blockId !== blockId) return;
      itemLayoutsRef.current.set(itemId, {
        ...itemLayout,
        y: layout.y + itemLayout.localY,
      });
    });
  };

  const registerItemLayout = (
    blockId: EntityId,
    itemId: EntityId,
    localY: number,
    height: number,
  ) => {
    const blockLayout = blockLayoutsRef.current.get(blockId);
    itemLayoutsRef.current.set(itemId, {
      blockId,
      height,
      localY,
      y: (blockLayout?.y ?? 0) + localY,
    });
  };

  const findItemDragDestination = (targetY: number, sourceItemId: EntityId) => {
    const currentBlocks = blocksRef.current;
    const blockEntries = currentBlocks
      .map((block, index) => ({
        block,
        layout: blockLayoutsRef.current.get(block.id) ?? {
          height: 120,
          y: index * 120,
        },
      }))
      .sort((left, right) => left.layout.y - right.layout.y);
    if (blockEntries.length === 0) return null;

    const targetBlockEntry =
      blockEntries.find(
        ({ layout }) =>
          targetY >= layout.y && targetY <= layout.y + layout.height,
      ) ??
      blockEntries.reduce((closest, entry) => {
        const closestDistance = Math.abs(
          targetY - (closest.layout.y + closest.layout.height / 2),
        );
        const entryDistance = Math.abs(
          targetY - (entry.layout.y + entry.layout.height / 2),
        );
        return entryDistance < closestDistance ? entry : closest;
      });
    const targetBlockId = targetBlockEntry.block.id;
    const targetItems = targetBlockEntry.block.items.filter(
      (item) => item.id !== sourceItemId,
    );
    const positionedItems = targetItems
      .map((item, index) => ({
        item,
        layout: itemLayoutsRef.current.get(item.id) ?? {
          blockId: targetBlockId,
          height: 72,
          localY: index * 72,
          y: targetBlockEntry.layout.y + index * 72,
        },
      }))
      .sort((left, right) => left.layout.y - right.layout.y);
    const targetEntry = positionedItems.find(
      ({ layout }) => targetY < layout.y + layout.height / 2,
    );
    const targetIndex = targetEntry
      ? targetItems.findIndex(({ id }) => id === targetEntry.item.id)
      : targetItems.length;

    return {
      targetBlockId,
      targetIndex: Math.max(0, targetIndex),
    };
  };

  const startItemDrag = (blockId: EntityId, itemId: EntityId) => {
    const block = blocksRef.current.find(({ id }) => id === blockId);
    const itemIndex = block?.items.findIndex(({ id }) => id === itemId) ?? -1;
    const item = itemIndex >= 0 ? block?.items[itemIndex] : undefined;
    if (!item) return;
    const blockLayout = blockLayoutsRef.current.get(blockId);
    const itemLayout =
      itemLayoutsRef.current.get(itemId) ??
      ({
        blockId,
        height: 72,
        localY: Math.max(0, itemIndex) * 72,
        y: (blockLayout?.y ?? 0) + Math.max(0, itemIndex) * 72,
      } satisfies ItemLayout);
    const preview =
      item.type === 'song'
        ? {
            icon: 'music' as const,
            label: songById.get(item.songId)?.title ?? 'Música indisponível',
          }
        : item.type === 'planning'
          ? { icon: 'planning' as const, label: item.description }
          : { icon: 'minus' as const, label: 'Separador' };
    itemDragSessionRef.current = {
      itemId,
      originCenterY: itemLayout.y + itemLayout.height / 2,
      originScrollOffset: scrollOffsetYRef.current,
      originTopY: itemLayout.y,
      sourceBlockId: blockId,
      lastDy: 0,
      targetBlockId: blockId,
      targetIndex: itemIndex,
    };
    setDraggingItem({ blockId, itemId });
    setDragPreview({
      ...preview,
      height: itemLayout.height,
      top: scrollFrameYRef.current + itemLayout.y - scrollOffsetYRef.current,
    });
  };

  const moveItemDrag = (dy: number) => {
    const session = itemDragSessionRef.current;
    if (!session) return;
    session.lastDy = dy;
    const previewTop =
      scrollFrameYRef.current +
      session.originTopY -
      session.originScrollOffset +
      dy;
    setDragPreview((current) =>
      current ? { ...current, top: previewTop } : current,
    );
    const destination = findItemDragDestination(
      session.originCenterY +
        dy +
        scrollOffsetYRef.current -
        session.originScrollOffset,
      session.itemId,
    );
    if (destination) {
      session.targetBlockId = destination.targetBlockId;
      session.targetIndex = destination.targetIndex;
    }
    updateAutoScrollVelocity(previewTop, dragPreview?.height ?? 72);
  };

  const clearItemDrag = () => {
    stopAutoScroll();
    itemDragSessionRef.current = null;
    setDraggingItem(null);
    setDragPreview(null);
  };

  const finishItemDrag = () => {
    const session = itemDragSessionRef.current;
    if (session) {
      setBlocks((current) => {
        const sourceBlock = current.find(
          ({ id }) => id === session.sourceBlockId,
        );
        const sourceIndex =
          sourceBlock?.items.findIndex(({ id }) => id === session.itemId) ?? -1;
        if (
          sourceIndex < 0 ||
          (session.sourceBlockId === session.targetBlockId &&
            sourceIndex === session.targetIndex)
        ) {
          return current;
        }
        const next = moveSetlistItem(current, {
          itemId: session.itemId,
          sourceBlockId: session.sourceBlockId,
          targetBlockId: session.targetBlockId,
          targetIndex: session.targetIndex,
        }) as ShowBlockDraft[];
        blocksRef.current = next;
        return next;
      });
    }
    clearItemDrag();
  };

  const cancelItemDrag = () => {
    clearItemDrag();
  };

  const findBlockDragTargetIndex = (
    targetY: number,
    sourceBlockId: EntityId,
  ) => {
    const currentBlocks = blocksRef.current;
    const targetBlocks = currentBlocks.filter(({ id }) => id !== sourceBlockId);
    const targetEntry = targetBlocks
      .map((block) => {
        const originalIndex = currentBlocks.findIndex(
          ({ id }) => id === block.id,
        );
        return {
          block,
          layout: blockLayoutsRef.current.get(block.id) ?? {
            height: 120,
            y: originalIndex * 120,
          },
        };
      })
      .sort((left, right) => left.layout.y - right.layout.y)
      .find(({ layout }) => targetY < layout.y + layout.height / 2);

    return targetEntry
      ? targetBlocks.findIndex(({ id }) => id === targetEntry.block.id)
      : targetBlocks.length;
  };

  const updateDropTargetAfterScroll = (nextOffset: number) => {
    const itemSession = itemDragSessionRef.current;
    if (itemSession) {
      const destination = findItemDragDestination(
        itemSession.originCenterY +
          itemSession.lastDy +
          nextOffset -
          itemSession.originScrollOffset,
        itemSession.itemId,
      );
      if (destination) {
        itemSession.targetBlockId = destination.targetBlockId;
        itemSession.targetIndex = destination.targetIndex;
      }
      return;
    }

    const blockSession = blockDragSessionRef.current;
    if (blockSession) {
      blockSession.targetIndex = findBlockDragTargetIndex(
        blockSession.originCenterY +
          blockSession.lastDy +
          nextOffset -
          blockSession.originScrollOffset,
        blockSession.blockId,
      );
    }
  };

  const runAutoScrollFrame = (timestamp: number) => {
    autoScrollFrameRef.current = null;
    const velocity = autoScrollVelocityRef.current;
    if (velocity === 0) {
      autoScrollTimestampRef.current = null;
      return;
    }

    const previousTimestamp = autoScrollTimestampRef.current;
    const elapsed =
      previousTimestamp === null
        ? 16
        : Math.min(32, Math.max(0, timestamp - previousTimestamp));
    autoScrollTimestampRef.current = timestamp;
    const maxOffset = Math.max(
      0,
      scrollContentHeightRef.current - scrollViewportHeightRef.current,
    );
    const currentOffset = scrollOffsetYRef.current;
    const nextOffset = Math.max(
      0,
      Math.min(maxOffset, currentOffset + (velocity * elapsed) / 1000),
    );

    if (nextOffset === currentOffset) {
      autoScrollVelocityRef.current = 0;
      autoScrollTimestampRef.current = null;
      return;
    }

    scrollOffsetYRef.current = nextOffset;
    scrollViewRef.current?.scrollTo({ animated: false, y: nextOffset });
    updateDropTargetAfterScroll(nextOffset);
    autoScrollFrameRef.current = requestAnimationFrame(runAutoScrollFrame);
  };

  const stopAutoScroll = () => {
    autoScrollVelocityRef.current = 0;
    autoScrollTimestampRef.current = null;
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  };

  const updateAutoScrollVelocity = (
    previewTop: number,
    previewHeight: number,
  ) => {
    const viewportHeight = scrollViewportHeightRef.current;
    const contentHeight = scrollContentHeightRef.current;
    if (viewportHeight <= 0 || contentHeight <= viewportHeight) {
      stopAutoScroll();
      return;
    }

    const edgeSize = Math.min(72, viewportHeight * 0.2);
    const previewCenter = previewTop + previewHeight / 2;
    const viewportTop = scrollFrameYRef.current;
    const viewportBottom = viewportTop + viewportHeight;
    let velocity = 0;

    if (previewCenter < viewportTop + edgeSize) {
      const proximity = Math.min(
        1,
        (viewportTop + edgeSize - previewCenter) / edgeSize,
      );
      velocity = -Math.max(80, 440 * proximity);
    } else if (previewCenter > viewportBottom - edgeSize) {
      const proximity = Math.min(
        1,
        (previewCenter - (viewportBottom - edgeSize)) / edgeSize,
      );
      velocity = Math.max(80, 440 * proximity);
    }

    autoScrollVelocityRef.current = velocity;
    if (velocity !== 0 && autoScrollFrameRef.current === null) {
      autoScrollFrameRef.current = requestAnimationFrame(runAutoScrollFrame);
    } else if (velocity === 0) {
      stopAutoScroll();
    }
  };

  const startBlockDrag = (blockId: EntityId) => {
    setActiveBlockId(blockId);
    const block = blocksRef.current.find(({ id }) => id === blockId);
    const blockIndex = blocksRef.current.findIndex(({ id }) => id === blockId);
    if (!block || blockIndex < 0) return;
    const blockLayout =
      blockLayoutsRef.current.get(blockId) ??
      ({
        height: 120,
        y: blockIndex * 120,
      } satisfies BlockLayout);
    blockDragSessionRef.current = {
      blockId,
      originCenterY: blockLayout.y + blockLayout.height / 2,
      originScrollOffset: scrollOffsetYRef.current,
      originTopY: blockLayout.y,
      sourceIndex: blockIndex,
      lastDy: 0,
      targetIndex: blockIndex,
    };
    setDraggingBlockId(blockId);
    setDragPreview({
      height: blockLayout.height,
      icon: 'dragHandle',
      label: block.name,
      top: scrollFrameYRef.current + blockLayout.y - scrollOffsetYRef.current,
    });
  };

  const moveBlockDragPreview = (dy: number) => {
    const session = blockDragSessionRef.current;
    if (!session) return;
    session.lastDy = dy;
    const previewTop =
      scrollFrameYRef.current +
      session.originTopY -
      session.originScrollOffset +
      dy;
    setDragPreview((current) =>
      current ? { ...current, top: previewTop } : current,
    );
    session.targetIndex = findBlockDragTargetIndex(
      session.originCenterY +
        dy +
        scrollOffsetYRef.current -
        session.originScrollOffset,
      session.blockId,
    );
    updateAutoScrollVelocity(previewTop, dragPreview?.height ?? 120);
  };

  const clearBlockDrag = () => {
    stopAutoScroll();
    blockDragSessionRef.current = null;
    setDraggingBlockId(null);
    setDragPreview(null);
  };

  const finishBlockDrag = () => {
    const session = blockDragSessionRef.current;
    if (session) {
      setBlocks((current) => {
        const sourceIndex = current.findIndex(
          ({ id }) => id === session.blockId,
        );
        if (sourceIndex < 0 || sourceIndex === session.targetIndex) {
          return current;
        }
        const next = moveBlock(current, sourceIndex, session.targetIndex);
        blocksRef.current = next;
        return next;
      });
    }
    clearBlockDrag();
  };

  const cancelBlockDrag = () => {
    clearBlockDrag();
  };

  const requestDeleteBlock = (blockId: EntityId) => {
    if (blocks.length <= 1) return;
    setDeleteBlockId(blockId);
  };

  const deleteBlock = () => {
    if (!deleteBlockId || blocks.length <= 1) return;
    const remainingBlocks = blocks.filter(
      (block) => block.id !== deleteBlockId,
    );
    setBlocks(remainingBlocks);
    if (activeBlockId === deleteBlockId) {
      setActiveBlockId(remainingBlocks[0]?.id ?? '');
    }
    setDeleteBlockId(null);
  };

  const canSubmit =
    blocks.length > 0 &&
    blocks.every(
      (block) =>
        block.name.trim().length > 0 &&
        block.items.every((item) =>
          item.type === 'song'
            ? songById.has(item.songId)
            : item.type !== 'planning' || item.description.trim().length > 0,
        ),
    ) &&
    !isSubmitting;

  const content = (
    <>
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={fullScreen ? styles.screenLayer : styles.modalLayer}
      >
        {!fullScreen ? (
          <Pressable
            accessibilityLabel="Fechar edição da setlist tocando fora"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={requestClose}
            style={styles.scrim}
          />
        ) : null}
        <View
          accessibilityLiveRegion="polite"
          style={[styles.dialog, fullScreen && styles.screenDialog]}
          testID="show-block-editor-dialog"
        >
          {!fullScreen ? (
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <AppText accessibilityRole="header" variant="heading">
                  Editar setlist
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
          ) : null}
          <View style={styles.editorBody}>
            <View
              style={styles.totalDurationBar}
              testID="setlist-total-duration"
            >
              <AppText style={styles.totalDuration}>
                Tempo total:{' '}
                {durations.totalMs === null
                  ? 'Duração não informada'
                  : formatShowDuration(durations.totalMs)}
              </AppText>
            </View>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={(_, height) => {
                scrollContentHeightRef.current = height;
              }}
              onLayout={({ nativeEvent }) => {
                scrollFrameYRef.current = nativeEvent.layout.y;
                scrollViewportHeightRef.current = nativeEvent.layout.height;
              }}
              onScroll={({ nativeEvent }) => {
                scrollOffsetYRef.current = nativeEvent.contentOffset.y;
                updateDropTargetAfterScroll(nativeEvent.contentOffset.y);
              }}
              ref={scrollViewRef}
              scrollEventThrottle={16}
              testID="setlist-scroll-view"
              style={[styles.scroll, fullScreen && styles.screenScroll]}
            >
              {blocks.map((block, index) => (
                <BlockRow
                  block={block}
                  canDelete={blocks.length > 1}
                  dragging={draggingBlockId === block.id}
                  draggingItemId={draggingItem?.itemId ?? null}
                  durationMs={durations.blockDurations.get(block.id) ?? null}
                  index={index}
                  isActive={activeBlockId === block.id}
                  key={block.id}
                  onCancelBlockDrag={cancelBlockDrag}
                  onCancelItemDrag={cancelItemDrag}
                  onChangeItem={(itemId, updater) =>
                    updateItem(block.id, itemId, updater)
                  }
                  onChangeName={(name) =>
                    updateBlock(block.id, (current) => ({ ...current, name }))
                  }
                  onDelete={() => requestDeleteBlock(block.id)}
                  onEndBlockDrag={finishBlockDrag}
                  onEndItemDrag={finishItemDrag}
                  onMoveBlockDrag={moveBlockDragPreview}
                  onMoveItemDrag={moveItemDrag}
                  onRegisterBlockLayout={registerBlockLayout}
                  onRegisterItemLayout={registerItemLayout}
                  onRemoveItem={(itemId) => removeItem(block.id, itemId)}
                  onSelect={() => setActiveBlockId(block.id)}
                  onStartBlockDrag={startBlockDrag}
                  onStartItemDrag={startItemDrag}
                  songById={songById}
                />
              ))}
              {errorMessage ? (
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}
            </ScrollView>
            {dragPreview ? (
              <View
                pointerEvents="none"
                style={[
                  styles.dragPreview,
                  { height: dragPreview.height, top: dragPreview.top },
                ]}
                testID="setlist-drag-preview"
              >
                <AppIcon
                  color={colors.violet}
                  name={dragPreview.icon}
                  size={18}
                />
                <AppText numberOfLines={1} style={styles.dragPreviewLabel}>
                  {dragPreview.label}
                </AppText>
              </View>
            ) : null}
          </View>
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
        <OptionSheet
          closeAccessibilityLabel="Cancelar exclusão do bloco"
          label="Excluir bloco"
          onClose={() => setDeleteBlockId(null)}
          testID="show-block-editor-delete-block-sheet"
          visible={deleteBlockId !== null}
        >
          <AppText tone="muted">
            {blockToDelete
              ? `“${blockToDelete.name}” e seus itens serão removidos da setlist quando você salvar.`
              : 'Este bloco não está mais disponível.'}
          </AppText>
          <AppButton
            label="Cancelar"
            onPress={() => setDeleteBlockId(null)}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Confirmar exclusão do bloco"
            disabled={!blockToDelete}
            icon="remove"
            label="Excluir bloco"
            onPress={deleteBlock}
          />
        </OptionSheet>
      </KeyboardAvoidingView>
      <OptionSheet
        closeAccessibilityLabel="Fechar opções de inclusão"
        label="Adicionar à setlist"
        onClose={() => onAddSheetVisibilityChange(false)}
        showCloseButton
        visible={addSheetVisible}
      >
        <AppText tone="muted">
          Os itens entram em “{activeBlock?.name ?? 'nenhum bloco'}”.
        </AppText>
        <View style={styles.optionList}>
          <AppButton
            accessibilityLabel="Adicionar músicas"
            icon="musicAdd"
            label="Adicionar músicas"
            onPress={() => {
              onAddSheetVisibilityChange(false);
              setSelectedSongIds([]);
              setSongSearchText('');
              setSongSheetVisible(true);
            }}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Adicionar anotação"
            icon="planning"
            label="Adicionar anotação"
            onPress={addPlanning}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Adicionar separador"
            icon="remove"
            label="Adicionar separador"
            onPress={addSeparator}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Adicionar bloco"
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
          setSongSearchText('');
          setSongSheetVisible(false);
        }}
        showCloseButton
        sheetStyle={styles.songPickerSheet}
        testID="show-song-picker-sheet"
        visible={songSheetVisible}
      >
        <View style={styles.songPickerControls}>
          <View style={styles.songPickerSearch}>
            <SearchField
              accessibilityLabel="Filtrar músicas para a setlist"
              onChangeText={setSongSearchText}
              placeholder="Buscar música ou artista"
              value={songSearchText}
            />
          </View>
          <AppButton
            disabled={selectedSongIds.length === 0}
            icon="check"
            label="Adicionar"
            onPress={addSelectedSongs}
            style={styles.songPickerAddButton}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.songOptions}
          testID="show-song-picker-scroll"
          keyboardShouldPersistTaps="handled"
          style={styles.songPickerScroll}
        >
          {songs.length === 0 ? (
            <AppText tone="muted">
              Nenhuma música ativa para incluir neste repertório.
            </AppText>
          ) : filteredSongs.length === 0 ? (
            <AppText tone="muted">
              Nenhuma música encontrada para esse filtro.
            </AppText>
          ) : (
            filteredSongs.map((song) => {
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
                  <View style={styles.songOptionMeta}>
                    <AppText numberOfLines={1} tone="muted" variant="caption">
                      {formatSongDuration(song.estimatedDurationMs)}
                    </AppText>
                    {selected ? (
                      <AppIcon color={colors.violet} name="check" size={18} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </OptionSheet>
    </>
  );

  return fullScreen ? (
    <View style={styles.screenRoot}>{content}</View>
  ) : (
    <Modal
      animationType="fade"
      onRequestClose={requestClose}
      transparent
      visible={visible}
    >
      {content}
    </Modal>
  );
}

function BlockRow({
  block,
  canDelete,
  dragging,
  draggingItemId,
  durationMs,
  index,
  isActive,
  onCancelBlockDrag,
  onCancelItemDrag,
  onChangeItem,
  onChangeName,
  onDelete,
  onEndBlockDrag,
  onEndItemDrag,
  onMoveBlockDrag,
  onMoveItemDrag,
  onRegisterBlockLayout,
  onRegisterItemLayout,
  onRemoveItem,
  onSelect,
  onStartBlockDrag,
  onStartItemDrag,
  songById,
}: {
  readonly block: ShowBlockDraft;
  readonly canDelete: boolean;
  readonly dragging: boolean;
  readonly draggingItemId: EntityId | null;
  readonly durationMs: number | null;
  readonly index: number;
  readonly isActive: boolean;
  readonly onCancelBlockDrag: () => void;
  readonly onCancelItemDrag: () => void;
  readonly onChangeItem: (
    itemId: EntityId,
    updater: (item: ShowSetlistItemDraft) => ShowSetlistItemDraft,
  ) => void;
  readonly onChangeName: (name: string) => void;
  readonly onDelete: () => void;
  readonly onEndBlockDrag: () => void;
  readonly onEndItemDrag: () => void;
  readonly onMoveBlockDrag: (dy: number) => void;
  readonly onMoveItemDrag: (dy: number) => void;
  readonly onRegisterBlockLayout: (
    blockId: EntityId,
    layout: BlockLayout,
  ) => void;
  readonly onRegisterItemLayout: (
    blockId: EntityId,
    itemId: EntityId,
    localY: number,
    height: number,
  ) => void;
  readonly onRemoveItem: (itemId: EntityId) => void;
  readonly onSelect: () => void;
  readonly onStartBlockDrag: (blockId: EntityId) => void;
  readonly onStartItemDrag: (blockId: EntityId, itemId: EntityId) => void;
  readonly songById: ReadonlyMap<string, Song>;
}) {
  const panResponder = useBlockPanResponder({
    blockId: block.id,
    onCancelDrag: onCancelBlockDrag,
    onEndDrag: onEndBlockDrag,
    onMoveDrag: onMoveBlockDrag,
    onStartDrag: onStartBlockDrag,
  });
  return (
    <View
      onStartShouldSetResponderCapture={() => {
        onSelect();
        return false;
      }}
      onLayout={({ nativeEvent }) =>
        onRegisterBlockLayout(block.id, {
          height: nativeEvent.layout.height,
          y: nativeEvent.layout.y,
        })
      }
      style={[styles.blockCard, isActive && styles.activeBlockCard]}
      testID={'setlist-block-' + block.id}
    >
      <View style={styles.blockHeader}>
        <Pressable
          accessibilityLabel={'Excluir bloco ' + block.name}
          accessibilityRole="button"
          disabled={!canDelete}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.iconButton,
            !canDelete && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.violet} name="remove" size={17} />
        </Pressable>
        <View style={styles.blockSelect}>
          <View style={styles.blockTitleRow}>
            <AppIcon color={colors.violet} name="block" size={18} />
            <TextInput
              accessibilityLabel={'Nome do bloco ' + (index + 1)}
              onChangeText={onChangeName}
              onFocus={onSelect}
              placeholder="Nome do bloco"
              placeholderTextColor={colors.muted}
              style={[styles.blockNameInput, styles.blockNameField]}
              value={block.name}
            />
          </View>
          <AppText tone="muted" variant="caption">
            {durationMs === null
              ? 'Duração não informada'
              : formatShowDuration(durationMs)}
          </AppText>
        </View>
        <View
          accessible
          accessibilityLabel={'Alça para mover o bloco ' + block.name}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          onTouchStart={onSelect}
          testID={'block-drag-handle-' + block.id}
          style={styles.dragHandleTouchTarget}
          {...panResponder}
        >
          <View style={[styles.dragHandle, styles.dragIconHitTest]}>
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
            blockId={block.id}
            dragging={draggingItemId === item.id}
            index={itemIndex}
            item={item}
            key={item.id}
            onCancelDrag={onCancelItemDrag}
            onChange={(updater) => onChangeItem(item.id, updater)}
            onEndDrag={onEndItemDrag}
            onMoveDrag={onMoveItemDrag}
            onRegisterLayout={(itemId, localY, height) =>
              onRegisterItemLayout(block.id, itemId, localY, height)
            }
            onRemove={() => onRemoveItem(item.id)}
            onStartDrag={onStartItemDrag}
            song={item.type === 'song' ? songById.get(item.songId) : undefined}
          />
        ))
      )}
    </View>
  );
}

function SetlistItemRow({
  blockId,
  dragging,
  index,
  item,
  onCancelDrag,
  onChange,
  onEndDrag,
  onMoveDrag,
  onRegisterLayout,
  onRemove,
  onStartDrag,
  song,
}: {
  readonly blockId: EntityId;
  readonly dragging: boolean;
  readonly index: number;
  readonly item: ShowSetlistItemDraft;
  readonly onCancelDrag: () => void;
  readonly onChange: (
    updater: (item: ShowSetlistItemDraft) => ShowSetlistItemDraft,
  ) => void;
  readonly onEndDrag: () => void;
  readonly onMoveDrag: (dy: number) => void;
  readonly onRegisterLayout: (
    itemId: EntityId,
    localY: number,
    height: number,
  ) => void;
  readonly onRemove: () => void;
  readonly onStartDrag: (blockId: EntityId, itemId: EntityId) => void;
  readonly song?: Song;
}) {
  const panResponder = useItemPanResponder({
    blockId,
    itemId: item.id,
    onCancelDrag,
    onEndDrag,
    onMoveDrag,
    onStartDrag,
  });
  const rowStyle = [styles.itemRow, dragging && styles.draggingItemRow];

  if (item.type === 'separator') {
    return (
      <View
        onLayout={({ nativeEvent }) =>
          onRegisterLayout(
            item.id,
            nativeEvent.layout.y,
            nativeEvent.layout.height,
          )
        }
        style={rowStyle}
        testID={'setlist-item-row-' + item.id}
      >
        <ItemRemoveButton
          itemLabel={'separador ' + (index + 1)}
          onRemove={onRemove}
        />
        <View accessibilityLabel="Separador visual" style={styles.separator} />
        <ItemDragHandle
          dragging={dragging}
          itemId={item.id}
          itemLabel={'separador ' + (index + 1)}
          panHandlers={panResponder}
        />
      </View>
    );
  }

  if (item.type === 'planning') {
    const parts = getDurationParts(item.estimatedDurationMs);
    return (
      <View
        onLayout={({ nativeEvent }) =>
          onRegisterLayout(
            item.id,
            nativeEvent.layout.y,
            nativeEvent.layout.height,
          )
        }
        style={[...rowStyle, styles.planningRow]}
        testID={'setlist-item-row-' + item.id}
      >
        <View style={styles.planningMainRow}>
          <ItemRemoveButton
            itemLabel={'planejamento ' + (index + 1)}
            onRemove={onRemove}
          />
          <View style={[styles.itemContent, styles.planningItemContent]}>
            <AppIcon color={colors.violet} name="planning" size={16} />
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
              style={[styles.input, styles.planningDescription]}
              value={item.description}
            />
          </View>
          <ItemDragHandle
            dragging={dragging}
            itemId={item.id}
            itemLabel={'planejamento ' + (index + 1)}
            panHandlers={panResponder}
          />
        </View>
        <View style={styles.planningDuration}>
          <AppText tone="muted" variant="caption">
            Duração
          </AppText>
          <View
            style={styles.durationRow}
            testID={'setlist-duration-controls-' + item.id}
          >
            <View style={styles.durationPart}>
              <SpinButton
                accessibilityLabel={'Horas do planejamento ' + (index + 1)}
                max={99}
                maxLength={2}
                minWidth={76}
                onChangeText={(hours) =>
                  onChange((current) =>
                    current.type === 'planning'
                      ? {
                          ...current,
                          estimatedDurationMs: toDurationMs(
                            hours,
                            getDurationParts(current.estimatedDurationMs)
                              .minutes,
                            getDurationParts(current.estimatedDurationMs)
                              .seconds,
                          ),
                        }
                      : current,
                  )
                }
                value={parts.hours}
              />
              <AppText
                style={styles.durationUnit}
                tone="muted"
                variant="caption"
              >
                h
              </AppText>
            </View>
            <View style={[styles.durationPart, styles.durationMinutesPart]}>
              <SpinButton
                accessibilityLabel={'Minutos do planejamento ' + (index + 1)}
                max={59}
                maxLength={2}
                minWidth={76}
                onChangeText={(minutes) =>
                  onChange((current) =>
                    current.type === 'planning'
                      ? {
                          ...current,
                          estimatedDurationMs: toDurationMs(
                            getDurationParts(current.estimatedDurationMs).hours,
                            minutes,
                            getDurationParts(current.estimatedDurationMs)
                              .seconds,
                          ),
                        }
                      : current,
                  )
                }
                value={parts.minutes}
              />
              <AppText
                style={styles.durationUnit}
                tone="muted"
                variant="caption"
              >
                min
              </AppText>
            </View>
            <View style={styles.durationPart}>
              <SpinButton
                accessibilityLabel={'Segundos do planejamento ' + (index + 1)}
                max={59}
                maxLength={2}
                minWidth={76}
                onChangeText={(seconds) =>
                  onChange((current) =>
                    current.type === 'planning'
                      ? {
                          ...current,
                          estimatedDurationMs: toDurationMs(
                            getDurationParts(current.estimatedDurationMs).hours,
                            getDurationParts(current.estimatedDurationMs)
                              .minutes,
                            seconds,
                          ),
                        }
                      : current,
                  )
                }
                value={parts.seconds}
              />
              <AppText
                style={styles.durationUnit}
                tone="muted"
                variant="caption"
              >
                s
              </AppText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      onLayout={({ nativeEvent }) =>
        onRegisterLayout(
          item.id,
          nativeEvent.layout.y,
          nativeEvent.layout.height,
        )
      }
      style={rowStyle}
      testID={'setlist-item-row-' + item.id}
    >
      <ItemRemoveButton
        itemLabel={'música ' + (index + 1)}
        onRemove={onRemove}
      />
      <View style={styles.itemContent}>
        <AppIcon color={colors.violet} name="music" size={16} />
        <View style={styles.itemFields}>
          <AppText>{song?.title ?? 'Música indisponível'}</AppText>
          {song?.originalArtist ? (
            <AppText tone="muted" variant="caption">
              {song.originalArtist}
            </AppText>
          ) : null}
          <AppText tone="muted" variant="caption">
            Duração · {formatSongDuration(song?.estimatedDurationMs ?? null)}
          </AppText>
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
      </View>
      <ItemDragHandle
        dragging={dragging}
        itemId={item.id}
        itemLabel={'música ' + (index + 1)}
        panHandlers={panResponder}
      />
    </View>
  );
}

function ItemRemoveButton({
  itemLabel,
  onRemove,
}: {
  readonly itemLabel: string;
  readonly onRemove: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={'Remover ' + itemLabel}
      accessibilityRole="button"
      hitSlop={spacing.xs}
      onPress={onRemove}
      style={({ pressed }) => [
        styles.itemRemoveButton,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon color={colors.violet} name="remove" size={17} />
    </Pressable>
  );
}

function ItemDragHandle({
  dragging,
  itemId,
  itemLabel,
  panHandlers,
}: {
  readonly dragging: boolean;
  readonly itemId: EntityId;
  readonly itemLabel: string;
  readonly panHandlers: PanResponderInstance['panHandlers'];
}) {
  return (
    <View
      accessible
      accessibilityLabel={'Arrastar ' + itemLabel}
      accessibilityRole="button"
      hitSlop={spacing.xs}
      testID={'item-drag-handle-' + itemId}
      {...panHandlers}
      style={[styles.itemDragButton, dragging && styles.draggingHandle]}
    >
      <View style={styles.dragIconHitTest}>
        <AppIcon
          color={dragging ? colors.violet : colors.muted}
          name="dragHandle"
          size={18}
        />
      </View>
    </View>
  );
}

interface StablePanResponderCallbacks {
  readonly onCancelDrag: () => void;
  readonly onEndDrag: () => void;
  readonly onMoveDrag: (dy: number) => void;
  readonly onStartDrag: () => void;
}

class StablePanResponder {
  private callbacks: StablePanResponderCallbacks;
  private dragStarted = false;
  readonly panHandlers: PanResponderInstance['panHandlers'];

  constructor(callbacks: StablePanResponderCallbacks) {
    this.callbacks = callbacks;
    this.panHandlers = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => this.beginDrag(),
      onPanResponderMove: (_, gesture) => this.callbacks.onMoveDrag(gesture.dy),
      onPanResponderRelease: () => this.finishDrag(false),
      onPanResponderTerminate: () => this.finishDrag(true),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
    }).panHandlers;
  }

  updateCallbacks(callbacks: StablePanResponderCallbacks) {
    this.callbacks = callbacks;
  }

  private beginDrag() {
    if (this.dragStarted) return;
    this.dragStarted = true;
    this.callbacks.onStartDrag();
  }

  private finishDrag(cancelled: boolean) {
    if (!this.dragStarted) return;
    this.dragStarted = false;
    if (cancelled) {
      this.callbacks.onCancelDrag();
      return;
    }
    this.callbacks.onEndDrag();
  }
}

function useStablePanResponder(callbacks: StablePanResponderCallbacks) {
  const [responder] = useState(() => new StablePanResponder(callbacks));
  useLayoutEffect(() => {
    responder.updateCallbacks(callbacks);
  }, [callbacks, responder]);
  return responder.panHandlers;
}

function useItemPanResponder(callbacks: ItemPanResponderCallbacks) {
  return useStablePanResponder({
    onCancelDrag: callbacks.onCancelDrag,
    onEndDrag: callbacks.onEndDrag,
    onMoveDrag: callbacks.onMoveDrag,
    onStartDrag: () =>
      callbacks.onStartDrag(callbacks.blockId, callbacks.itemId),
  });
}

interface ItemPanResponderCallbacks {
  readonly blockId: EntityId;
  readonly itemId: EntityId;
  readonly onCancelDrag: () => void;
  readonly onEndDrag: () => void;
  readonly onMoveDrag: (dy: number) => void;
  readonly onStartDrag: (blockId: EntityId, itemId: EntityId) => void;
}

interface BlockPanResponderCallbacks {
  readonly blockId: EntityId;
  readonly onCancelDrag: () => void;
  readonly onEndDrag: () => void;
  readonly onMoveDrag: (dy: number) => void;
  readonly onStartDrag: (blockId: EntityId) => void;
}

function useBlockPanResponder(callbacks: BlockPanResponderCallbacks) {
  return useStablePanResponder({
    onCancelDrag: callbacks.onCancelDrag,
    onEndDrag: callbacks.onEndDrag,
    onMoveDrag: callbacks.onMoveDrag,
    onStartDrag: () => callbacks.onStartDrag(callbacks.blockId),
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
  blockTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  blockNameField: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  content: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    boxShadow: '0px 4px 16px rgba(23, 32, 51, 0.18)',
    elevation: 8,
    maxHeight: '92%',
    maxWidth: 720,
    overflow: 'hidden',
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
  draggingHandle: {
    backgroundColor: colors.violetSoft,
  },
  draggingItemRow: {
    borderColor: colors.violet,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: spacing.xs,
  },
  dragPreview: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.violet,
    borderRadius: radii.md,
    borderWidth: 2,
    boxShadow: '0px 4px 8px rgba(23, 32, 51, 0.18)',
    elevation: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.xl,
    opacity: 0.94,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: spacing.xl,
    pointerEvents: 'none',
    zIndex: 20,
  },
  dragPreviewLabel: {
    flex: 1,
    minWidth: 0,
  },
  dragIconHitTest: {
    pointerEvents: 'none',
  },
  dragHandleTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    width: layout.minimumTouchTarget,
  },
  disabled: {
    opacity: 0.45,
  },
  durationRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 2,
    width: '100%',
  },
  durationPart: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 2,
    minWidth: 0,
  },
  durationMinutesPart: {
    flex: 1.2,
  },
  durationUnit: {
    flexShrink: 0,
  },
  editorBody: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  modalBody: {
    position: 'relative',
  },
  totalDurationBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  totalDuration: {
    fontSize: 16,
    fontWeight: '700',
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
  itemContent: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  itemDragButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  itemRemoveButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
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
    alignItems: 'stretch',
    borderRadius: radii.md,
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
  },
  planningMainRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  planningItemContent: {
    gap: spacing.xs,
  },
  planningDescription: {
    flex: 1,
    minWidth: 0,
  },
  planningDuration: {
    gap: spacing.xs,
  },
  pressed: { opacity: 0.72 },
  scrim: { ...StyleSheet.absoluteFill },
  screenDialog: {
    alignSelf: 'stretch',
    borderRadius: 0,
    flex: 1,
    elevation: 0,
    minHeight: 0,
    maxHeight: '100%',
    maxWidth: layout.contentMaxWidth,
    boxShadow: 'none',
    width: '100%',
  },
  screenLayer: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  screenRoot: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: layout.contentMaxWidth,
    minHeight: 0,
    width: '100%',
  },
  screenScroll: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
  },
  scroll: { flexGrow: 0 },
  separator: {
    alignSelf: 'center',
    borderTopColor: colors.violet,
    borderTopWidth: 2,
    flex: 1,
    marginVertical: spacing.sm,
    opacity: 0.42,
  },
  songPickerControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  songPickerSheet: {
    height: 520,
    maxHeight: '90%',
    minHeight: 0,
  },
  songPickerSearch: {
    flex: 1,
    minWidth: 0,
  },
  songPickerAddButton: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
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
    minWidth: 0,
  },
  songOptionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  songOptionSelected: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
  },
  songOptions: { gap: spacing.sm, paddingBottom: spacing.md },
  songPickerScroll: { flex: 1, minHeight: 0 },
});
