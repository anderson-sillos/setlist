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
        <BandsScreen />
      </AppProviders>,
    );

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.getByLabelText('Abrir Banda Horizonte')).toBeTruthy();
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
      expect(view.getByTestId('screen-scroll-area')).toBeTruthy();

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

  it.each([
    { mode: 'phone', width: 390 },
    { mode: 'tablet', width: 820 },
    { mode: 'desktop', width: 1440 },
  ])('adapta as listas ao modo $mode', async ({ mode, width }) => {
    const view = await render(
      <AppProviders>
        <ShowsScreen bandId={demoIds.primaryBand} viewportWidth={width} />
      </AppProviders>,
    );

    expect(await view.findByText('Festival da Praça')).toBeTruthy();
    expect(view.getByTestId(`responsive-grid-${mode}`)).toBeTruthy();
  });

  it('apresenta o repertório e os metadados em modo somente leitura', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={820} />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByTestId('responsive-grid-tablet')).toBeTruthy();
    expect(view.getByText('Letra estática')).toBeTruthy();
    expect(view.getByText('Sincronização incompleta')).toBeTruthy();
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
    expect(view.getByLabelText('Abrir modo palco')).toBeTruthy();
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
    expect(formatDuration(null)).toBe('Não informada');
  });

  it('exige o provedor para acessar os repositórios', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });
});
