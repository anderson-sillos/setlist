import {
  createEventInCalendarAsync,
  type DialogEventResult,
} from 'expo-calendar/legacy';

import { openNativeCalendarForm } from '../calendarAction.native';

jest.mock('expo-calendar/legacy', () => ({
  createEventInCalendarAsync: jest.fn(),
}));

const mockCreateEvent = jest.mocked(createEventInCalendarAsync);

describe('adaptador do formulário nativo de calendário', () => {
  beforeEach(() => jest.clearAllMocks());

  const event = {
    title: 'Banda — Show',
    location: 'Teatro',
    description: 'Cópia pontual',
    startDate: new Date('2026-10-23T01:00:00.000Z'),
    endDate: new Date('2026-10-23T02:00:00.000Z'),
    timeZone: 'America/Sao_Paulo',
  };

  it.each([
    ['saved', { status: 'saved' }],
    ['canceled', { status: 'cancelled' }],
    ['done', { status: 'returned' }],
  ] as const)('normaliza o resultado nativo %s', async (action, expected) => {
    mockCreateEvent.mockResolvedValue({
      action: action as DialogEventResult['action'],
      id: null,
    });

    await expect(openNativeCalendarForm(event)).resolves.toEqual(expected);
    expect(mockCreateEvent).toHaveBeenCalledWith(
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
  });

  it('propaga falha do formulário sem iniciar outra forma de criação', async () => {
    mockCreateEvent.mockRejectedValue(new Error('calendar unavailable'));

    await expect(openNativeCalendarForm(event)).rejects.toThrow(
      'calendar unavailable',
    );
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
  });
});
