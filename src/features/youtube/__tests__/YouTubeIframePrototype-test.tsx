import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { YouTubeIframePrototype } from '@/features/youtube/YouTubeIframePrototype';
import {
  loadYouTubeIframeApi,
  type YouTubePlayer,
  type YouTubePlayerOptions,
} from '@/features/youtube/youtubePlayer';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('react-native-webview', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockWebView = React.forwardRef(
    (
      props: { readonly testID?: string },
      ref: { readonly current: unknown } | null,
    ) => {
      React.useImperativeHandle(ref, () => ({ injectJavaScript: jest.fn() }));
      return <View testID={props.testID} />;
    },
  );
  MockWebView.displayName = 'MockWebView';

  return {
    WebView: MockWebView,
  };
});

jest.mock('@/features/youtube/youtubePlayer', () => {
  const actual = jest.requireActual('@/features/youtube/youtubePlayer');

  return {
    ...actual,
    loadYouTubeIframeApi: jest.fn(),
  };
});

const loadApiMock = jest.mocked(loadYouTubeIframeApi);

describe('<YouTubeIframePrototype />', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
    jest.clearAllMocks();
  });

  it('renderiza o player nativo em uma WebView', async () => {
    const view = await render(
      <AppProviders>
        <YouTubeIframePrototype />
      </AppProviders>,
    );

    expect(view.getByTestId('youtube-mobile-player-card')).toBeTruthy();
    expect(view.getByTestId('youtube-mobile-webview')).toBeTruthy();
    expect(view.getByText('Tarefa 3.2 · protótipo WebView')).toBeTruthy();
  });

  it('exibe o player web e conecta os controles ao IFrame API', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    const player: YouTubePlayer = {
      destroy: jest.fn(),
      getCurrentTime: jest.fn(() => 12),
      getDuration: jest.fn(() => 180),
      getPlayerState: jest.fn(() => 5),
      pauseVideo: jest.fn(),
      playVideo: jest.fn(),
      seekTo: jest.fn(),
    };
    const playerOptions: YouTubePlayerOptions = { videoId: 'M7lc1UVf-VE' };

    const MockPlayer = jest
      .fn()
      .mockImplementation(
        (_containerId: string | HTMLElement, options: YouTubePlayerOptions) => {
          Object.assign(playerOptions, options);
          return player;
        },
      );

    loadApiMock.mockResolvedValue({ Player: MockPlayer });

    const view = await render(
      <AppProviders>
        <YouTubeIframePrototype />
      </AppProviders>,
    );

    expect(loadApiMock).toHaveBeenCalledTimes(1);
    const loadedApi = await loadApiMock.mock.results[0]?.value;
    expect(loadedApi.Player).toBe(MockPlayer);
    await waitFor(() => expect(MockPlayer).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(playerOptions.events?.onReady).toBeDefined());
    await act(async () => {
      playerOptions.events?.onReady?.({ data: 5, target: player });
    });

    await waitFor(() => {
      expect(view.getByTestId('youtube-current-time')).toHaveTextContent(
        '0:12 / 3:00',
      );
    });

    await fireEvent.press(view.getByRole('button', { name: 'Reproduzir' }));
    await fireEvent.press(view.getByRole('button', { name: 'Pausar' }));
    await fireEvent.press(view.getByRole('button', { name: '+10 s' }));

    expect(player.playVideo).toHaveBeenCalledTimes(1);
    expect(player.pauseVideo).toHaveBeenCalledTimes(1);
    expect(player.seekTo).toHaveBeenCalledWith(22, true);
  });
});
