import { render } from '@testing-library/react-native';

import BandRoute from '@/app/bands/[bandId]/band';
import RepertoireRoute from '@/app/bands/[bandId]/repertoire';
import ShowsRoute from '@/app/bands/[bandId]/shows';
import { demoIds } from '@/data/demo';
import BandsScreen from '@/features/navigation/BandsScreen';
import { getBandSectionHref } from '@/features/navigation/routes';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useLocalSearchParams: () => ({ bandId: 'band-demo-horizonte' }),
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
      summary: '3 shows disponíveis para consulta.',
    },
    {
      Route: RepertoireRoute,
      navigationLabel: 'Ir para Repertório',
      summary: '4 músicas ativas no repertório.',
    },
    {
      Route: BandRoute,
      navigationLabel: 'Ir para Banda',
      summary: '3 integrantes nesta banda.',
    },
  ])(
    'carrega a rota $navigationLabel com os dados da banda',
    async ({ Route, navigationLabel, summary }) => {
      const view = await render(
        <AppProviders>
          <Route />
        </AppProviders>,
      );

      expect(await view.findByText(summary)).toBeTruthy();
      expect(view.getByText('Banda Horizonte')).toBeTruthy();
      expect(view.getByLabelText(navigationLabel)).toBeTruthy();
      expect(view.getByLabelText('Voltar para Minhas bandas')).toBeTruthy();
    },
  );
});
