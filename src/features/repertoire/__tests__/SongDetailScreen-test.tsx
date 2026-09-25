import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';
import { AppProviders } from '@/providers/AppProviders';
import { SongLyricsScreen } from '@/features/repertoire/SongLyricsScreen';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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
    expect(view.getByText('Tom · G')).toBeTruthy();
    expect(view.getByLabelText('Abrir letra em tela cheia')).toBeTruthy();
    expect(view.getByText('BPM · 118')).toBeTruthy();
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

  it('abre a referência do YouTube em uma nova janela no web', async () => {
    const originalPlatform = Platform.OS;
    const originalOpen = Object.getOwnPropertyDescriptor(window, 'open');
    const openWindow = jest.fn(() => null);

    Object.defineProperty(window, 'open', {
      configurable: true,
      value: openWindow,
      writable: true,
    });

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    try {
      const view = await render(
        <AppProviders>
          <SongDetailScreen
            bandId={demoIds.primaryBand}
            songId={demoIds.stageSong}
          />
        </AppProviders>,
      );

      await view.findByText('A rua acende devagar');
      await fireEvent.press(view.getByLabelText('Abrir referência no YouTube'));

      expect(openWindow).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        '_blank',
        'noopener,noreferrer',
      );
    } finally {
      if (originalOpen) {
        Object.defineProperty(window, 'open', originalOpen);
      } else {
        delete (window as { open?: unknown }).open;
      }
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('renderiza os blocos e os formatos cadastrados na letra', async () => {
    const formattedSong = {
      ...demoRepositoryData.songs[0],
      id: 'song-with-formatted-lyrics',
      lyrics: {
        blocks: [
          {
            id: 'formatted-verse',
            name: 'Verso',
            lines: [
              {
                bold: true,
                id: 'bold-line',
                startTimeMs: null,
                text: 'Linha em destaque',
              },
              {
                id: 'separator-line',
                kind: 'separator' as const,
                startTimeMs: null,
                text: '',
              },
              { id: 'blank-line', startTimeMs: null, text: '' },
            ],
          },
        ],
      },
    };
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs: [formattedSong],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={formattedSong.id}
        />
      </AppProviders>,
    );

    const boldLine = await view.findByText('Linha em destaque');

    const blockName = view.getByText('Verso');

    expect(blockName).toBeTruthy();
    expect(blockName.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.55 })]),
    );
    expect(view.getByTestId('lyric-separator-separator-line')).toBeTruthy();
    expect(boldLine.props.style).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ fontWeight: '800' }),
        ]),
      ]),
    );
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
    expect(
      instrumentalView.queryByLabelText('Abrir letra em tela cheia'),
    ).toBeNull();

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

  it('apresenta a letra em uma tela imersiva', async () => {
    const view = await render(
      <AppProviders>
        <SongLyricsScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByTestId('song-lyrics-screen')).toBeTruthy();
    expect(view.getByText('Letra em tela cheia')).toBeTruthy();
    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByLabelText('Voltar para detalhes da música')).toBeTruthy();
  });

  it('informa quando a música não possui letra em tela cheia', async () => {
    const view = await render(
      <AppProviders>
        <SongLyricsScreen
          bandId={demoIds.primaryBand}
          songId="song-demo-instrumental"
        />
      </AppProviders>,
    );

    expect(await view.findByText('Sem letra cadastrada')).toBeTruthy();
  });

  it('informa quando a música não está disponível em tela cheia', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongLyricsScreen bandId={demoIds.primaryBand} songId="unknown" />
      </AppProviders>,
    );

    expect(await view.findByText('Música indisponível')).toBeTruthy();
  });
});
