import { render, renderHook } from '@testing-library/react-native';

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
      expect(view.getByLabelText('Voltar para Minhas bandas')).toBeTruthy();
    },
  );

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
    { mode: 'phone', width: 390 },
    { mode: 'tablet', width: 820 },
    { mode: 'desktop', width: 1440 },
  ])('adapta os detalhes ao modo $mode', async ({ mode, width }) => {
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
          viewportWidth={width}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByTestId(`song-detail-${mode}`)).toBeTruthy();
    expect(view.getByLabelText('Voltar para Repertório')).toBeTruthy();
  });

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
