import { render, renderHook } from '@testing-library/react-native';

import BandRoute from '@/app/bands/[bandId]/band';
import RepertoireRoute from '@/app/bands/[bandId]/repertoire';
import SongDetailRoute from '@/app/bands/[bandId]/repertoire/[songId]';
import StageHubRoute from '@/app/bands/[bandId]/stage';
import ShowsRoute from '@/app/bands/[bandId]/shows';
import ShowDetailRoute from '@/app/bands/[bandId]/shows/[showId]';
import StageRoute from '@/app/bands/[bandId]/shows/[showId]/stage';
import { AppProviders, useAppData } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useLocalSearchParams: () => ({
    bandId: 'band-demo-horizonte',
    showId: 'show-demo-festival',
    songId: 'song-demo-luzes',
  }),
}));

describe('integração das rotas', () => {
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
      Route: StageHubRoute,
      navigationLabel: 'Ir para Palco',
      content: 'Escolha um show',
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
      expect(
        (await view.findAllByText('Banda Horizonte')).length,
      ).toBeGreaterThan(0);
      expect(view.getByLabelText(navigationLabel)).toBeTruthy();
      expect(view.getByLabelText('Abrir menu geral')).toBeTruthy();
    },
  );

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

  it('exige o provedor para acessar os repositórios', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });
});
