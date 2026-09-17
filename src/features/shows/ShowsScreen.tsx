import { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  ChoiceChips,
  FilterMenu,
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import { useShows, useSongs } from '@/data/queries';
import type { ShowStatus } from '@/domain';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getShowDurationMs,
  normalizeForSearch,
} from '@/features/navigation/display';
import { getBandSectionHref, getShowHref } from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { ShowListRow } from '@/features/shows/ShowListRow';
import { spacing } from '@/theme/tokens';

type ShowPeriod = 'all' | 'past' | 'upcoming';
type ShowStatusFilter = 'active' | 'all' | ShowStatus;
type ShowSort = 'date-asc' | 'date-desc' | 'duration' | 'name';
type ShowView = 'calendar' | 'list';

const showViews = [
  { label: 'Lista', value: 'list' },
  { label: 'Calendário', value: 'calendar' },
] as const;

const showPeriods = [
  { label: 'Todos', value: 'all' },
  { label: 'Próximos', value: 'upcoming' },
  { label: 'Passados', value: 'past' },
] as const;

const showStatuses = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
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
  const showsQuery = useShows(bandId);
  const songsQuery = useSongs(bandId, true);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'shows', {
      period: 'upcoming' as ShowPeriod,
      search: '',
      sort: 'date-asc' as ShowSort,
      status: 'active' as ShowStatusFilter,
      view: 'list' as ShowView,
    });
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const normalizedSearch = normalizeForSearch(state.search);
  const shows = useMemo(() => {
    const result = (showsQuery.data ?? []).filter((show) => {
      const matchesSearch = normalizeForSearch(
        `${show.name} ${show.venue}`,
      ).includes(normalizedSearch);
      const startsAt = new Date(show.startsAt);
      const matchesPeriod =
        state.view === 'calendar' ||
        state.period === 'all' ||
        (state.period === 'upcoming' ? startsAt >= now : startsAt < now);
      const matchesStatus =
        state.view === 'calendar'
          ? show.status === 'draft' || show.status === 'ready'
          : state.status === 'all' ||
            (state.status === 'active'
              ? show.status === 'draft' || show.status === 'ready'
              : show.status === state.status);

      return matchesSearch && matchesPeriod && matchesStatus;
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
  }, [normalizedSearch, now, showsQuery.data, songsById, state]);
  const clearFilters = () => {
    update('search', '');
    update('period', 'upcoming');
    update('status', 'active');
    update('sort', 'date-asc');
  };
  const activeFilterCount =
    Number(state.period !== 'upcoming') + Number(state.status !== 'active');

  const controls = (
    <ListControls>
      <SearchField
        accessibilityLabel="Buscar show por nome ou local"
        onChangeText={(value) => update('search', value)}
        placeholder="Buscar show ou local"
        value={state.search}
      />
      <View style={styles.controlToolbar}>
        <ChoiceChips
          accessibilityLabel="Visualização dos shows"
          onChange={(value) => update('view', value)}
          options={showViews}
          value={state.view}
        />
        {state.view === 'list' ? (
          <>
            <FilterMenu
              accessibilityLabel="Abrir filtros dos shows"
              label="Filtros"
              summary={
                activeFilterCount > 0 ? String(activeFilterCount) : undefined
              }
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
              accessibilityLabel="Alterar ordenação dos shows"
              compact
              label="Ordenar"
              onChange={(value) => update('sort', value)}
              options={showSorts}
              value={state.sort}
            />
          </>
        ) : null}
      </View>
    </ListControls>
  );
  const hasQuery =
    state.search.length > 0 ||
    state.period !== 'upcoming' ||
    state.status !== 'active';

  return (
    <BandAreaLayout
      activeSection="shows"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'shows') as string}
      fixedContent={controls}
      scrollable={false}
      title="Shows"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {showsQuery.isPending || songsQuery.isPending ? (
        <LoadingFeedback variation={1} />
      ) : null}
      {showsQuery.isError || songsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showsQuery.refetch();
            void songsQuery.refetch();
          }}
        />
      ) : null}

      {state.view === 'list' ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          data={shows}
          keyExtractor={({ id }) => id}
          ListEmptyComponent={
            !showsQuery.isPending &&
            !songsQuery.isPending &&
            !showsQuery.isError &&
            !songsQuery.isError ? (
              <ListEmptyState
                actionLabel={hasQuery ? 'Limpar filtros' : undefined}
                message={
                  hasQuery
                    ? 'Nem o roadie encontrou essa. Tente outra busca.'
                    : 'A agenda ainda está em silêncio. Que tal marcar o próximo show?'
                }
                onAction={hasQuery ? clearFilters : undefined}
                title={
                  hasQuery ? 'Nenhum show encontrado' : 'Nenhum show por aqui'
                }
              />
            ) : null
          }
          onScroll={(event) =>
            rememberListScrollOffset(event, rememberScrollOffset)
          }
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
          testID="shows-list"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          <MonthCalendar
            initialDate={now}
            renderShow={(show) => (
              <ShowListRow
                accessibilityLabel={`Abrir show ${show.name}`}
                durationMs={getShowDurationMs(show, songsById)}
                href={getShowHref(bandId, show.id)}
                show={show}
              />
            )}
            shows={shows}
          />
        </ScrollView>
      )}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  controlToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
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
  calendarContent: {
    padding: spacing.xl,
  },
});
