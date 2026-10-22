import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  downloadDocumentFile,
  prepareDocumentFile,
} from '@/features/shows/export/documentDelivery';
import { ShowCalendarScreen } from '@/features/shows/ShowCalendarScreen';
import {
  createShow,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn().mockResolvedValue('a'.repeat(64)),
}));

const mockOpenNativeCalendarForm = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/features/shows/export/calendarAction', () => ({
  openNativeCalendarForm: (...args: unknown[]) =>
    mockOpenNativeCalendarForm(...args),
}));

jest.mock('@/features/shows/export/documentDelivery', () => ({
  canShareDocumentFile: jest.fn().mockResolvedValue(true),
  cleanupExpiredDocumentFiles: jest.fn().mockResolvedValue(undefined),
  downloadDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
  prepareDocumentFile: jest.fn(),
  releaseDocumentFile: jest.fn(),
  shareDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
}));

describe('<ShowCalendarScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(prepareDocumentFile).mockResolvedValue({
      name: 'show-2026-10-24.ics',
      mimeType: 'text/calendar;charset=utf-8',
      uri: 'file:///show.ics',
      size: 64,
    });
    jest.mocked(downloadDocumentFile).mockResolvedValue({ status: 'opened' });
  });

  it('prepara uma cópia editável sem observações e não altera o show salvo', async () => {
    const bandId = 'band-show-calendar';
    const showId = 'show-calendar';
    const userId = 'user-show-calendar';
    const song = createSong({
      id: 'song-show-calendar',
      bandId,
      title: 'Música que não deve ir ao calendário',
      estimatedDurationMs: 90 * 60_000,
    });
    const show = createShow({
      id: showId,
      bandId,
      name: 'Show para agenda',
      startsAt: '2026-10-24T22:00:00-03:00',
      notes: 'Observação que precisa de escolha',
      blocks: [
        createShowSetlistBlock({
          items: [createShowSongSetlistItem({ songId: song.id })],
        }),
      ],
    });
    const scenario = createBandScenario({
      bandId,
      userId,
      role: 'member',
      songs: [song],
      shows: [show],
    });
    mockOpenNativeCalendarForm.mockResolvedValue({ status: 'returned' });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowCalendarScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    expect(await view.findByText(/Show para agenda/)).toBeTruthy();
    expect(
      view.getByLabelText('Incluir observações gerais do show').props
        .accessibilityState.checked,
    ).toBe(false);
    expect(view.getByDisplayValue('2026-10-24')).toBeTruthy();
    expect(view.getByDisplayValue('23:30')).toBeTruthy();
    expect(view.queryByText('Música que não deve ir ao calendário')).toBeNull();

    await fireEvent.press(view.getByText('Abrir formulário do calendário'));
    await waitFor(() => expect(mockOpenNativeCalendarForm).toHaveBeenCalled());

    const event = mockOpenNativeCalendarForm.mock.calls[0]?.[0];
    expect(event.title).toBe('Banda de teste — Show para agenda');
    expect(event.startDate.toISOString()).toBe('2026-10-25T01:00:00.000Z');
    expect(event.endDate.toISOString()).toBe('2026-10-25T02:30:00.000Z');
    expect(event.description).not.toContain(
      'Observação que precisa de escolha',
    );
    expect(event.description).not.toContain(
      'Música que não deve ir ao calendário',
    );
    expect(
      view.getByText(
        'O formulário do calendário foi aberto e retornou. Confira se o evento foi salvo; o sistema não confirmou esse resultado.',
      ),
    ).toBeTruthy();
    expect(prepareDocumentFile).not.toHaveBeenCalled();

    mockOpenNativeCalendarForm.mockResolvedValueOnce({ status: 'cancelled' });
    await fireEvent.press(view.getByText('Abrir formulário do calendário'));
    expect(
      await view.findByText(
        'Criação cancelada. Nenhuma outra cópia foi criada.',
      ),
    ).toBeTruthy();
    expect(prepareDocumentFile).not.toHaveBeenCalled();

    mockOpenNativeCalendarForm.mockResolvedValueOnce({ status: 'saved' });
    await fireEvent.press(view.getByText('Abrir formulário do calendário'));
    expect(
      await view.findByText(
        'O calendário confirmou que o evento foi salvo. Esta é uma cópia pontual.',
      ),
    ).toBeTruthy();
    expect(prepareDocumentFile).not.toHaveBeenCalled();

    mockOpenNativeCalendarForm.mockRejectedValueOnce(
      new Error('calendar unavailable'),
    );
    await fireEvent.press(view.getByText('Abrir formulário do calendário'));
    expect(await view.findByText('calendar unavailable')).toBeTruthy();
    expect(view.getByDisplayValue('2026-10-24')).toBeTruthy();
    expect(prepareDocumentFile).not.toHaveBeenCalled();
  });

  it('impede preparar uma cópia ativa para um show cancelado', async () => {
    const bandId = 'band-cancelled-calendar';
    const showId = 'show-cancelled-calendar';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-cancelled-calendar',
      role: 'member',
      shows: [
        createShow({
          id: showId,
          bandId,
          status: 'cancelled',
        }),
      ],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowCalendarScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    expect(await view.findByText('Show cancelado')).toBeTruthy();
    expect(
      view.getByText(
        'Um show Cancelado não pode ser adicionado como novo evento ativo.',
      ),
    ).toBeTruthy();
    expect(view.queryByText('Preparar arquivo .ics')).toBeNull();
    expect(view.queryByText('Abrir formulário do calendário')).toBeNull();
    expect(mockOpenNativeCalendarForm).not.toHaveBeenCalled();
  });

  it('gera e entrega .ics somente após a ação explícita, mesmo sem compartilhamento', async () => {
    const bandId = 'band-ics-calendar';
    const showId = 'show-ics-calendar';
    const userId = 'user-ics-calendar';
    const song = createSong({
      id: 'song-ics-calendar',
      bandId,
      estimatedDurationMs: 60 * 60_000,
    });
    const scenario = createBandScenario({
      bandId,
      userId,
      role: 'member',
      songs: [song],
      shows: [
        createShow({
          id: showId,
          bandId,
          startsAt: '2026-10-24T20:00:00-03:00',
          blocks: [
            createShowSetlistBlock({
              items: [createShowSongSetlistItem({ songId: song.id })],
            }),
          ],
        }),
      ],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowCalendarScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText(/Show de teste/);
    expect(prepareDocumentFile).not.toHaveBeenCalled();
    await fireEvent.press(view.getByText('Preparar arquivo .ics'));
    expect(
      await view.findByText(/Arquivo preparado: show-2026-10-24\.ics/),
    ).toBeTruthy();
    expect(prepareDocumentFile).toHaveBeenCalledWith(
      'banda-de-teste-show-de-teste-2026-10-24.ics',
      'text/calendar;charset=utf-8',
      expect.any(Uint8Array),
    );

    jest
      .mocked(downloadDocumentFile)
      .mockResolvedValueOnce({ status: 'cancelled' });
    await fireEvent.press(
      view.getByText('Abrir seletor para salvar ou compartilhar .ics'),
    );
    expect(await view.findByText(/Compartilhamento cancelado/)).toBeTruthy();

    jest
      .mocked(downloadDocumentFile)
      .mockResolvedValueOnce({ status: 'unsupported' });
    await fireEvent.press(
      view.getByText('Abrir seletor para salvar ou compartilhar .ics'),
    );
    expect(await view.findByText(/Compartilhamento indisponível/)).toBeTruthy();

    jest
      .mocked(downloadDocumentFile)
      .mockRejectedValueOnce(new Error('download offline'));
    await fireEvent.press(
      view.getByText('Abrir seletor para salvar ou compartilhar .ics'),
    );
    expect(await view.findByText('download offline')).toBeTruthy();
    expect(
      view.getByText('Abrir seletor para salvar ou compartilhar .ics'),
    ).toBeTruthy();

    await fireEvent.press(
      view.getByText('Abrir seletor para salvar ou compartilhar .ics'),
    );
    await waitFor(() => expect(downloadDocumentFile).toHaveBeenCalledTimes(4));
    expect(
      view.getByText(
        'O seletor do sistema foi aberto para salvar ou compartilhar o arquivo.',
      ),
    ).toBeTruthy();
  });
});
