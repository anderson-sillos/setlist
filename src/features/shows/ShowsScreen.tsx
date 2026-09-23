import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  DemoActionNotice,
  ErrorFeedback,
  LoadingFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  ChoiceChips,
  FilterMenu,
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { useShows, useSongs, useUserBands } from '@/data/queries';
import type { ShowStatus } from '@/domain';
import { getShowDurationMs } from '@/domain/setlistDuration';
import { getBrazilianNationalHolidays } from '@/features/calendar/brazilianHolidays';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getBandSectionHref, getShowHref } from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { ShowListRow } from '@/features/shows/ShowListRow';
import { colors, radii, spacing } from '@/theme/tokens';
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
  const showsQuery = useShows(bandId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'shows', {
      date: '',
      period: 'upcoming' as ShowPeriod,
      search: '',
      sort: 'date-asc' as ShowSort,
      status: 'active' as ShowStatusFilter,
    });
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canCreate =
    membership?.role === 'owner' || membership?.role === 'editor';
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
        state.period === 'all' ||
        (state.period === 'upcoming' ? startsAt >= now : startsAt < now);
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
  }, [normalizedSearch, now, showsQuery.data, songsById, state]);
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
  const clearFilters = () => {
    update('date', '');
    update('search', '');
    update('period', 'upcoming');
    update('status', 'active');
    update('sort', 'date-asc');
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
      <SearchField
        accessibilityLabel="Buscar show por nome ou local"
        onChangeText={(value) => update('search', value)}
        placeholder="Buscar show ou local"
        value={state.search}
      />
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
          <AppIcon color={colors.violet} name="shows" size={18} />
          <AppText tone="accent" variant="caption">
            Calendário
          </AppText>
        </Pressable>
        <FilterMenu
          accessibilityLabel="Abrir filtros dos shows"
          icon="filter"
          label="Filtros"
          onClear={() => {
            update('date', '');
            update('period', 'upcoming');
            update('status', 'active');
          }}
          summary={String(activeFilterCount)}
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
          icon="sort"
          label="Ordenar"
          onChange={(value) => update('sort', value)}
          options={showSorts}
          value={state.sort}
        />
      </View>
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
            <AppText tone="inverse" variant="caption">
              {selectedDateLabel}
            </AppText>
            <AppIcon color={colors.surface} name="close" size={14} />
          </Pressable>
        ) : null}
        {selectedHoliday ? (
          <AppText tone="accent" variant="body">
            {selectedHoliday.name}
          </AppText>
        ) : null}
      </View>
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

  return (
    <BandAreaLayout
      activeSection="shows"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'shows') as string}
      fixedContent={controls}
      headerAction={
        canCreate
          ? {
              accessibilityLabel: 'Criar novo show',
              icon: 'showAdd',
              label: 'Novo show',
              onPress: () =>
                setDemoNotice(
                  state.date
                    ? `A criação do show em ${selectedDateLabel} entra no próximo incremento.`
                    : 'A criação de shows entra no próximo incremento. O palco já está reservado.',
                ),
            }
          : undefined
      }
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
        ListHeaderComponent={
          <DemoActionNotice
            message={demoNotice}
            onClose={() => setDemoNotice(null)}
          />
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
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  controlToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  dateChip: {
    alignItems: 'center',
    backgroundColor: colors.violet,
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
  pressed: {
    opacity: 0.72,
  },
});
