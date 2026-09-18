import {
  buildYouTubeWebViewCommand,
  createYouTubeWebViewHtml,
  parseYouTubeWebViewMessage,
  YOUTUBE_WEBVIEW_ORIGIN,
} from '@/features/youtube/youtubeMobilePlayer';

describe('youtubeMobilePlayer', () => {
  it('cria HTML do IFrame com origem, referer base e controles do YouTube', () => {
    const html = createYouTubeWebViewHtml('M7lc1UVf-VE');

    expect(html).toContain('https://www.youtube.com/iframe_api');
    expect(html).toContain('videoId: "M7lc1UVf-VE"');
    expect(html).toContain(`origin: "${YOUTUBE_WEBVIEW_ORIGIN}"`);
    expect(html).toContain('strict-origin-when-cross-origin');
    expect(html).toContain('enablejsapi: 1');
    expect(html).toContain('window.ReactNativeWebView.postMessage');
  });

  it('gera comandos seguros para a ponte nativa', () => {
    expect(buildYouTubeWebViewCommand({ type: 'play' })).toContain(
      '{"type":"play"}',
    );
    expect(buildYouTubeWebViewCommand({ seconds: 42, type: 'seek' })).toContain(
      '{"seconds":42,"type":"seek"}',
    );
  });

  it('interpreta eventos de tempo, estado e indisponibilidade', () => {
    expect(
      parseYouTubeWebViewMessage(
        '{"type":"ready","state":"cued","currentTime":1.2,"duration":180}',
      ),
    ).toEqual({
      currentTime: 1.2,
      duration: 180,
      state: 'cued',
      type: 'ready',
    });
    expect(
      parseYouTubeWebViewMessage(
        '{"type":"state","state":"playing","currentTime":4,"duration":180}',
      ),
    ).toEqual({
      currentTime: 4,
      duration: 180,
      state: 'playing',
      type: 'state',
    });
    expect(parseYouTubeWebViewMessage('{"type":"error","code":150}')).toEqual({
      code: 150,
      type: 'error',
    });
    expect(parseYouTubeWebViewMessage('not-json')).toBeNull();
  });
});
