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
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({
    bandId: 'band-demo-horizonte',
    showId: 'show-demo-festival',
    songId: 'song-demo-luzes',
  }),
  useRouter: () => ({ replace: jest.fn() }),
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

describe('integração das rotas', () => {
  it.each([
    {
      Route: ShowsRoute,
      backLabel: undefined,
      navigationLabel: 'Ir para Shows',
      content: 'Festival da Praça',
    },
    {
      Route: RepertoireRoute,
      backLabel: undefined,
      navigationLabel: 'Ir para Repertório',
      content: 'Luzes da Cidade',
    },
    {
      Route: StageHubRoute,
      backLabel: 'Voltar para Shows',
      navigationLabel: 'Palco, em breve',
      content: 'Modo palco em breve',
    },
    {
      Route: BandRoute,
      backLabel: undefined,
      navigationLabel: 'Ir para Banda',
      content: 'Ana Martins',
    },
  ])(
    'carrega a rota $navigationLabel com os dados da banda',
    async ({ Route, backLabel, navigationLabel, content }) => {
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
      expect(view.getByLabelText(backLabel ?? 'Abrir menu geral')).toBeTruthy();
      if (Route === StageHubRoute) {
        expect(view.getByTestId('stage-availability-dialog')).toBeTruthy();
      }
    },
  );

  it.each([
    { Route: ShowDetailRoute, content: 'Festival da Praça' },
    { Route: SongDetailRoute, content: 'A rua acende devagar' },
    { Route: StageRoute, content: 'Modo palco em breve' },
  ])('carrega uma rota de detalhe', async ({ Route, content }) => {
    const view = await render(
      <AppProviders>
        <Route />
      </AppProviders>,
    );

    expect(await view.findByText(content)).toBeTruthy();
    if (Route === StageRoute) {
      expect(view.getByTestId('stage-availability-dialog')).toBeTruthy();
    }
  });

  it('exige o provedor para acessar os repositórios', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });
});
