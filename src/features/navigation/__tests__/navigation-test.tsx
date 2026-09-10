import { fireEvent, render, renderHook } from '@testing-library/react-native';

import BandRoute from '@/app/bands/[bandId]/band';
import RepertoireRoute from '@/app/bands/[bandId]/repertoire';
import SongDetailRoute from '@/app/bands/[bandId]/repertoire/[songId]';
import ShowsRoute from '@/app/bands/[bandId]/shows';
import ShowDetailRoute from '@/app/bands/[bandId]/shows/[showId]';
import StageRoute from '@/app/bands/[bandId]/shows/[showId]/stage';
import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import {
  BandScreen,
  RepertoireScreen,
  ShowsScreen,
} from '@/features/navigation/BandSectionScreens';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import BandsScreen from '@/features/navigation/BandsScreen';
import {
  formatDuration,
  ShowDetailScreen,
  SongDetailScreen,
} from '@/features/navigation/ContentDetailScreens';
import {
  formatRelativeUpdate,
  normalizeForSearch,
} from '@/features/navigation/display';
import {
  getBandSectionHref,
  getShowHref,
  getSongHref,
  getStageHref,
} from '@/features/navigation/routes';
import {
  NavigationMemoryProvider,
  useNavigationMemory,
} from '@/features/navigation/NavigationMemory';
import { AppProviders, useAppData } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useLocalSearchParams: () => ({
    bandId: 'band-demo-horizonte',
    showId: 'show-demo-festival',
    songId: 'song-demo-luzes',
  }),
}));

describe('navegação inicial', () => {
  it('define os caminhos de Shows, Repertório e Banda', () => {
    expect(getBandSectionHref(demoIds.primaryBand, 'shows')).toBe(
      `/bands/${demoIds.primaryBand}/shows`,
    );
    expect(getBandSectionHref(demoIds.primaryBand, 'repertoire')).toBe(
      `/bands/${demoIds.primaryBand}/repertoire`,
    );
    expect(getBandSectionHref(demoIds.primaryBand, 'band')).toBe(
      `/bands/${demoIds.primaryBand}/band`,
    );
    expect(getBandSectionHref('banda com espaço', 'shows')).toBe(
      '/bands/banda%20com%20espa%C3%A7o/shows',
    );
    expect(getShowHref(demoIds.primaryBand, demoIds.readyShow)).toBe(
      `/bands/${demoIds.primaryBand}/shows/${demoIds.readyShow}`,
    );
    expect(getSongHref(demoIds.primaryBand, demoIds.stageSong)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/${demoIds.stageSong}`,
    );
    expect(getStageHref(demoIds.primaryBand, demoIds.readyShow)).toBe(
      `/bands/${demoIds.primaryBand}/shows/${demoIds.readyShow}/stage`,
    );
  });

  it('carrega Minhas bandas com os destinos demonstrativos', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen now={new Date('2026-09-09T12:00:00-03:00')} />
      </AppProviders>,
    );

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.getByLabelText('Abrir Banda Horizonte')).toBeTruthy();
    expect(view.getByTestId('bands-list')).toBeTruthy();
    expect(view.getByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Proprietário')).toBeTruthy();
    expect(view.getByText('Integrante')).toBeTruthy();
    expect(view.getAllByText(/Próximo show/)).toHaveLength(2);
  });

  it('busca bandas pelo nome', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.changeText(
      view.getByLabelText('Buscar banda pelo nome'),
      'aurora',
    );

    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.queryByText('Banda Horizonte')).toBeNull();
  });

  it.each([
    {
      Route: ShowsRoute,
      navigationLabel: 'Ir para Shows',
      content: 'Festival da Praça',
    },
    {
      Route: RepertoireRoute,
      navigationLabel: 'Ir para Repertório',
      content: 'Luzes da Cidade',
    },
    {
      Route: BandRoute,
      navigationLabel: 'Ir para Banda',
      content: 'Ana Martins',
    },
  ])(
    'carrega a rota $navigationLabel com os dados da banda',
    async ({ Route, navigationLabel, content }) => {
      const view = await render(
        <AppProviders>
          <Route />
        </AppProviders>,
      );

      expect(await view.findByText(content)).toBeTruthy();
      expect(view.getAllByText('Banda Horizonte').length).toBeGreaterThan(0);
      expect(view.getByLabelText(navigationLabel)).toBeTruthy();
      expect(view.getByLabelText('Abrir menu geral')).toBeTruthy();
    },
  );

  it.each([
    {
      height: 844,
      presentation: 'bottom-navigation',
      width: 390,
    },
    {
      height: 1180,
      presentation: 'bottom-navigation',
      width: 820,
    },
    {
      height: 768,
      presentation: 'navigation-sidebar',
      width: 1024,
    },
    {
      height: 900,
      presentation: 'navigation-sidebar',
      width: 1440,
    },
  ])(
    'usa $presentation em ${width}x${height}',
    async ({ height, presentation, width }) => {
      const view = await render(
        <AppProviders>
          <ShowsScreen
            bandId={demoIds.primaryBand}
            viewportHeight={height}
            viewportWidth={width}
          />
        </AppProviders>,
      );

      expect(await view.findByText('Festival da Praça')).toBeTruthy();
      expect(view.getByTestId(presentation)).toBeTruthy();
      expect(view.getByTestId('app-header')).toBeTruthy();
      expect(view.getByTestId('screen-static-area')).toBeTruthy();
      expect(view.getByTestId('shows-list')).toBeTruthy();

      if (presentation === 'bottom-navigation') {
        expect(view.queryByTestId('navigation-sidebar')).toBeNull();
      } else {
        expect(view.queryByTestId('bottom-navigation')).toBeNull();
      }
    },
  );

  it('abre e fecha o menu geral no celular', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          viewportHeight={844}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Abrir menu geral'));

    expect(view.getByTestId('navigation-drawer')).toBeTruthy();
    expect(view.getByLabelText('Minhas bandas')).toBeTruthy();
    expect(view.getByText('Conta de demonstração')).toBeTruthy();

    await fireEvent.press(view.getAllByLabelText('Fechar menu geral')[0]);
    expect(view.queryByTestId('navigation-drawer')).toBeNull();
  });

  it.each([{ width: 390 }, { width: 820 }, { width: 1440 }])(
    'mantém a lista compacta e rolável em $width px',
    async ({ width }) => {
      const view = await render(
        <AppProviders>
          <ShowsScreen bandId={demoIds.primaryBand} viewportWidth={width} />
        </AppProviders>,
      );

      expect(await view.findByText('Festival da Praça')).toBeTruthy();
      expect(view.getByTestId('shows-list')).toBeTruthy();
      expect(view.getByLabelText('Buscar show por nome ou local')).toBeTruthy();
    },
  );

  it('apresenta o repertório e os metadados em modo somente leitura', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={820} />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByTestId('repertoire-list')).toBeTruthy();
    expect(view.getByText('Letra estática')).toBeTruthy();
    expect(view.getByText('Sincronização incompleta')).toBeTruthy();
    expect(view.getByText('3:38')).toBeTruthy();
    expect(view.queryByText(/Tom G · BPM/)).toBeNull();
  });

  it('busca, filtra e ordena o repertório sem tirar os controles da tela', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={390} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );

    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Arquivadas'));

    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByText('Maior duração'));

    expect(view.getByLabelText('Alterar ordenação do repertório')).toBeTruthy();
  });

  it('busca shows e mantém cancelados fora da agenda ativa', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Ensaio Aberto');
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
    await fireEvent.press(view.getAllByLabelText('Todos')[0]);
    await fireEvent.press(view.getByLabelText('Cancelado'));

    expect(await view.findByText('Encontro de Inverno')).toBeTruthy();
  });

  it('mostra o calendário mensal, feriados e vários shows no mesmo dia', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Ensaio Aberto');
    await fireEvent.press(view.getByLabelText('Calendário'));

    expect(view.getByTestId('shows-month-calendar')).toBeTruthy();
    expect(view.getByText('7 · Independência do Brasil')).toBeTruthy();

    await fireEvent.press(
      view.getByLabelText(/19 de setembro de 2026, 2 shows/),
    );

    expect(view.getByText('Ensaio Aberto')).toBeTruthy();
    expect(view.getByText('Show do Bairro')).toBeTruthy();
  });

  it.each([
    {
      height: 844,
      mode: 'phone',
      navigation: 'bottom-navigation',
      width: 390,
    },
    {
      height: 1180,
      mode: 'tablet',
      navigation: 'bottom-navigation',
      width: 820,
    },
    {
      height: 900,
      mode: 'desktop',
      navigation: 'navigation-sidebar',
      width: 1440,
    },
  ])(
    'adapta os detalhes ao modo $mode',
    async ({ height, mode, navigation, width }) => {
      const view = await render(
        <AppProviders>
          <SongDetailScreen
            bandId={demoIds.primaryBand}
            now={new Date('2026-09-09T12:00:00-03:00')}
            songId={demoIds.stageSong}
            viewportHeight={height}
            viewportWidth={width}
          />
        </AppProviders>,
      );

      expect(await view.findByText('A rua acende devagar')).toBeTruthy();
      expect(view.getByTestId(`song-detail-${mode}`)).toBeTruthy();
      expect(view.getByTestId(navigation)).toBeTruthy();
      expect(view.getByLabelText('Voltar para Repertório')).toBeTruthy();
      expect(view.getByText('Duração · 3:38')).toBeTruthy();
      expect(view.getByText('Atualizada há 3 dias')).toBeTruthy();
      expect(view.getByLabelText('Abrir referência no YouTube')).toBeTruthy();
    },
  );

  it('mostra dados, blocos, ordem e observações do show', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
          viewportWidth={1440}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Festival da Praça')).toBeTruthy();
    expect(view.getByTestId('show-detail-desktop')).toBeTruthy();
    expect(view.getByText('Abertura')).toBeTruthy();
    expect(view.getByText('Segundo Set')).toBeTruthy();
    expect(view.getByText('Usar a versão curta no bis.')).toBeTruthy();
    expect(view.getAllByText('Luzes da Cidade')).toHaveLength(2);
    expect(view.getByText('19:37')).toBeTruthy();
    expect(view.getByText('Músicas 16:07 · Planejamento 3:30')).toBeTruthy();
    expect(view.getByText('Entrada e apresentação da banda')).toBeTruthy();
    expect(view.getByText('Troca de violão e afinação')).toBeTruthy();
    expect(view.getByText('Interação com o público')).toBeTruthy();
    expect(view.getAllByText('Planejamento')).toHaveLength(3);
    expect(view.getByLabelText('Separador visual')).toBeTruthy();
    expect(view.getByLabelText('Abrir modo palco')).toBeTruthy();
  });

  it('agrupa integrantes e mostra controles apenas para o proprietário', async () => {
    const ownerView = await render(
      <AppProviders>
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await ownerView.findByText('Proprietários · 1')).toBeTruthy();
    expect(ownerView.getByText('Editores · 1')).toBeTruthy();
    expect(ownerView.getByText('Integrantes · 1')).toBeTruthy();
    expect(ownerView.getByText('Você')).toBeTruthy();
    expect(ownerView.getByLabelText('Convidar integrante')).toBeTruthy();
    expect(ownerView.getByLabelText('Administrar Bruno Lima')).toBeTruthy();
    await ownerView.unmount();

    const memberView = await render(
      <AppProviders currentUserId="user-demo-carla">
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await memberView.findByText('Você')).toBeTruthy();
    expect(memberView.queryByLabelText('Convidar integrante')).toBeNull();
    expect(memberView.queryByLabelText('Administrar Bruno Lima')).toBeNull();
  });

  it('oculta ações de edição dos detalhes para integrante', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByText('Editar')).toBeNull();
    expect(view.queryByLabelText('Mais opções da música')).toBeNull();
  });

  it('mantém a navegação inferior no detalhe e usa retorno no cabeçalho', async () => {
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
          viewportHeight={844}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByLabelText('Voltar para Repertório')).toBeTruthy();
    expect(view.getByTestId('bottom-navigation')).toBeTruthy();
    expect(view.queryByLabelText('Abrir menu geral')).toBeNull();
  });

  it.each([
    { height: 844, sidebar: false, width: 390 },
    { height: 1180, sidebar: false, width: 820 },
    { height: 900, sidebar: true, width: 1440 },
  ])(
    'reduz o cabeçalho de edição em ${width}x${height}',
    async ({ height, sidebar, width }) => {
      const onCancel = jest.fn();
      const onSave = jest.fn();
      const view = await render(
        <AppProviders>
          <AppNavigationShell
            activeSection="repertoire"
            bandId={demoIds.primaryBand}
            bandName="Banda Horizonte"
            currentRoute={`/bands/${demoIds.primaryBand}/repertoire/demo/edit`}
            editActions={{ onCancel, onSave }}
            screenKind="edit"
            title="Editar música"
            viewportHeight={height}
            viewportWidth={width}
          >
            <></>
          </AppNavigationShell>
        </AppProviders>,
      );

      await fireEvent.press(view.getByLabelText('Cancelar edição'));
      await fireEvent.press(view.getByLabelText('Salvar edição'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('bottom-navigation')).toBeNull();
      expect(view.queryByLabelText('Abrir menu geral')).toBeNull();
      expect(Boolean(view.queryByTestId('navigation-sidebar'))).toBe(sidebar);
    },
  );

  it('preserva a última rota e rolagem de cada seção', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
    );
    const { result } = await renderHook(() => useNavigationMemory(), {
      wrapper,
    });

    result.current.rememberRoute(
      demoIds.primaryBand,
      'repertoire',
      '/bands/demo/repertoire/song-1',
    );
    result.current.rememberScrollOffset(demoIds.primaryBand, 'repertoire', 248);
    result.current.rememberScrollOffset(demoIds.primaryBand, 'shows', -20);
    result.current.rememberViewState(demoIds.primaryBand, 'repertoire', {
      filter: 'pending',
      search: 'luzes',
      sort: 'title',
    });

    expect(
      result.current.getSectionMemory(demoIds.primaryBand, 'repertoire'),
    ).toEqual({
      route: '/bands/demo/repertoire/song-1',
      scrollOffset: 248,
      viewState: {
        filter: 'pending',
        search: 'luzes',
        sort: 'title',
      },
    });
    expect(
      result.current.getSectionMemory(demoIds.primaryBand, 'shows'),
    ).toEqual({ scrollOffset: 0 });
  });

  it('trata música sem letra e conteúdo não encontrado', async () => {
    const instrumentalView = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId="song-demo-instrumental"
        />
      </AppProviders>,
    );

    expect(
      await instrumentalView.findByText('Sem letra cadastrada'),
    ).toBeTruthy();
    await instrumentalView.unmount();

    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const missingSongView = await render(
      <AppProviders repositories={emptyRepositories}>
        <SongDetailScreen bandId={demoIds.primaryBand} songId="unknown" />
      </AppProviders>,
    );

    expect(
      await missingSongView.findByText('Música não encontrada.'),
    ).toBeTruthy();
    await missingSongView.unmount();

    const missingShowView = await render(
      <AppProviders repositories={emptyRepositories}>
        <ShowDetailScreen bandId={demoIds.primaryBand} showId="unknown" />
      </AppProviders>,
    );

    expect(
      await missingShowView.findByText('Show não encontrado.'),
    ).toBeTruthy();
  });

  it('apresenta estados vazios e permite limpar uma busca sem resultado', async () => {
    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const emptyView = await render(
      <AppProviders repositories={emptyRepositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Repertório vazio')).toBeTruthy();
    await emptyView.unmount();

    const searchView = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await searchView.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      searchView.getByLabelText('Buscar música por título ou artista'),
      'música que não existe',
    );
    expect(searchView.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(searchView.getByText('Limpar filtros'));
    expect(await searchView.findByText('Luzes da Cidade')).toBeTruthy();
  });

  it.each([
    { Route: ShowDetailRoute, content: 'Festival da Praça' },
    { Route: SongDetailRoute, content: 'A rua acende devagar' },
    { Route: StageRoute, content: 'A rua acende devagar' },
  ])('carrega uma rota de detalhe', async ({ Route, content }) => {
    const view = await render(
      <AppProviders>
        <Route />
      </AppProviders>,
    );

    expect(await view.findByText(content)).toBeTruthy();
  });

  it('formata duração para exibição', () => {
    expect(formatDuration(218_000)).toBe('3:38');
    expect(formatDuration(3_661_000)).toBe('1:01:01');
    expect(formatDuration(null)).toBe('Não informada');
  });

  it('formata atualização relativa e normaliza buscas', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');

    expect(formatRelativeUpdate('2026-09-09T11:59:45.000Z', now)).toBe('agora');
    expect(formatRelativeUpdate('2026-09-09T11:45:00.000Z', now)).toBe(
      'há 15 min',
    );
    expect(formatRelativeUpdate('2026-09-09T09:00:00.000Z', now)).toBe(
      'há 3 h',
    );
    expect(formatRelativeUpdate('2026-09-08T12:00:00.000Z', now)).toBe(
      'há 1 dia',
    );
    expect(formatRelativeUpdate('2026-09-06T12:00:00.000Z', now)).toBe(
      'há 3 dias',
    );
    expect(formatRelativeUpdate('2026-08-01T12:00:00.000Z', now)).toMatch(
      /1 de ago\. de 2026/,
    );
    expect(normalizeForSearch('  Praça Áurea  ')).toBe('praca aurea');
  });

  it('exige o provedor para acessar os repositórios', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });
});
