import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import type { BandRole, ShowSummary } from '@/domain';
import { ShowsScreen } from '@/features/shows/ShowsScreen';
import { createShow, createShowSummary, createSong } from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const BAND_ID = 'band-shows-screen';
const OWNER_USER_ID = 'user-shows-owner';
const MEMBER_USER_ID = 'user-shows-member';
const SHOWS = [
  createShow({
    id: 'show-ensaios-abertos',
    bandId: BAND_ID,
    name: 'Ensaio Aberto',
    startsAt: '2026-09-19T16:00:00-03:00',
    venue: 'Estúdio Central',
  }),
  createShow({
    id: 'show-bairro',
    bandId: BAND_ID,
    name: 'Show do Bairro',
    startsAt: '2026-09-19T21:30:00-03:00',
    venue: 'Centro Comunitário',
    status: 'ready',
  }),
  createShow({
    id: 'show-festival-praca',
    bandId: BAND_ID,
    name: 'Festival da Praça',
    startsAt: '2027-02-20T21:00:00-03:00',
    venue: 'Praça Central',
    status: 'ready',
  }),
  createShow({
    id: 'show-independencia',
    bandId: BAND_ID,
    name: 'Show de feriado',
    startsAt: '2026-09-07T19:00:00-03:00',
    venue: 'Praça da República',
  }),
  createShow({
    id: 'show-inverno',
    bandId: BAND_ID,
    name: 'Encontro de Inverno',
    startsAt: '2026-07-18T19:00:00-03:00',
    venue: 'Centro Cultural',
    status: 'cancelled',
  }),
];
const SONGS = [
  createSong({
    id: 'song-shows-lights',
    bandId: BAND_ID,
    title: 'Luzes da Cidade',
    estimatedDurationMs: 218_000,
  }),
];

function renderShows({
  role = 'owner',
  now = new Date('2026-09-09T12:00:00-03:00'),
  viewportWidth = 390,
}: {
  role?: BandRole;
  now?: Date;
  viewportWidth?: number;
} = {}) {
  const currentUserId = role === 'member' ? MEMBER_USER_ID : OWNER_USER_ID;
  const scenario = createBandScenario({
    bandId: BAND_ID,
    userId: currentUserId,
    role,
    songs: SONGS,
    shows: SHOWS,
  });

  return render(
    <AppProviders
      currentUserId={scenario.currentUserId}
      repositories={scenario.repositories}
    >
      <ShowsScreen
        bandId={scenario.band.id}
        now={now}
        viewportWidth={viewportWidth}
      />
    </AppProviders>,
  );
}

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

describe('<ShowsScreen />', () => {
  it.each([{ width: 390 }, { width: 820 }, { width: 1440 }])(
    'mantém a lista compacta e rolável em $width px',
    async ({ width }) => {
      const view = await renderShows({ viewportWidth: width });

      expect(await view.findByText('Festival da Praça')).toBeTruthy();
      expect(view.getByTestId('shows-list')).toBeTruthy();
      expect(view.getByLabelText('Buscar show por nome ou local')).toBeTruthy();
    },
  );

  it('considera shows de hoje como próximos mesmo após o horário', async () => {
    const view = await renderShows({
      now: new Date('2026-09-19T23:00:00-03:00'),
    });

    expect(await view.findByText('Ensaio Aberto')).toBeTruthy();
    expect(view.getByText('Show do Bairro')).toBeTruthy();
  });

  it('busca shows e mantém cancelados fora da agenda ativa', async () => {
    const view = await renderShows({
      now: new Date('2026-09-09T12:00:00-03:00'),
    });

    await view.findByText('Ensaio Aberto');
    expect(
      view.getByLabelText('Abrir filtros dos shows').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      view.getByLabelText('Alterar ordenação dos shows').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    expect(view.getByLabelText('Abrir filtros dos shows')).toBeTruthy();
    expect(view.queryByText('Encontro de Inverno')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      'praça',
    );

    expect(view.getByText('Festival da Praça')).toBeTruthy();
    expect(view.queryByText('Ensaio Aberto')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    await fireEvent.press(view.getAllByLabelText('Todos')[0]);
    await fireEvent.press(view.getByLabelText('Cancelado'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    expect(await view.findByText('Encontro de Inverno')).toBeTruthy();
  });

  it('conta filtros ativos e restaura o padrão pelo botão Limpar', async () => {
    const view = await renderShows({
      now: new Date('2026-09-09T12:00:00-03:00'),
    });

    await view.findByText('Ensaio Aberto');
    expect(view.getByLabelText('Abrir filtros dos shows')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });

    await fireEvent.press(view.getAllByLabelText('Todos')[0]);
    await fireEvent.press(view.getAllByLabelText('Todos')[1]);
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    expect(
      view.getByLabelText('Abrir filtros dos shows').props.accessibilityState
        ?.selected,
    ).toBeUndefined();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    await fireEvent.press(view.getByLabelText('Limpar filtros'));

    expect(view.queryByLabelText('Aplicar filtros')).toBeNull();
    expect(
      view.getByLabelText('Abrir filtros dos shows').props.accessibilityState
        ?.selected,
    ).toBe(true);

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
  });

  it('usa o calendário como filtro direto da lista geral de shows', async () => {
    const view = await renderShows({
      now: new Date('2026-09-09T12:00:00-03:00'),
    });

    await view.findByText('Ensaio Aberto');
    expect(view.getByLabelText('Abrir filtros dos shows')).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      'praça',
    );
    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );

    expect(view.getByTestId('shows-month-calendar')).toBeTruthy();
    expect(view.getByLabelText('Abrir filtros dos shows')).toBeTruthy();
    expect(view.getByLabelText('Alterar ordenação dos shows')).toBeTruthy();
    expect(view.getByLabelText(/19 de setembro de 2026, 2 shows/)).toBeTruthy();
    expect(view.queryByText('Independência do Brasil')).toBeNull();

    await fireEvent.press(view.getByLabelText('Fechar calendário'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      '',
    );
    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );

    await fireEvent.press(
      view.getByLabelText(/7 de setembro de 2026, Independência do Brasil/),
    );
    expect(view.getByText('Show de feriado')).toBeTruthy();
    expect(view.queryByTestId('shows-month-calendar')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );
    await fireEvent.press(
      view.getByLabelText(/19 de setembro de 2026, 2 shows/),
    );

    expect(
      view.getByLabelText('Abrir filtros dos shows').props.accessibilityState
        ?.selected,
    ).toBe(true);
    expect(view.getByText('Ensaio Aberto')).toBeTruthy();
    expect(view.getByText('Show do Bairro')).toBeTruthy();
    expect(view.queryByText('Festival da Praça')).toBeNull();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getAllByLabelText('Todos')[0].props.accessibilityState).toEqual(
      { checked: true },
    );
    expect(view.getAllByLabelText('Todos')[1].props.accessibilityState).toEqual(
      { checked: true },
    );
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await fireEvent.press(view.getByLabelText('Criar novo show'));
    expect(view.getByTestId('show-creation-dialog')).toBeTruthy();
    expect(view.getByLabelText('Selecionar data do show')).toBeTruthy();
    expect(view.getAllByText('19 set 2026').length).toBeGreaterThanOrEqual(2);
    expect(view.getByLabelText('Hora do show')).toBeTruthy();
    expect(view.getByLabelText('Minutos do show')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Selecionar data do show'));
    expect(view.getByTestId('shows-month-calendar')).toBeTruthy();
    expect(view.getByLabelText(/19 de setembro de 2026, 2 shows/)).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('19 de setembro de 2026, 2 shows'),
    );
    expect(view.queryByTestId('shows-month-calendar')).toBeNull();

    await fireEvent.press(view.getByLabelText(/Remover filtro de data/));
    expect(
      view.getByLabelText('Abrir filtros dos shows').props.accessibilityState
        ?.selected,
    ).toBe(true);
    expect(view.getByText('Festival da Praça')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });
  });

  it('oculta a criação de show para integrante sem permissão de edição', async () => {
    const view = await renderShows({ role: 'member' });

    await view.findByText('Festival da Praça');
    expect(view.queryByLabelText('Criar novo show')).toBeNull();
    view.unmount();
  });

  it('usa duração do resumo do servidor sem buscar músicas nem documentos de shows', async () => {
    const scenario = createBandScenario({
      bandId: BAND_ID,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: SONGS,
      shows: SHOWS,
    });
    const listSummaries = jest
      .spyOn(scenario.repositories.shows, 'listSummariesByBandId')
      .mockResolvedValue([
        createShowSummary({
          bandId: BAND_ID,
          estimatedDurationMs: 60_000,
          id: 'short-show',
          name: 'Show Curto',
          startsAt: '2026-09-19T16:00:00-03:00',
          status: 'draft',
          venue: 'Estúdio',
        }),
        createShowSummary({
          bandId: BAND_ID,
          estimatedDurationMs: 180_000,
          id: 'long-show',
          name: 'Show Longo',
          startsAt: '2026-09-19T18:00:00-03:00',
          status: 'ready',
          venue: 'Teatro',
        }),
      ]);
    const listFullShows = jest.spyOn(
      scenario.repositories.shows,
      'listByBandId',
    );
    const listSongs = jest.spyOn(scenario.repositories.songs, 'listByBandId');
    const view = await render(
      <AppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowsScreen
          bandId={BAND_ID}
          now={new Date('2026-09-09T12:00:00-03:00')}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Show Curto')).toBeTruthy();
    expect(view.getByLabelText('Duração 3min')).toBeTruthy();
    expect(listSummaries).toHaveBeenCalledTimes(1);
    expect(listSummaries).toHaveBeenCalledWith(BAND_ID);
    expect(listFullShows).not.toHaveBeenCalled();
    expect(listSongs).not.toHaveBeenCalled();

    await fireEvent.press(view.getByLabelText('Alterar ordenação dos shows'));
    await fireEvent.press(view.getByLabelText('Maior duração'));
    const orderedRows = view
      .getAllByLabelText(/^Abrir show /)
      .map((row) => row.props.accessibilityLabel);
    expect(orderedRows[0]).toContain('Show Longo');
    expect(orderedRows[1]).toContain('Show Curto');
  });

  it('exibe os cards enquanto o contexto de permissões ainda está carregando', async () => {
    const scenario = createBandScenario({
      bandId: BAND_ID,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: SONGS,
      shows: SHOWS,
    });
    let resolveContext:
      | ((
          context: Awaited<
            ReturnType<typeof scenario.repositories.bands.getContext>
          >,
        ) => void)
      | undefined;
    const getContext = jest
      .spyOn(scenario.repositories.bands, 'getContext')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveContext = resolve;
          }),
      );
    const view = await render(
      <AppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowsScreen
          bandId={BAND_ID}
          now={new Date('2026-09-09T12:00:00-03:00')}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Ensaio Aberto')).toBeTruthy();
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(view.queryByLabelText('Criar novo show')).toBeNull();

    await act(async () => {
      resolveContext?.({
        bandId: BAND_ID,
        bandName: 'Banda de teste',
        hasActiveSongs: true,
        role: 'owner',
      });
    });
    expect(await view.findByLabelText('Criar novo show')).toBeTruthy();
  });

  it('mantém estrutura, navegação e loading acessíveis enquanto os shows demoram', async () => {
    const scenario = createBandScenario({
      bandId: BAND_ID,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: SONGS,
      shows: SHOWS,
    });
    let resolveShows: ((shows: readonly ShowSummary[]) => void) | undefined;
    jest
      .spyOn(scenario.repositories.shows, 'listSummariesByBandId')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveShows = resolve;
          }),
      );
    const view = await render(
      <AppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowsScreen
          bandId={BAND_ID}
          now={new Date('2026-09-09T12:00:00-03:00')}
        />
      </AppProviders>,
    );

    expect(view.getByTestId('app-header')).toBeTruthy();
    expect(view.getByLabelText('Abrir menu geral')).toBeTruthy();
    expect(view.getByTestId('bottom-navigation')).toBeTruthy();
    expect(view.getByLabelText('Ir para Repertório')).toBeTruthy();
    expect(view.getByTestId('feedback-loading')).toBeTruthy();
    expect(view.queryByText('Nenhum show por aqui')).toBeNull();
    expect(view.queryByText('A agenda ainda está em silêncio.')).toBeNull();

    await act(async () => {
      resolveShows?.([
        createShowSummary({
          bandId: BAND_ID,
          estimatedDurationMs: 120_000,
          id: 'show-delayed',
          name: 'Show carregado',
          startsAt: '2026-09-19T16:00:00-03:00',
          status: 'draft',
          venue: 'Estúdio',
        }),
      ]);
    });

    expect(await view.findByText('Show carregado')).toBeTruthy();
  });

  it('preserva os cards quando falha apenas a consulta de contexto', async () => {
    const scenario = createBandScenario({
      bandId: BAND_ID,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: SONGS,
      shows: SHOWS,
    });
    jest
      .spyOn(scenario.repositories.bands, 'getContext')
      .mockRejectedValue(new Error('context unavailable'));
    const view = await render(
      <AppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowsScreen
          bandId={BAND_ID}
          now={new Date('2026-09-09T12:00:00-03:00')}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Ensaio Aberto')).toBeTruthy();
    await waitFor(() =>
      expect(
        view.getByText('Não foi possível confirmar o acesso'),
      ).toBeTruthy(),
    );
    expect(view.queryByLabelText('Criar novo show')).toBeNull();
  });
});
