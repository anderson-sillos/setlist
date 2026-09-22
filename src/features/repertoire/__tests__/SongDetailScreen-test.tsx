import { fireEvent, render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('<SongDetailScreen />', () => {
  it.each([
    {
      height: 844,
      mode: 'phone',
      width: 390,
    },
    {
      height: 1180,
      mode: 'tablet',
      width: 820,
    },
    {
      height: 900,
      mode: 'desktop',
      width: 1440,
    },
  ])('adapta os detalhes ao modo $mode', async ({ height, mode, width }) => {
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
    expect(view.getByText('Duração · 3min38s')).toBeTruthy();
    expect(view.getByLabelText('Duração 3min38s')).toBeTruthy();
    expect(view.getByText('Atualizada há 3 dias')).toBeTruthy();
    expect(view.getByLabelText('Editar música')).toBeTruthy();
    expect(view.getByLabelText('Abrir referência no YouTube')).toBeTruthy();
    expect(
      view.getByRole('button', {
        name: 'Abrir referência no YouTube',
      }),
    ).toBeTruthy();
  });

  it('apresenta a edição da música como ação contextual acessível', async () => {
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Editar música'));

    expect(view.getByTestId('demo-action-notice')).toBeTruthy();
    expect(
      view.getByText(/músicas de demonstração são só para consulta/i),
    ).toBeTruthy();
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
    expect(view.queryByLabelText('Editar música')).toBeNull();
    expect(view.queryByLabelText('Mais opções da música')).toBeNull();
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
      await missingSongView.findByText('Música indisponível'),
    ).toBeTruthy();
  });
});
