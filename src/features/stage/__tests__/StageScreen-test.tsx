import { act, fireEvent, render } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import { StageScreen, buildStageItems } from '@/features/stage/StageScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
}));

describe('<StageScreen />', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('mostra letra estática, setlist e controla o cronômetro local', async () => {
    const view = await render(
      <AppProviders>
        <StageScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByTestId('stage-layout-phone')).toBeTruthy();
    expect(view.getByText('Instrumental de Abertura')).toBeTruthy();
    expect(view.getByLabelText('Sair do modo palco')).toBeTruthy();

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-08T20:00:00.000Z'));

    await fireEvent.press(view.getByRole('button', { name: 'Iniciar' }));
    await act(() => jest.advanceTimersByTime(1_250));
    expect(view.getByTestId('elapsed-time').props.children).toBe('00:01');

    await fireEvent.press(view.getByRole('button', { name: 'Pausar' }));
    await act(() => jest.advanceTimersByTime(2_000));
    expect(view.getByTestId('elapsed-time').props.children).toBe('00:01');

    await fireEvent.press(view.getByRole('button', { name: 'Retomar' }));
    await act(() => jest.advanceTimersByTime(1_000));
    expect(view.getByTestId('elapsed-time').props.children).toBe('00:02');

    await fireEvent.press(view.getByRole('button', { name: 'Reiniciar' }));
    expect(view.getByTestId('elapsed-time').props.children).toBe('00:00');

    await view.unmount();
  });

  it('bloqueia o modo palco para show cancelado', async () => {
    const view = await render(
      <AppProviders>
        <StageScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-arquivo"
          viewportWidth={1440}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Show cancelado')).toBeTruthy();
    expect(
      view.queryByText('Cronômetro independente neste aparelho'),
    ).toBeNull();
  });

  it('mantém referência nula quando uma música da setlist não está disponível', () => {
    const show = {
      bandId: demoIds.primaryBand,
      blocks: [
        {
          id: 'block',
          items: [{ id: 'item', notes: null, songId: 'unknown' }],
          name: 'Principal',
        },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      id: 'show',
      name: 'Show',
      notes: null,
      startsAt: '2026-09-01T20:00:00-03:00',
      status: 'draft' as const,
      updatedAt: '2026-09-01T00:00:00.000Z',
      venue: 'Local',
    };

    expect(buildStageItems(show, [])[0]?.song).toBeNull();
  });
});
