import { Link, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
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
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
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
  getRepertoireCollectionsHref,
  getSongCreateHref,
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

interface SongRowProps {
  readonly bandId: EntityId;
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

interface CollectionAppendResult {
  readonly addedCount: number;
  readonly alreadyPresentCount: number;
  readonly collectionName: string;
}

type RepertoireCollectionFilter = 'all' | 'none' | EntityId;

function emptySelectionState(bandId: EntityId): RepertoireSelectionState {
  return { active: false, bandId, selectedSongIds: new Set() };
}

function SongRow({
  bandId,
  onToggleSelection,
  selected,
  selectionMode,
  song,
}: SongRowProps) {
  const [pressed, setPressed] = useState(false);

  const row = (
    <Pressable
      accessibilityLabel={
        selectionMode
          ? `${selected ? 'Remover seleção de' : 'Selecionar'} ${song.title}`
          : `Abrir música ${song.title}. Status da letra: ${lyricStatusLabels[song.lyricStatus]}`
      }
      accessibilityRole={selectionMode ? 'checkbox' : 'link'}
      accessibilityState={selectionMode ? { checked: selected } : undefined}
      onPress={selectionMode ? () => onToggleSelection(song.id) : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={StyleSheet.flatten([
        styles.listRow,
        selected && selectionMode && styles.selectedListRow,
        pressed && styles.pressed,
      ])}
    >
      <View style={styles.rowLayout}>
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
        <View style={styles.rowNavigation}>
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
          ) : (
            <AppIcon color={colors.text.secondary} name="forward" size={20} />
          )}
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
          onPress={blurWebFocus}
          asChild
        >
          {row}
        </Link>
      )}
    </View>
  );
}

export function RepertoireScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  return (
    <RepertoireScreenContent
      key={bandId}
      bandId={bandId}
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    />
  );
}

function RepertoireScreenContent({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
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
  const {
    beginDrag: beginControlsDrag,
    beginMomentum: beginControlsMomentum,
    endMomentum: endControlsMomentum,
    updateVisibility: updateControlsVisibility,
    visible: controlsVisible,
  } = useScrollDirectionVisibility(initialScrollOffset);
  const [controlsOverlayHeight, setControlsOverlayHeight] = useState(
    spacing.sm * 3 + layout.minimumTouchTarget * 2 + 1,
  );
  const [selectionState, setSelectionState] =
    useState<RepertoireSelectionState>(() => emptySelectionState(bandId));
  const [collectionPickerVisible, setCollectionPickerVisible] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<EntityId | null>(
    null,
  );
  const [appendError, setAppendError] = useState<string | null>(null);
  const [appendResult, setAppendResult] =
    useState<CollectionAppendResult | null>(null);
  const currentSelectionState =
    selectionState.bandId === bandId
      ? selectionState
      : emptySelectionState(bandId);
  const { active: selectionMode, selectedSongIds } = currentSelectionState;
  const collectionFilter = state.collection;
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
  const closeCollectionPicker = () => {
    if (appendLock.current) return;
    setCollectionPickerVisible(false);
    setTargetCollectionId(null);
    setAppendError(null);
    setAppendResult(null);
  };
  const openCollectionPicker = () => {
    setTargetCollectionId(null);
    setAppendError(null);
    setAppendResult(null);
    setCollectionPickerVisible(true);
  };
  const appendSelectedSongs = async () => {
    if (
      !targetCollection ||
      newSelectedSongCount === 0 ||
      appendLock.current ||
      appendResult
    ) {
      return;
    }

    appendLock.current = true;
    setAppendError(null);
    try {
      await appendSongs.mutateAsync({
        collectionId: targetCollection.collection.id,
        songIds: Array.from(selectedSongIds),
      });
      setAppendResult({
        addedCount: newSelectedSongCount,
        alreadyPresentCount: alreadyPresentSongCount,
        collectionName: targetCollection.collection.name,
      });
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
  const finishCollectionAppend = () => {
    if (appendLock.current) return;
    closeCollectionPicker();
    cancelSongSelection();
  };
  const createCollectionFromSelection = () => {
    router.push(
      getRepertoireCollectionCreateHref(
        bandId,
        Array.from(selectedSongIds),
        true,
      ),
    );
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'repertoire') as string}
      headerAction={
        canCreate
          ? {
              accessibilityLabel: 'Adicionar música ao repertório',
              icon: 'musicAdd',
              label: 'Adicionar música',
              onPress: () => router.push(getSongCreateHref(bandId)),
            }
          : undefined
      }
      scrollable={false}
      title="Repertório"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {songsQuery.isPending ||
      collectionsQuery.isPending ||
      userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {songsQuery.isError ||
      collectionsQuery.isError ||
      userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void songsQuery.refetch();
            void collectionsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      <ContentFade
        loading={
          songsQuery.isPending ||
          collectionsQuery.isPending ||
          userBandsQuery.isPending
        }
        style={styles.listArea}
      >
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
            !collectionsQuery.isPending &&
            !collectionsQuery.isError &&
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
            <View style={{ height: controlsOverlayHeight }} />
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
            {canCreate ? (
              selectionMode ? (
                <>
                  <AppText
                    accessibilityLiveRegion="polite"
                    style={styles.selectionCount}
                    tone="muted"
                  >
                    {selectedSongCount === 1
                      ? '1 música selecionada'
                      : `${selectedSongCount} músicas selecionadas`}
                  </AppText>
                  <AppButton
                    accessibilityLabel={`Selecionar ${songs.length} resultado${songs.length === 1 ? '' : 's'} atual${songs.length === 1 ? '' : 'is'}`}
                    disabled={songs.length === 0 || allVisibleSongsSelected}
                    icon="check"
                    label={`Selecionar resultados (${songs.length})`}
                    onPress={selectVisibleSongs}
                    variant="secondary"
                  />
                  <AppButton
                    accessibilityLabel={`Criar coleção com ${selectedSongCount} músicas selecionadas`}
                    disabled={selectedSongCount === 0}
                    icon="addCircle"
                    label="Criar coleção"
                    onPress={createCollectionFromSelection}
                    variant="secondary"
                  />
                  {collectionsQuery.data?.length ? (
                    <AppButton
                      accessibilityLabel={`Adicionar ${selectedSongCount} ${selectedSongCount === 1 ? 'música selecionada' : 'músicas selecionadas'} a uma coleção existente`}
                      disabled={selectedSongCount === 0}
                      icon="addCircle"
                      label="Adicionar à coleção"
                      onPress={openCollectionPicker}
                      variant="secondary"
                    />
                  ) : null}
                  <AppButton
                    accessibilityLabel="Cancelar seleção de músicas"
                    icon="close"
                    label="Cancelar seleção"
                    onPress={cancelSongSelection}
                    variant="tertiary"
                  />
                </>
              ) : (
                <AppButton
                  accessibilityLabel="Selecionar músicas do repertório"
                  icon="check"
                  label="Selecionar músicas"
                  onPress={beginSongSelection}
                  variant="tertiary"
                />
              )
            ) : null}
            <AppButton
              accessibilityLabel="Abrir coleções do repertório"
              icon="repertoire"
              label="Coleções"
              onPress={() => router.push(getRepertoireCollectionsHref(bandId))}
              variant="tertiary"
            />
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
        <OptionSheet
          closeAccessibilityLabel="Fechar escolha de coleção"
          label="Adicionar a uma coleção"
          onClose={closeCollectionPicker}
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
                        setAppendResult(null);
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
                  <AppText tone="muted">
                    {newSelectedSongCount === 0
                      ? 'Todas as músicas escolhidas já fazem parte desta coleção.'
                      : `${newSelectedSongCount} ${newSelectedSongCount === 1 ? 'música nova será adicionada' : 'músicas novas serão adicionadas'}.`}
                  </AppText>
                  {alreadyPresentSongCount > 0 ? (
                    <AppText tone="muted">
                      {alreadyPresentSongCount}{' '}
                      {alreadyPresentSongCount === 1
                        ? 'música já faz parte e manterá sua posição atual.'
                        : 'músicas já fazem parte e manterão suas posições atuais.'}
                    </AppText>
                  ) : null}
                </View>
              ) : null}
              {appendError ? (
                <AppText accessibilityRole="alert" tone="danger">
                  {appendError}
                </AppText>
              ) : null}
              {appendResult ? (
                <AppText accessibilityRole="alert" tone="success">
                  {appendResult.addedCount === 0
                    ? `As músicas escolhidas já pertenciam à coleção ${appendResult.collectionName}.`
                    : `${appendResult.addedCount} ${appendResult.addedCount === 1 ? 'música adicionada' : 'músicas adicionadas'} à coleção ${appendResult.collectionName}.${appendResult.alreadyPresentCount > 0 ? ` ${appendResult.alreadyPresentCount} ${appendResult.alreadyPresentCount === 1 ? 'já fazia parte' : 'já faziam parte'} da coleção.` : ''}`}
                </AppText>
              ) : null}
              {appendResult ? (
                <AppButton
                  accessibilityLabel="Concluir inclusão na coleção"
                  icon="check"
                  label="Concluir"
                  onPress={finishCollectionAppend}
                />
              ) : (
                <View style={styles.collectionPickerActions}>
                  <AppButton
                    label="Cancelar"
                    disabled={appendSongs.isPending}
                    onPress={closeCollectionPicker}
                    variant="tertiary"
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
                    label={
                      appendSongs.isPending
                        ? 'Adicionando…'
                        : `Adicionar ${newSelectedSongCount} ${newSelectedSongCount === 1 ? 'música' : 'músicas'}`
                    }
                    onPress={() => void appendSelectedSongs()}
                    variant="primary"
                  />
                </View>
              )}
            </>
          ) : (
            <AppText tone="muted">
              Não há coleções disponíveis para esta banda.
            </AppText>
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
  selectionCount: {
    marginHorizontal: spacing.sm,
  },
  collectionPickerSheet: {
    maxHeight: '90%',
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  collectionAppendSummary: {
    gap: spacing.xs,
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
