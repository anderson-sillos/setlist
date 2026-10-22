import type { CalendarEventCopy } from './showCalendarModel';

export type NativeCalendarResult = { readonly status: 'unsupported' };

export async function openNativeCalendarForm(
  _event: CalendarEventCopy,
): Promise<NativeCalendarResult> {
  return { status: 'unsupported' };
}
