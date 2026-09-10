import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { Show } from '@/domain';
import {
  getBrazilianNationalHolidays,
  getSaoPauloDateKey,
} from '@/features/calendar/brazilianHolidays';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface MonthCalendarProps {
  readonly initialDate?: Date;
  readonly renderShow: (show: Show) => ReactNode;
  readonly shows: readonly Show[];
}

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

function getDateParts(dateKey: string): {
  day: number;
  month: number;
  year: number;
} {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { day, month: month - 1, year };
}

function createDateKey(year: number, month: number, day: number): string {
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function getMonthCells(
  year: number,
  month: number,
): readonly (number | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from<number | null>({ length: 42 }).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells[firstWeekday + day - 1] = day;
  }

  return cells;
}

function formatSelectedDate(dateKey: string): string {
  const { day, month, year } = getDateParts(dateKey);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, day)));
}

export function MonthCalendar({
  initialDate = new Date(),
  renderShow,
  shows,
}: MonthCalendarProps) {
  const todayKey = getSaoPauloDateKey(initialDate);
  const todayParts = getDateParts(todayKey);
  const [visibleMonth, setVisibleMonth] = useState({
    month: todayParts.month,
    year: todayParts.year,
  });
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const cells = useMemo(
    () => getMonthCells(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const holidays = useMemo(
    () => getBrazilianNationalHolidays(visibleMonth.year),
    [visibleMonth.year],
  );
  const holidaysByDate = new Map(
    holidays.map((holiday) => [holiday.dateKey, holiday]),
  );
  const showsByDate = new Map<string, Show[]>();

  shows.forEach((show) => {
    const dateKey = getSaoPauloDateKey(show.startsAt);
    const dateShows = showsByDate.get(dateKey) ?? [];
    dateShows.push(show);
    showsByDate.set(dateKey, dateShows);
  });

  const selectedShows = [...(showsByDate.get(selectedDateKey) ?? [])].sort(
    (left, right) => left.startsAt.localeCompare(right.startsAt),
  );
  const selectedHoliday = holidaysByDate.get(selectedDateKey);
  const monthName = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)));
  const monthLabel = `${monthName} / ${visibleMonth.year}`;
  const accessibleMonthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)));

  const moveMonth = (amount: number) => {
    const date = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.month + amount, 1),
    );
    const nextMonth = date.getUTCMonth();
    const nextYear = date.getUTCFullYear();

    setVisibleMonth({ month: nextMonth, year: nextYear });
    setSelectedDateKey(createDateKey(nextYear, nextMonth, 1));
  };

  return (
    <View style={styles.container} testID="shows-month-calendar">
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="Mês anterior"
          accessibilityRole="button"
          onPress={() => moveMonth(-1)}
          style={({ pressed }) => [
            styles.monthButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">←</AppText>
        </Pressable>
        <AppText
          accessibilityRole="header"
          style={styles.monthLabel}
          variant="heading"
        >
          {monthLabel}
        </AppText>
        <Pressable
          accessibilityLabel="Próximo mês"
          accessibilityRole="button"
          onPress={() => moveMonth(1)}
          style={({ pressed }) => [
            styles.monthButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">→</AppText>
        </Pressable>
      </View>

      <View style={styles.calendarGrid}>
        {weekdays.map((weekday, index) => (
          <View
            key={weekday}
            style={[
              styles.weekday,
              (index === 0 || index === 6) && styles.weekend,
            ]}
          >
            <AppText
              style={styles.weekdayLabel}
              tone={index === 0 || index === 6 ? 'accent' : 'muted'}
              variant="caption"
            >
              {weekday}
            </AppText>
          </View>
        ))}

        {cells.map((day, index) => {
          const column = index % 7;
          const weekend = column === 0 || column === 6;

          if (day === null) {
            return (
              <View
                key={`empty-${index}`}
                style={[styles.dayCell, weekend && styles.weekend]}
              />
            );
          }

          const dateKey = createDateKey(
            visibleMonth.year,
            visibleMonth.month,
            day,
          );
          const dayShows = showsByDate.get(dateKey) ?? [];
          const holiday = holidaysByDate.get(dateKey);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;
          const showDescription =
            dayShows.length === 0
              ? 'sem shows'
              : `${dayShows.length} ${dayShows.length === 1 ? 'show' : 'shows'}`;

          return (
            <Pressable
              accessibilityLabel={`${isToday ? 'Hoje, ' : ''}${day} de ${accessibleMonthLabel}, ${
                holiday ? `${holiday.name}, ` : ''
              }${showDescription}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={dateKey}
              onPress={() => setSelectedDateKey(dateKey)}
              testID={`calendar-day-${dateKey}`}
              style={({ pressed }) => [
                styles.dayCell,
                weekend && styles.weekend,
                dayShows.length > 0 && styles.eventDay,
                holiday && styles.holiday,
                isToday && styles.today,
                isSelected && styles.selectedDay,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.dayNumber} variant="caption">
                {day}
              </AppText>
              {dayShows.length > 0 ? (
                <View style={styles.showMarker}>
                  <AppText tone="inverse" variant="caption">
                    {dayShows.length === 1 ? '•' : dayShows.length}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedDayShows}>
        <AppText accessibilityRole="header" variant="heading">
          {formatSelectedDate(selectedDateKey)}
        </AppText>
        {selectedHoliday ? (
          <AppText tone="accent">{selectedHoliday.name}</AppText>
        ) : null}
        {selectedShows.length === 0 ? (
          <AppText tone="muted">
            Agenda livre. Até o amplificador pode descansar.
          </AppText>
        ) : (
          selectedShows.map((show) => (
            <View key={show.id}>{renderShow(show)}</View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    gap: spacing.lg,
    maxWidth: 920,
    width: '100%',
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  weekday: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    minHeight: 30,
    width: '14.2857%',
  },
  weekdayLabel: {
    fontWeight: '700',
  },
  dayCell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    padding: spacing.xs,
    position: 'relative',
    width: '14.2857%',
  },
  weekend: {
    backgroundColor: colors.violetSoft,
  },
  eventDay: {
    backgroundColor: colors.greenSoft,
  },
  holiday: {
    backgroundColor: '#fff2cc',
  },
  today: {
    backgroundColor: colors.cyanSoft,
  },
  selectedDay: {
    borderBottomColor: colors.violet,
    borderBottomWidth: 2,
    borderLeftColor: colors.violet,
    borderLeftWidth: 2,
    borderRadius: radii.md,
    borderRightColor: colors.violet,
    borderRightWidth: 2,
    borderTopColor: colors.violet,
    borderTopWidth: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  dayNumber: {
    fontWeight: '700',
    textAlign: 'center',
  },
  showMarker: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    bottom: 2,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 16,
    minWidth: 16,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 2,
  },
  selectedDayShows: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
