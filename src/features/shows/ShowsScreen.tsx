import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
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
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { useShows, useSongs, useUserBands } from '@/data/queries';
import { createShow, ShowMutationError } from '@/data/supabase/showMutations';
import type { ShowStatus } from '@/domain';
import { getShowDurationMs } from '@/domain/setlistDuration';
import { getBrazilianNationalHolidays } from '@/features/calendar/brazilianHolidays';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getShowHref,
  getSongCreateHref,
} from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useScrollDirectionVisibility } from '@/hooks/useScrollDirectionVisibility';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ShowListRow } from '@/features/shows/ShowListRow';
import {
  ShowCreationDialog,
  type ShowCreationForm,
} from '@/features/shows/ShowCreationDialog';
import {
  getContentHorizontalPadding,
  getNavigationPresentation,
} from '@/theme/responsive';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatDateFilter, getDateKey } from '@/utils/dateTime';
import { normalizeForSearch } from '@/utils/text';

type ShowPeriod = 'all' | 'past' | 'upcoming';
type ShowStatusFilter = 'active' | 'all' | ShowStatus;
type ShowSort = 'date-asc' | 'date-desc' | 'duration' | 'name';

const showPeriods = [
  { label: 'Todos', value: 'all' },
  { label: 'Próximos', value: 'upcoming' },
  { label: 'Passados', value: 'past' },
] as const;

const showStatuses = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Pronto', value: 'ready' },
  { label: 'Cancelado', value: 'cancelled' },
] as const;

const showSorts = [
  { label: 'Data mais próxima', value: 'date-asc' },
  { label: 'Data mais distante', value: 'date-desc' },
  { label: 'Nome', value: 'name' },
  { label: 'Maior duração', value: 'duration' },
] as const;

export function ShowsScreen({
  bandId,
  now = new Date(),
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
  const queryClient = useQueryClient();
  const showsQuery = useShows(bandId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    showsQuery,
    songsQuery,
    userBandsQuery,
  ]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [creationVisible, setCreationVisible] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSubmitting, setCreationSubmitting] = useState(false);
  const creationSubmissionLock = useRef(false);
  const [creationDirty, setCreationDirty] = useState(false);
  const [creationInstance, setCreationInstance] = useState(0);
  const unsavedChanges = useUnsavedChangesGuard({
    dirty: creationDirty,
    saving: creationSubmitting,
  });
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'shows', {
      date: '',
      period: 'upcoming' as ShowPeriod,
      search: '',
      sort: 'date-asc' as ShowSort,
      status: 'active' as ShowStatusFilter,
    });
  const {
    updateVisibility: updateControlsVisibility,
    visible: controlsVisible,
  } = useScrollDirectionVisibility(initialScrollOffset);
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canCreate =
    membership?.role === 'owner' || membership?.role === 'editor';
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const hasActiveSongs = (songsQuery.data ?? []).some(
    (song) => song.archivedAt === null,
  );
  const hasRegisteredShows = (showsQuery.data?.length ?? 0) > 0;
  const normalizedSearch = normalizeForSearch(state.search);
  const todayKey = getDateKey(now);
  const shows = useMemo(() => {
    const result = (showsQuery.data ?? []).filter((show) => {
      const matchesSearch = normalizeForSearch(
        `${show.name} ${show.venue}`,
      ).includes(normalizedSearch);
      const showDateKey = getDateKey(show.startsAt);
      const matchesPeriod =
        state.period === 'all' ||
        (state.period === 'upcoming'
          ? showDateKey >= todayKey
          : showDateKey < todayKey);
      const matchesDate =
        !state.date || getDateKey(show.startsAt) === state.date;
      const matchesStatus =
        state.status === 'all' ||
        (state.status === 'active'
          ? show.status === 'draft' || show.status === 'ready'
          : show.status === state.status);

      return matchesSearch && matchesPeriod && matchesDate && matchesStatus;
    });

    return [...result].sort((left, right) => {
      if (state.sort === 'name') {
        return left.name.localeCompare(right.name, 'pt-BR');
      }
      if (state.sort === 'duration') {
        return (
          (getShowDurationMs(right, songsById) ?? -1) -
          (getShowDurationMs(left, songsById) ?? -1)
        );
      }
      return state.sort === 'date-desc'
        ? right.startsAt.localeCompare(left.startsAt)
        : left.startsAt.localeCompare(right.startsAt);
    });
  }, [normalizedSearch, showsQuery.data, songsById, state, todayKey]);
  const venueOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (showsQuery.data ?? [])
            .map(({ venue }) => venue.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [showsQuery.data],
  );
  const calendarShows = useMemo(
    () =>
      (showsQuery.data ?? []).filter(
        (show) => show.status === 'draft' || show.status === 'ready',
      ),
    [showsQuery.data],
  );
  const selectedDateLabel = state.date ? formatDateFilter(state.date) : null;
  const selectedHoliday = useMemo(() => {
    if (!state.date) return null;

    const year = Number(state.date.slice(0, 4));
    return (
      getBrazilianNationalHolidays(year).find(
        ({ dateKey }) => dateKey === state.date,
      ) ?? null
    );
  }, [state.date]);
  const [controlsOverlayHeight, setControlsOverlayHeight] = useState(
    spacing.sm * (selectedDateLabel ? 4 : 3) +
      layout.minimumTouchTarget * 2 +
      (selectedDateLabel ? 40 : 0) +
      1,
  );
  const handleCreateShow = async (form: ShowCreationForm) => {
    if (creationSubmissionLock.current) return;
    creationSubmissionLock.current = true;
    setCreationError(null);
    setCreationSubmitting(true);

    try {
      const showId = await createShow({
        bandId,
        name: form.name,
        notes: form.notes,
        startsAt: form.date + 'T' + form.time + ':00',
        venue: form.venue,
      });
      await queryClient.invalidateQueries({
        queryKey: ['bands', bandId, 'shows'],
        refetchType: 'all',
      });
      setCreationVisible(false);
      setCreationDirty(false);
      unsavedChanges.allowNextRemoval();
      router.push(getShowHref(bandId, showId));
    } catch (error) {
      setCreationError(
        error instanceof ShowMutationError
          ? error.message
          : 'Não foi possível criar o show agora. Tente novamente.',
      );
    } finally {
      creationSubmissionLock.current = false;
      setCreationSubmitting(false);
    }
  };
  const clearFilters = () => {
    update('date', '');
    update('search', '');
    update('period', 'upcoming');
    update('status', 'active');
    update('sort', 'date-asc');
  };
  const openCreateShowDialog = () => {
    setCreationError(null);
    setCreationInstance((current) => current + 1);
    setCreationVisible(true);
  };
  const discardCreationChanges = () => {
    setCreationVisible(false);
    setCreationDirty(false);
    unsavedChanges.discardAndLeave();
  };
  const activeFilterCount =
    Number(Boolean(state.date)) +
    Number(state.period !== 'all') +
    Number(state.status !== 'all');
  const selectDate = (dateKey: string) => {
    update('date', dateKey);
    update('period', 'all');
    update('status', 'all');
    setCalendarOpen(false);
  };
  const clearSelectedDate = () => {
    update('date', '');
    update('period', 'upcoming');
    update('status', 'active');
  };

  const controls = (
    <ListControls>
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <SearchField
            accessibilityLabel="Buscar show por nome ou local"
            onChangeText={(value) => update('search', value)}
            placeholder="Buscar show ou local"
            value={state.search}
          />
        </View>
        <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      </View>
      {controlsVisible ? (
        <View style={styles.controlToolbar}>
          <Pressable
            accessibilityLabel="Abrir calendário para filtrar por data"
            accessibilityRole="button"
            onPress={() => setCalendarOpen(true)}
            style={({ pressed }) => [
              styles.calendarButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.text.secondary} name="shows" size={18} />
            <AppText tone="accent" variant="caption">
              Calendário
            </AppText>
          </Pressable>
          <FilterMenu
            active={activeFilterCount > 0}
            accessibilityLabel="Abrir filtros dos shows"
            icon="filter"
            label="Filtros"
            onClear={() => {
              update('date', '');
              update('period', 'upcoming');
              update('status', 'active');
            }}
          >
            <View style={styles.filterGroup}>
              <AppText variant="eyebrow">Período</AppText>
              <ChoiceChips
                accessibilityLabel="Período dos shows"
                onChange={(value) => update('period', value)}
                options={showPeriods}
                value={state.period}
              />
            </View>
            <View style={styles.filterGroup}>
              <AppText variant="eyebrow">Status</AppText>
              <ChoiceChips
                accessibilityLabel="Estado dos shows"
                onChange={(value) => update('status', value)}
                options={showStatuses}
                value={state.status}
              />
            </View>
          </FilterMenu>
          <OptionMenu
            active={state.sort !== 'date-asc'}
            accessibilityLabel="Alterar ordenação dos shows"
            compact
            icon="sort"
            label="Ordenar"
            onChange={(value) => update('sort', value)}
            options={showSorts}
            value={state.sort}
          />
        </View>
      ) : null}
      {controlsVisible && (selectedDateLabel || selectedHoliday) ? (
        <View style={styles.dateToolbar}>
          {selectedDateLabel ? (
            <Pressable
              accessibilityLabel={`Remover filtro de data ${selectedDateLabel}`}
              accessibilityRole="button"
              onPress={clearSelectedDate}
              style={({ pressed }) => [
                styles.dateChip,
                pressed && styles.pressed,
              ]}
            >
              <AppText tone="onAccent" variant="caption">
                {selectedDateLabel}
              </AppText>
              <AppIcon color={colors.text.onAccent} name="close" size={14} />
            </Pressable>
          ) : null}
          {selectedHoliday ? (
            <AppText tone="accent" variant="body">
              {selectedHoliday.name}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <OptionSheet
        closeAccessibilityLabel="Fechar calendário"
        label="Escolher data"
        onClose={() => setCalendarOpen(false)}
        visible={calendarOpen}
      >
        <MonthCalendar
          initialDate={now}
          onSelectDate={selectDate}
          selectedDateKey={state.date || undefined}
          shows={calendarShows}
        />
      </OptionSheet>
    </ListControls>
  );
  const hasQuery =
    state.date.length > 0 ||
    state.search.length > 0 ||
    state.period !== 'upcoming' ||
    state.status !== 'active';
  const isMissingSongsEmptyState = !hasQuery && !hasActiveSongs;
  const isFirstShowEmptyState =
    !hasQuery && hasActiveSongs && !hasRegisteredShows;

  return (
    <BandAreaLayout
      activeSection="shows"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'shows') as string}
      headerAction={
        canCreate
          ? {
              accessibilityLabel: 'Criar novo show',
              icon: 'showAdd',
              label: 'Novo show',
              onPress: openCreateShowDialog,
            }
          : undefined
      }
      scrollable={false}
      title="Shows"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {showsQuery.isPending ||
      songsQuery.isPending ||
      userBandsQuery.isPending ? (
        <LoadingFeedback variation={1} />
      ) : null}
      <ShowCreationDialog
        calendarShows={calendarShows}
        venueOptions={venueOptions}
        key={`${state.date || 'new-show'}-${creationInstance}`}
        errorMessage={creationError}
        initialDate={state.date || undefined}
        isSubmitting={creationSubmitting}
        navigationDiscardPrompt={
          Platform.OS === 'ios'
            ? {
                onContinue: unsavedChanges.continueEditing,
                onDiscard: discardCreationChanges,
                visible: unsavedChanges.confirmationVisible,
              }
            : undefined
        }
        onDirtyChange={setCreationDirty}
        onClose={() => {
          if (!creationSubmitting) {
            setCreationVisible(false);
            setCreationError(null);
          }
        }}
        onSubmit={(form) => void handleCreateShow(form)}
        visible={creationVisible}
      />
      {Platform.OS !== 'ios' || !creationVisible ? (
        <UnsavedChangesPrompt
          onContinue={unsavedChanges.continueEditing}
          onDiscard={discardCreationChanges}
          visible={unsavedChanges.confirmationVisible}
        />
      ) : null}
      {showsQuery.isError || songsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showsQuery.refetch();
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}

      <ContentFade
        loading={
          showsQuery.isPending ||
          songsQuery.isPending ||
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
          data={shows}
          keyExtractor={({ id }) => id}
          ListEmptyComponent={
            !showsQuery.isPending &&
            !songsQuery.isPending &&
            !showsQuery.isError &&
            !userBandsQuery.isError &&
            !userBandsQuery.isPending &&
            !songsQuery.isError ? (
              <ListEmptyState
                actionIcon={
                  hasQuery
                    ? undefined
                    : isMissingSongsEmptyState && canCreate
                      ? 'musicAdd'
                      : isFirstShowEmptyState && canCreate
                        ? 'showAdd'
                        : undefined
                }
                actionLabel={
                  hasQuery
                    ? 'Limpar filtros'
                    : isMissingSongsEmptyState
                      ? canCreate
                        ? 'Adicionar música'
                        : undefined
                      : isFirstShowEmptyState && canCreate
                        ? 'Criar primeiro show'
                        : undefined
                }
                message={
                  hasQuery
                    ? 'Nem o roadie encontrou essa. Tente outra busca.'
                    : isMissingSongsEmptyState
                      ? canCreate
                        ? 'Cadastre a primeira música do repertório antes de planejar um show.'
                        : 'O repertório ainda não tem músicas. Peça a um proprietário ou editor para cadastrar a primeira.'
                      : isFirstShowEmptyState
                        ? canCreate
                          ? 'O repertório já tem músicas. Crie o primeiro show para organizar a apresentação.'
                          : 'O repertório já tem músicas. Peça a um proprietário ou editor para cadastrar o primeiro show.'
                        : 'A agenda ainda está em silêncio.'
                }
                onAction={
                  hasQuery
                    ? clearFilters
                    : isMissingSongsEmptyState && canCreate
                      ? () => router.push(getSongCreateHref(bandId))
                      : isFirstShowEmptyState && canCreate
                        ? openCreateShowDialog
                        : undefined
                }
                title={
                  hasQuery
                    ? 'Nenhum show encontrado'
                    : isMissingSongsEmptyState
                      ? 'Comece pelo repertório'
                      : isFirstShowEmptyState
                        ? 'Cadastre o primeiro show'
                        : 'Nenhum show por aqui'
                }
              />
            ) : null
          }
          ListHeaderComponent={
            <View style={{ height: controlsOverlayHeight }} />
          }
          onScroll={(event) => {
            updateControlsVisibility(event.nativeEvent.contentOffset.y);
            rememberListScrollOffset(event, rememberScrollOffset);
          }}
          refreshControl={getListRefreshControl({
            onRefresh,
            progressViewOffset: controlsOverlayHeight,
            refreshing,
          })}
          renderItem={({ item }) => (
            <ShowListRow
              accessibilityLabel={`Abrir show ${item.name}`}
              durationMs={getShowDurationMs(item, songsById)}
              href={getShowHref(bandId, item.id)}
              show={item}
            />
          )}
          scrollEventThrottle={120}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          testID="shows-list"
        />
        <ListControlsOverlay
          horizontalPadding={horizontalPadding}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            setControlsOverlayHeight((current) =>
              current === nextHeight ? current : nextHeight,
            );
          }}
        >
          {controls}
        </ListControlsOverlay>
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
  controlToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  dateToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  calendarButton: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  dateChip: {
    alignItems: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  filterGroup: {
    gap: spacing.sm,
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
  pressed: {
    opacity: 0.72,
  },
});
