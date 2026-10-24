import {
  createEventInCalendarAsync,
  type DialogEventResult,
} from 'expo-calendar/legacy';

import type { CalendarEventCopy } from './showCalendarModel';

export type NativeCalendarResult =
  | { readonly status: 'saved' }
  | { readonly status: 'cancelled' }
  | { readonly status: 'returned' }
  | { readonly status: 'unsupported' };

export async function openNativeCalendarForm(
  event: CalendarEventCopy,
): Promise<NativeCalendarResult> {
  const result: DialogEventResult = await createEventInCalendarAsync(
    {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      notes: event.description,
      timeZone: event.timeZone,
    },
    { startNewActivityTask: false },
  );
  if (result.action === 'saved') return { status: 'saved' };
  if (result.action === 'canceled') return { status: 'cancelled' };
  return { status: 'returned' };
}
