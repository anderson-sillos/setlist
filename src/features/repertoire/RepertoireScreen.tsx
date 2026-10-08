import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  TemporaryFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ContentFade } from '@/components/ui/ContentFade';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  getListRefreshControl,
  WebRefreshButton,
} from '@/components/ui/ScreenDataRefresh';
import { ListControlsOverlay } from '@/components/ui/ListControlsOverlay';
import {
  ChoiceChips,
  FilterMenu,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import {
  MenuButton,
  OptionSheet,
} from '@/components/ui/list-controls/OptionSheet';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  useAppendRepertoireCollectionSongs,
  useRepertoireCollections,
  useSongs,
  useUserBands,
} from '@/data/queries';
import type { EntityId, Song } from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getRepertoireCollectionCreateHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionsHref,
  getSongCreateHref,
  getSongEditHref,
  getSongLyricsHref,
  getSongHref,
} from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useScrollDirectionVisibility } from '@/hooks/useScrollDirectionVisibility';
import {
  getContentHorizontalPadding,
  getNavigationPresentation,
} from '@/theme/responsive';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatSongDuration } from '@/utils/duration';
import { blurWebFocus } from '@/utils/focus';
import {
  filterAndSortRepertoireSongs,
  repertoireFilters,
  repertoireSorts,
  type RepertoireFilter,
  type RepertoireSort,
} from './repertoireQuery';
import {
  lyricStatusIcons,
  lyricStatusLabels,
  lyricStatusTones,
} from './songPresentation';
import {
  RepertoireActionMenu,
  useRepertoireActionMenu,
  type RepertoireAction,
} from './RepertoireActionMenu';
import { SongCollectionMembershipDialog } from './SongCollectionMembershipDialog';
import { useSongCollectionMembership } from './useSongCollectionMembership';

interface SongRowProps {
  readonly bandId: EntityId;
  readonly onOpenActions: (song: Song) => void;
  readonly onSelectSong?: (songId: EntityId) => void;
  readonly onToggleSelection: (songId: EntityId) => void;
  readonly selected: boolean;
  readonly selectionMode: boolean;
  readonly song: Song;
}

interface RepertoireSelectionState {
  readonly active: boolean;
  readonly bandId: EntityId;
  readonly selectedSongIds: ReadonlySet<EntityId>;
}

interface RepertoireScreenProps extends BandSectionScreenProps {
  readonly initialAppendCollectionId?: EntityId;
  readonly initialCollectionId?: EntityId;
}

type RepertoireCollectionFilter = 'all' | 'none' | 'removed' | EntityId;

function emptySelectionState(bandId: EntityId): RepertoireSelectionState {
  return { active: false, bandId, selectedSongIds: new Set() };
}

function SongRow({
  bandId,
  onOpenActions,
  onSelectSong,
  onToggleSelection,
  selected,
  selectionMode,
  song,
}: SongRowProps) {
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const singleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressLinkPress = useRef(false);
  const suppressLinkPressTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cancelPendingClick = () => {
    if (singleClickTimer.current === null) return;
    clearTimeout(singleClickTimer.current);
    singleClickTimer.current = null;
  };
  useEffect(
    () => () => {
      cancelPendingClick();
      if (suppressLinkPressTimer.current !== null) {
        clearTimeout(suppressLinkPressTimer.current);
      }
    },
    [],
  );
  const handleSongPress = (
    event: GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement>,
  ) => {
    if (suppressLinkPress.current) {
      suppressLinkPress.current = false;
      if (suppressLinkPressTimer.current !== null) {
        clearTimeout(suppressLinkPressTimer.current);
        suppressLinkPressTimer.current = null;
      }
      event.preventDefault();
      return;
    }
    blurWebFocus();
    if (Platform.OS !== 'web' || song.lyricStatus === 'missing') return;

    const mouseEvent = event as unknown as {
      altKey?: boolean;
      button?: number;
      ctrlKey?: boolean;
      detail?: number;
      metaKey?: boolean;
      nativeEvent?: {
        altKey?: boolean;
        button?: number;
        ctrlKey?: boolean;
        detail?: number;
        metaKey?: boolean;
        shiftKey?: boolean;
      };
      shiftKey?: boolean;
    };
    const nativeEvent = mouseEvent.nativeEvent;
    const clickDetail = mouseEvent.detail || nativeEvent?.detail || 0;
    const button = mouseEvent.button ?? nativeEvent?.button;
    const modifiedClick =
      mouseEvent.altKey ||
      mouseEvent.ctrlKey ||
      mouseEvent.metaKey ||
      mouseEvent.shiftKey ||
      nativeEvent?.altKey ||
      nativeEvent?.ctrlKey ||
      nativeEvent?.metaKey ||
      nativeEvent?.shiftKey;

    if (
      clickDetail < 1 ||
      (button !== undefined && button !== 0) ||
      modifiedClick
    )
      return;

    event.preventDefault();
    if (singleClickTimer.current !== null) {
      cancelPendingClick();
      router.push(getSongLyricsHref(bandId, song.id));
      return;
    }

    singleClickTimer.current = setTimeout(() => {
      singleClickTimer.current = null;
      router.push(getSongHref(bandId, song.id));
    }, 320);
  };
  const handleSongLongPress = () => {
    if (selectionMode || !onSelectSong) return;
    cancelPendingClick();
    suppressLinkPress.current = true;
    blurWebFocus();
    onSelectSong(song.id);
  };

  const row = (
    <Pressable
      accessibilityLabel={
        selectionMode
          ? `${selected ? 'Remover seleção de' : 'Selecionar'} ${song.title}`
          : `Abrir música ${song.title}. Status da letra: ${lyricStatusLabels[song.lyricStatus]}`
      }
      accessibilityHint={
        !selectionMode && onSelectSong
          ? 'Mantenha pressionado para iniciar a seleção de músicas'
          : undefined
      }
      accessibilityRole={selectionMode ? 'checkbox' : 'link'}
      accessibilityState={selectionMode ? { checked: selected } : undefined}
      onLongPress={
        selectionMode || !onSelectSong ? undefined : handleSongLongPress
      }
      onPress={
        selectionMode
          ? () => {
              if (suppressLinkPress.current) {
                suppressLinkPress.current = false;
                if (suppressLinkPressTimer.current !== null) {
                  clearTimeout(suppressLinkPressTimer.current);
                  suppressLinkPressTimer.current = null;
                }
                return;
              }
              onToggleSelection(song.id);
            }
          : undefined
      }
      onPressIn={() => setPressed(true)}
      onPressOut={() => {
        setPressed(false);
        if (suppressLinkPress.current) {
          suppressLinkPressTimer.current = setTimeout(() => {
            suppressLinkPress.current = false;
            suppressLinkPressTimer.current = null;
          }, 250);
        }
      }}
      style={StyleSheet.flatten([
        styles.listRow,
        selected && selectionMode && styles.selectedListRow,
        pressed && styles.pressed,
      ])}
    >
      <View
        style={[
          styles.rowLayout,
          !selectionMode && styles.rowLayoutWithActions,
        ]}
      >
        <View style={styles.rowPrimaryContent}>
          <View style={styles.rowLeadingIcon}>
            <AppIcon color={colors.text.secondary} name="music" size={40} />
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTitleLine}>
              <AppText style={styles.rowTitle} variant="heading">
                {song.title}
              </AppText>
              <StatusPill
                accessible={false}
                accessibilityLabel={`Status da letra: ${lyricStatusLabels[song.lyricStatus]}`}
                icon={lyricStatusIcons[song.lyricStatus]}
                tone={lyricStatusTones[song.lyricStatus]}
              />
            </View>
            <View style={styles.rowMetaLine}>
              <AppText numberOfLines={1} style={styles.rowArtist} tone="muted">
                {song.originalArtist ?? 'Artista/Banda não informado'}
              </AppText>
              <View
                accessibilityLabel={`Duração ${
                  song.estimatedDurationMs === null
                    ? 'não informada'
                    : formatSongDuration(song.estimatedDurationMs)
                }`}
                style={styles.durationMeta}
              >
                <AppIcon
                  color={colors.text.secondary}
                  name="duration"
                  size={12}
                />
                <AppText style={styles.durationValue} tone="accent">
                  {song.estimatedDurationMs === null
                    ? '—'
                    : formatSongDuration(song.estimatedDurationMs)}
                </AppText>
              </View>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.rowNavigation,
            !selectionMode && styles.rowActionsSpace,
          ]}
        >
          {selectionMode ? (
            <View
              style={[
                styles.selectionIndicator,
                selected && styles.selectionIndicatorSelected,
              ]}
            >
              {selected ? (
                <AppIcon color={colors.text.onAccent} name="check" size={14} />
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.rowFrame}>
      {selectionMode ? (
        row
      ) : (
        <Link
          href={getSongHref(bandId, song.id)}
          onPress={handleSongPress}
          asChild
        >
          {row}
        </Link>
      )}
      {!selectionMode ? (
        <Pressable
          accessibilityLabel={`Ações da música ${song.title}`}
          accessibilityRole="button"
          onPress={() => {
            cancelPendingClick();
            blurWebFocus();
            onOpenActions(song);
          }}
          style={({ pressed }) => [
            styles.songActionsButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="moreVertical" size={24} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function RepertoireScreen({
  bandId,
  initialAppendCollectionId,
  initialCollectionId,
  viewportHeight,
  viewportWidth,
}: RepertoireScreenProps) {
  return (
    <RepertoireScreenContent
      key={bandId}
      bandId={bandId}
      initialAppendCollectionId={initialAppendCollectionId}
      initialCollectionId={initialCollectionId}
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    />
  );
}

function RepertoireScreenContent({
  bandId,
  initialAppendCollectionId,
  initialCollectionId,
  viewportHeight,
  viewportWidth,
}: RepertoireScreenProps) {
  const window = useWindowDimensions();
  const usesBottomNavigation =
    getNavigationPresentation(
      viewportWidth ?? window.width,
      viewportHeight ?? window.height,
    ) === 'bottom-tabs';
  const horizontalPadding = getContentHorizontalPadding(
    viewportWidth ?? window.width,
  );
  const router = useRouter();
  const songsQuery = useSongs(bandId, true);
  const collectionsQuery = useRepertoireCollections(bandId);
  const userBandsQuery = useUserBands();
  const appendSongs = useAppendRepertoireCollectionSongs(bandId);
  const appendLock = useRef(false);
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionsQuery,
    songsQuery,
    userBandsQuery,
  ]);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'repertoire', {
      collection: 'all' as RepertoireCollectionFilter,
      filter: 'all' as RepertoireFilter,
      search: '',
      sort: 'title' as RepertoireSort,
    });
  const appliedRouteCollectionId = useRef<EntityId | null>(null);
  const [controlsOverlayHeight, setControlsOverlayHeight] = useState(
    spacing.sm * 3 + layout.minimumTouchTarget * 2 + 1,
  );
  const [selectionState, setSelectionState] =
    useState<RepertoireSelectionState>(() => ({
      ...emptySelectionState(bandId),
      active: Boolean(initialAppendCollectionId),
    }));
  const appliedAppendRoute = useRef<EntityId | null>(null);
  useEffect(() => {
    if (
      !initialAppendCollectionId ||
      appliedAppendRoute.current === initialAppendCollectionId
    )
      return;
    appliedAppendRoute.current = initialAppendCollectionId;
    setSelectionState({ ...emptySelectionState(bandId), active: true });
    update('collection', 'all');
  }, [bandId, initialAppendCollectionId, update]);
  const [collectionPickerVisible, setCollectionPickerVisible] = useState(false);
  const pendingCollectionPickerAction = useRef<(() => void) | null>(null);
  const finishCollectionPickerDismissal = useCallback(() => {
    const action = pendingCollectionPickerAction.current;
    pendingCollectionPickerAction.current = null;
    action?.();
  }, []);
  useEffect(() => {
    if (collectionPickerVisible || Platform.OS === 'ios') return;
    finishCollectionPickerDismissal();
  }, [collectionPickerVisible, finishCollectionPickerDismissal]);
  const [targetCollectionId, setTargetCollectionId] = useState<EntityId | null>(
    null,
  );
  const [appendError, setAppendError] = useState<string | null>(null);
  const [appendFeedbackMessage, setAppendFeedbackMessage] = useState<
    string | null
  >(null);
  const dismissAppendFeedback = useCallback(
    () => setAppendFeedbackMessage(null),
    [],
  );
  const currentSelectionState =
    selectionState.bandId === bandId
      ? selectionState
      : emptySelectionState(bandId);
  const { active: selectionMode, selectedSongIds } = currentSelectionState;
  const collectionFilter =
    (collectionsQuery.isError && collectionsQuery.data === undefined) ||
    state.collection === 'removed'
      ? 'all'
      : state.collection;
  const collectionFilterOptions = useMemo(
    () => [
      { label: 'Todas as coleções', value: 'all' },
      { label: 'Sem coleção', value: 'none' },
      ...(collectionsQuery.data ?? []).map(({ collection }) => ({
        label: collection.name,
        value: collection.id,
      })),
    ],
    [collectionsQuery.data],
  );
  const collectionSongIds = useMemo<ReadonlySet<EntityId> | null>(() => {
    if (collectionFilter === 'all') return null;

    const summaries = collectionsQuery.data ?? [];
    if (collectionFilter === 'none') {
      const linkedSongIds = new Set(
        summaries.flatMap(({ songs: collectionSongs }) =>
          collectionSongs.map(({ id }) => id),
        ),
      );
      return new Set(
        (songsQuery.data ?? [])
          .filter(({ id }) => !linkedSongIds.has(id))
          .map(({ id }) => id),
      );
    }

    const selectedCollection = summaries.find(
      ({ collection }) => collection.id === collectionFilter,
    );
    return new Set(selectedCollection?.songs.map(({ id }) => id) ?? []);
  }, [collectionFilter, collectionsQuery.data, songsQuery.data]);
  const filteredCollectionWasDeleted =
    collectionsQuery.isSuccess &&
    state.collection !== 'all' &&
    state.collection !== 'none' &&
    state.collection !== 'removed' &&
    !collectionsQuery.data.some(
      ({ collection }) => collection.id === state.collection,
    );
  useEffect(() => {
    if (!filteredCollectionWasDeleted) return;

    update('collection', 'removed');
  }, [filteredCollectionWasDeleted, update]);
  useEffect(() => {
    if (
      !initialCollectionId ||
      !collectionsQuery.isSuccess ||
      appliedRouteCollectionId.current === initialCollectionId ||
      !collectionsQuery.data.some(
        ({ collection }) => collection.id === initialCollectionId,
      )
    ) {
      return;
    }

    appliedRouteCollectionId.current = initialCollectionId;
    update('collection', initialCollectionId);
  }, [
    collectionsQuery.data,
    collectionsQuery.isSuccess,
    initialCollectionId,
    update,
  ]);
  const songs = useMemo(() => {
    return filterAndSortRepertoireSongs(
      songsQuery.data ?? [],
      state.search,
      state.filter,
      state.sort,
      collectionSongIds,
    );
  }, [collectionSongIds, songsQuery.data, state]);
  const hasQuery =
    state.search.length > 0 ||
    state.filter !== 'all' ||
    collectionFilter !== 'all';
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canCreate =
    membership?.role === 'owner' || membership?.role === 'editor';
  const activeSelectionMode = canCreate && selectionMode;
  const {
    beginDrag: beginControlsDrag,
    beginMomentum: beginControlsMomentum,
    endMomentum: endControlsMomentum,
    updateVisibility: updateControlsVisibility,
    visible: controlsVisible,
  } = useScrollDirectionVisibility(initialScrollOffset, !activeSelectionMode);
  const actionMenu = useRepertoireActionMenu();
  const collectionMembership = useSongCollectionMembership({
    bandId,
    canEdit: canCreate,
    collections: collectionsQuery.data ?? [],
  });
  const selectedSongCount = selectedSongIds.size;
  const targetCollection = collectionsQuery.data?.find(
    ({ collection }) => collection.id === targetCollectionId,
  );
  const targetCollectionSongIds = new Set(
    targetCollection?.songs.map(({ id }) => id) ?? [],
  );
  const alreadyPresentSongCount = Array.from(selectedSongIds).filter((songId) =>
    targetCollectionSongIds.has(songId),
  ).length;
  const newSelectedSongCount = selectedSongCount - alreadyPresentSongCount;
  const allVisibleSongsSelected =
    songs.length > 0 && songs.every(({ id }) => selectedSongIds.has(id));
  const hasRegisteredSongs = (songsQuery.data?.length ?? 0) > 0;
  const isFirstSongEmptyState = !hasQuery && !hasRegisteredSongs;
  const clearFilters = () => {
    update('search', '');
    update('filter', 'all');
    update('sort', 'title');
    update('collection', 'all');
  };
  const updateCollectionFilter = (value: RepertoireCollectionFilter) => {
    update('collection', value);
  };
  const updateSelectionState = (
    updateState: (
      current: RepertoireSelectionState,
    ) => RepertoireSelectionState,
  ) => {
    setSelectionState((current) =>
      updateState(
        current.bandId === bandId ? current : emptySelectionState(bandId),
      ),
    );
  };
  const toggleSongSelection = (songId: EntityId) => {
    updateSelectionState((current) => {
      const selected = new Set(current.selectedSongIds);
      if (selected.has(songId)) {
        selected.delete(songId);
      } else {
        selected.add(songId);
      }
      return { ...current, selectedSongIds: selected };
    });
  };
  const selectVisibleSongs = () => {
    updateSelectionState((current) => {
      const selected = new Set(current.selectedSongIds);
      songs.forEach(({ id }) => selected.add(id));
      return { ...current, selectedSongIds: selected };
    });
  };
  const cancelSongSelection = () => {
    updateSelectionState((current) => ({
      ...current,
      active: false,
      selectedSongIds: new Set(),
    }));
  };
  const beginSongSelection = () => {
    updateSelectionState((current) => ({ ...current, active: true }));
  };
  const selectSongAndBeginSelection = (songId: EntityId) => {
    updateSelectionState((current) => {
      const selectedSongIds = new Set(current.selectedSongIds);
      selectedSongIds.add(songId);
      return { ...current, active: true, selectedSongIds };
    });
  };
  const closeCollectionPicker = () => {
    if (appendLock.current) return;
    setCollectionPickerVisible(false);
    setTargetCollectionId(null);
    setAppendError(null);
  };
  const openCollectionPicker = () => {
    setTargetCollectionId(
      collectionsQuery.data?.find(
        ({ collection }) => collection.id === initialAppendCollectionId,
      )?.collection.id ?? null,
    );
    setAppendError(null);
    setAppendFeedbackMessage(null);
    setCollectionPickerVisible(true);
  };
  const createCollectionFromPicker = () => {
    if (appendLock.current || selectedSongCount === 0) return;
    const initialSongIds = Array.from(selectedSongIds);
    pendingCollectionPickerAction.current = () =>
      router.push(
        getRepertoireCollectionCreateHref(bandId, initialSongIds, true),
      );
    closeCollectionPicker();
    cancelSongSelection();
  };
  const appendSelectedSongs = async () => {
    if (!targetCollection || newSelectedSongCount === 0 || appendLock.current) {
      return;
    }

    appendLock.current = true;
    setAppendError(null);
    try {
      await appendSongs.mutateAsync({
        collectionId: targetCollection.collection.id,
        songIds: Array.from(selectedSongIds),
      });
      const addedCount = newSelectedSongCount;
      const alreadyPresentCount = alreadyPresentSongCount;
      const addedLabel = `${addedCount} ${addedCount === 1 ? 'música adicionada' : 'músicas adicionadas'} à coleção ${targetCollection.collection.name}.`;
      const alreadyPresentLabel =
        alreadyPresentCount > 0
          ? ` ${alreadyPresentCount} ${alreadyPresentCount === 1 ? 'já fazia parte' : 'já faziam parte'} da coleção.`
          : '';
      setAppendFeedbackMessage(`${addedLabel}${alreadyPresentLabel}`);
      const savedCollectionId = targetCollection.collection.id;
      pendingCollectionPickerAction.current = () =>
        router.push(
          getRepertoireCollectionEditHref(
            bandId,
            savedCollectionId,
            'repertoire',
          ),
        );
      setCollectionPickerVisible(false);
      setTargetCollectionId(null);
      setAppendError(null);
      updateSelectionState((current) => ({
        ...current,
        active: false,
        selectedSongIds: new Set(),
      }));
    } catch (error) {
      setAppendError(
        error instanceof RepertoireCollectionError
          ? error.message
          : 'Não foi possível adicionar as músicas agora. Tente novamente.',
      );
    } finally {
      appendLock.current = false;
    }
  };
  const clearSongSelection = () => {
    updateSelectionState((current) => ({
      ...current,
      selectedSongIds: new Set(),
    }));
  };
  const collectionsUnavailable =
    collectionsQuery.isPending || collectionsQuery.isError;
  const collectionActions: RepertoireAction[] = activeSelectionMode
    ? [
        {
          accessibilityLabel: `Selecionar todas as músicas visíveis (${songs.length})`,
          disabled: songs.length === 0 || allVisibleSongsSelected,
          icon: 'check',
          label: 'Selecionar todos',
          onPress: selectVisibleSongs,
        },
        {
          disabled: selectedSongCount === 0,
          icon: 'minus',
          label: 'Limpar seleção',
          onPress: clearSongSelection,
        },
        {
          accessibilityLabel: 'Cancelar seleção de músicas',
          icon: 'close',
          label: 'Cancelar seleção',
          onPress: cancelSongSelection,
        },
      ]
    : [
        {
          icon: 'repertoire',
          label: 'Ver coleções',
          onPress: () => router.push(getRepertoireCollectionsHref(bandId)),
        },
        ...(canCreate
          ? [
              {
                accessibilityLabel: 'Selecionar músicas do repertório',
                icon: 'check' as const,
                label: 'Selecionar músicas',
                onPress: beginSongSelection,
              },
            ]
          : []),
      ];
  const actionSong =
    actionMenu.target !== 'collections' ? actionMenu.target : null;
  const songActions: RepertoireAction[] = actionSong
    ? [
        ...(canCreate
          ? [
              {
                icon: 'check' as const,
                label: 'Selecionar',
                onPress: () => selectSongAndBeginSelection(actionSong.id),
              },
            ]
          : []),
        ...(actionSong.lyricStatus !== 'missing'
          ? [
              {
                icon: 'fileText' as const,
                label: 'Exibir letra',
                onPress: () =>
                  router.push(getSongLyricsHref(bandId, actionSong.id)),
              },
            ]
          : []),
        {
          icon: 'info',
          label: 'Ver detalhes',
          onPress: () => router.push(getSongHref(bandId, actionSong.id)),
        },
        ...(canCreate
          ? [
              {
                icon: 'edit' as const,
                label: 'Editar música',
                onPress: () =>
                  router.push(getSongEditHref(bandId, actionSong.id)),
              },
              {
                disabled: collectionsUnavailable,
                icon: 'repertoire' as const,
                label: 'Organizar em coleções',
                onPress: () => collectionMembership.open(actionSong),
              },
            ]
          : []),
      ]
    : [];
  const menuUsesCollections = actionMenu.target === 'collections' || canCreate;
  const menuActions =
    actionMenu.target === 'collections' ? collectionActions : songActions;
  if (menuUsesCollections && collectionsQuery.isError) {
    menuActions.push({
      icon: 'refresh',
      label: 'Tentar carregar coleções novamente',
      onPress: () => {
        void collectionsQuery.refetch();
      },
    });
  }

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'repertoire') as string}
      leadingHeaderAction={
        activeSelectionMode
          ? {
              accessibilityLabel: 'Cancelar seleção de músicas',
              icon: 'close',
              label: 'Cancelar seleção',
              onPress: cancelSongSelection,
            }
          : undefined
      }
      headerAction={
        activeSelectionMode
          ? {
              accessibilityLabel: 'Abrir opções da seleção',
              icon: 'moreVertical',
              label: 'Opções da seleção',
              onPress: () => actionMenu.open('collections'),
            }
          : canCreate
            ? {
                accessibilityLabel: 'Adicionar música ao repertório',
                icon: 'musicAdd',
                label: 'Adicionar música',
                onPress: () => router.push(getSongCreateHref(bandId)),
              }
            : undefined
      }
      scrollable={false}
      title={
        activeSelectionMode
          ? `${selectedSongCount} ${selectedSongCount === 1 ? 'selecionada' : 'selecionadas'}`
          : 'Repertório'
      }
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <RepertoireActionMenu
        {...actionMenu.menuProps}
        actions={menuActions}
        feedback={
          menuUsesCollections && collectionsQuery.isError ? (
            <AppText tone="muted" variant="caption">
              Não foi possível carregar as coleções. As músicas continuam
              disponíveis.
            </AppText>
          ) : undefined
        }
        title={
          actionMenu.target === 'collections'
            ? activeSelectionMode
              ? 'Opções da seleção'
              : 'Coleções'
            : (actionSong?.title ?? 'Ações da música')
        }
      />
      <SongCollectionMembershipDialog {...collectionMembership.dialogProps} />
      {appendFeedbackMessage ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.appendFeedbackOverlay,
            { top: controlsOverlayHeight + spacing.sm },
          ]}
        >
          <TemporaryFeedback
            message={appendFeedbackMessage}
            onDismiss={dismissAppendFeedback}
          />
        </View>
      ) : null}
      {collectionMembership.saved ? (
        <TemporaryFeedback
          messageKey="collection-memberships-saved"
          onDismiss={collectionMembership.dismissSaved}
        />
      ) : null}
      {songsQuery.isPending ? <LoadingFeedback /> : null}
      {songsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      <ContentFade loading={songsQuery.isPending} style={styles.listArea}>
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            usesBottomNavigation && styles.listContentWithBottomNavigation,
          ]}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          data={songs}
          keyExtractor={({ id }) => id}
          ListEmptyComponent={
            !songsQuery.isPending &&
            !songsQuery.isError &&
            !userBandsQuery.isPending &&
            !userBandsQuery.isError ? (
              <ListEmptyState
                actionIcon={
                  !hasQuery && isFirstSongEmptyState && canCreate
                    ? 'musicAdd'
                    : undefined
                }
                actionLabel={
                  hasQuery
                    ? 'Limpar filtros'
                    : isFirstSongEmptyState && canCreate
                      ? 'Adicionar música'
                      : undefined
                }
                message={
                  hasQuery
                    ? 'Nem o roadie encontrou essa. Tente outra busca.'
                    : isFirstSongEmptyState
                      ? canCreate
                        ? 'Cadastre a primeira música da banda para começar o repertório e preparar os shows.'
                        : 'Peça a um proprietário ou editor da banda para cadastrar a primeira música do repertório.'
                      : 'O palco está silencioso por aqui.'
                }
                onAction={
                  hasQuery
                    ? clearFilters
                    : isFirstSongEmptyState && canCreate
                      ? () => router.push(getSongCreateHref(bandId))
                      : undefined
                }
                title={
                  hasQuery
                    ? 'Nenhuma música encontrada'
                    : isFirstSongEmptyState
                      ? 'Comece pelo repertório'
                      : 'Repertório vazio'
                }
              />
            ) : null
          }
          ListHeaderComponent={
            <View
              style={{ height: controlsOverlayHeight }}
              testID="repertoire-list-header-spacer"
            />
          }
          onMomentumScrollBegin={beginControlsMomentum}
          onMomentumScrollEnd={endControlsMomentum}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            updateControlsVisibility(
              contentOffset.y,
              contentSize.height - layoutMeasurement.height,
            );
            rememberListScrollOffset(event, rememberScrollOffset);
          }}
          onScrollBeginDrag={beginControlsDrag}
          refreshControl={getListRefreshControl({
            onRefresh,
            progressViewOffset: controlsOverlayHeight,
            refreshing,
          })}
          renderItem={({ item }) => (
            <SongRow
              bandId={bandId}
              onOpenActions={actionMenu.open}
              onSelectSong={canCreate ? selectSongAndBeginSelection : undefined}
              onToggleSelection={toggleSongSelection}
              selected={selectedSongIds.has(item.id)}
              selectionMode={activeSelectionMode}
              song={item}
            />
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          testID="repertoire-list"
        />
        <ListControlsOverlay
          controlsVisible={controlsVisible}
          horizontalPadding={horizontalPadding}
          onExpandedHeightChange={setControlsOverlayHeight}
          search={
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchField
                  accessibilityLabel="Buscar música por título ou artista"
                  onChangeText={(value) => update('search', value)}
                  placeholder="Buscar música ou artista/banda"
                  value={state.search}
                />
              </View>
              <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
            </View>
          }
        >
          <View style={styles.controlToolbarEnd}>
            {activeSelectionMode ? (
              <AppButton
                accessibilityLabel={`Adicionar ${selectedSongCount} ${selectedSongCount === 1 ? 'música selecionada' : 'músicas selecionadas'} a uma coleção`}
                disabled={selectedSongCount === 0 || collectionsUnavailable}
                icon="addCircle"
                label="Adicionar"
                onPress={openCollectionPicker}
                style={styles.selectionAddButton}
              />
            ) : (
              <MenuButton
                accessibilityLabel="Abrir coleções do repertório"
                icon="repertoire"
                label="Coleções"
                onPress={() => actionMenu.open('collections')}
              />
            )}
            <FilterMenu
              active={state.filter !== 'all' || collectionFilter !== 'all'}
              accessibilityLabel="Alterar filtros do repertório"
              icon="filter"
              label="Filtrar"
              onClear={clearFilters}
            >
              <View style={styles.filterGroup}>
                <AppText variant="eyebrow">Status</AppText>
                <ChoiceChips
                  accessibilityLabel="Status das músicas"
                  onChange={(value) => update('filter', value)}
                  options={repertoireFilters}
                  value={state.filter}
                />
              </View>
              {collectionsQuery.data?.length ? (
                <View style={styles.filterGroup}>
                  <AppText variant="eyebrow">Coleção</AppText>
                  <ChoiceChips
                    accessibilityLabel="Coleção das músicas"
                    onChange={updateCollectionFilter}
                    options={collectionFilterOptions}
                    value={collectionFilter}
                  />
                </View>
              ) : null}
            </FilterMenu>
            <OptionMenu
              active={state.sort !== 'title'}
              accessibilityLabel="Alterar ordenação do repertório"
              compact
              icon="sort"
              label="Ordenar"
              onChange={(value) => update('sort', value)}
              options={repertoireSorts}
              value={state.sort}
            />
          </View>
        </ListControlsOverlay>
        {state.collection === 'removed' ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.collectionFilterNotice,
              { top: controlsOverlayHeight + spacing.sm },
            ]}
            testID="collection-filter-removal-notice"
          >
            <TemporaryFeedback
              messageKey="collection-filter-reset"
              onDismiss={() => update('collection', 'all')}
            />
          </View>
        ) : null}
        <OptionSheet
          closeAccessibilityLabel="Fechar escolha de coleção"
          label="Adicionar a uma coleção"
          onClose={closeCollectionPicker}
          onDismiss={finishCollectionPickerDismissal}
          sheetStyle={styles.collectionPickerSheet}
          testID="repertoire-collection-picker"
          visible={collectionPickerVisible}
        >
          {collectionsQuery.isPending ? (
            <LoadingFeedback />
          ) : collectionsQuery.isError ? (
            <ErrorFeedback onRetry={() => void collectionsQuery.refetch()} />
          ) : collectionsQuery.data?.length ? (
            <>
              <AppText tone="muted" variant="caption">
                {selectedSongCount}{' '}
                {selectedSongCount === 1
                  ? 'música selecionada'
                  : 'músicas selecionadas'}
              </AppText>
              <ScrollView
                contentContainerStyle={styles.collectionChoices}
                style={styles.collectionChoicesScroll}
              >
                {collectionsQuery.data.map((summary) => {
                  const isTarget = targetCollectionId === summary.collection.id;
                  return (
                    <Pressable
                      accessibilityLabel={`Selecionar coleção ${summary.collection.name}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isTarget }}
                      key={summary.collection.id}
                      onPress={() => {
                        setTargetCollectionId(summary.collection.id);
                        setAppendError(null);
                      }}
                      style={({ pressed }) => [
                        styles.collectionChoice,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Card
                        style={styles.collectionChoiceCard}
                        tone={isTarget ? 'accent' : 'default'}
                      >
                        <View style={styles.collectionChoiceCopy}>
                          <AppText variant="heading">
                            {summary.collection.name}
                          </AppText>
                          <AppText tone="muted" variant="caption">
                            {summary.songCount === 1
                              ? '1 música'
                              : `${summary.songCount} músicas`}
                          </AppText>
                        </View>
                        {isTarget ? (
                          <AppIcon
                            color={colors.action.primary}
                            name="check"
                            size={20}
                          />
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {targetCollection ? (
                <View style={styles.collectionAppendSummary}>
                  <AppText tone="muted" variant="caption">
                    {newSelectedSongCount === 0
                      ? 'As músicas selecionadas já fazem parte desta coleção.'
                      : `${newSelectedSongCount} ${newSelectedSongCount === 1 ? 'música nova será adicionada' : 'músicas novas serão adicionadas'}.`}
                    {newSelectedSongCount > 0 && alreadyPresentSongCount > 0
                      ? ` ${alreadyPresentSongCount} ${alreadyPresentSongCount === 1 ? 'já pertence' : 'já pertencem'} à coleção.`
                      : ''}
                  </AppText>
                </View>
              ) : null}
              {appendError ? (
                <AppText accessibilityRole="alert" tone="danger">
                  {appendError}
                </AppText>
              ) : null}
              <View style={styles.collectionPickerActionStack}>
                <AppButton
                  disabled={appendSongs.isPending || selectedSongCount === 0}
                  icon="addCircle"
                  label="Nova coleção"
                  onPress={createCollectionFromPicker}
                  style={styles.collectionPickerCreateAction}
                  variant="secondary"
                />
                <View style={styles.collectionPickerActions}>
                  <AppButton
                    label="Cancelar"
                    disabled={appendSongs.isPending}
                    onPress={closeCollectionPicker}
                    style={styles.collectionPickerActionButton}
                    variant="secondary"
                  />
                  <AppButton
                    accessibilityLabel={
                      targetCollection
                        ? `Confirmar inclusão na coleção ${targetCollection.collection.name}`
                        : 'Confirmar inclusão na coleção'
                    }
                    disabled={
                      !targetCollection ||
                      newSelectedSongCount === 0 ||
                      appendSongs.isPending
                    }
                    icon="addCircle"
                    label="Adicionar"
                    onPress={() => void appendSelectedSongs()}
                    style={styles.collectionPickerActionButton}
                    variant="primary"
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.collectionPickerEmpty}>
              <AppText tone="muted" variant="caption">
                {selectedSongCount}{' '}
                {selectedSongCount === 1
                  ? 'música selecionada'
                  : 'músicas selecionadas'}
              </AppText>
              <AppText tone="muted">
                Não há coleções disponíveis para esta banda.
              </AppText>
              <View style={styles.collectionPickerActions}>
                <AppButton
                  label="Cancelar"
                  onPress={closeCollectionPicker}
                  style={styles.collectionPickerActionButton}
                  variant="secondary"
                />
                <AppButton
                  disabled={selectedSongCount === 0}
                  icon="addCircle"
                  label="Nova coleção"
                  onPress={createCollectionFromPicker}
                  style={styles.collectionPickerActionButton}
                  variant="primary"
                />
              </View>
            </View>
          )}
        </OptionSheet>
      </ContentFade>
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  listArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  searchField: {
    flex: 1,
    minWidth: 0,
  },
  controlToolbarEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  selectionAddButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  appendFeedbackOverlay: {
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    zIndex: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  listContentWithBottomNavigation: {
    paddingBottom: spacing.xxxl + layout.minimumTouchTarget,
  },
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  listRow: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 84,
    padding: spacing.md,
  },
  selectedListRow: {
    backgroundColor: colors.background.selected,
    borderColor: colors.border.selected,
  },
  rowLayout: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
  },
  rowLayoutWithActions: { gap: 0 },
  rowActionsSpace: { width: layout.minimumTouchTarget },
  songActionsButton: {
    alignItems: 'center',
    bottom: spacing.md + spacing.xs,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md + spacing.xs,
    width: layout.minimumTouchTarget,
  },
  rowPrimaryContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  rowLeadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 48,
  },
  rowContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowTitle: {
    flexShrink: 1,
  },
  rowMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  rowArtist: {
    flex: 1,
    minWidth: 0,
  },
  rowNavigation: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 20,
  },
  selectionIndicator: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  selectionIndicatorSelected: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
  collectionPickerSheet: {
    maxHeight: '90%',
  },
  collectionFilterNotice: {
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  collectionChoicesScroll: {
    flexShrink: 1,
    maxHeight: 320,
  },
  collectionChoices: {
    gap: spacing.sm,
  },
  collectionChoice: {
    borderRadius: radii.lg,
  },
  collectionChoiceCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  collectionChoiceCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  collectionPickerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
  },
  collectionPickerActionButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  collectionPickerActionStack: {
    gap: spacing.sm,
  },
  collectionPickerCreateAction: {
    alignSelf: 'flex-start',
  },
  collectionAppendSummary: {
    gap: spacing.xs,
  },
  collectionPickerEmpty: {
    gap: spacing.lg,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  durationValue: {
    fontVariant: ['tabular-nums'],
  },
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
