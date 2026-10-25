import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import {
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
} from '@/testing/factories';
import { SongLyricsContent } from '@/features/repertoire/SongLyricsContent';

const lyrics = createLyricDocument({
  blocks: [
    createLyricBlock({
      id: 'lyrics-block',
      lines: [
        createLyricLine({ id: 'first-line', startTimeMs: 0, text: 'Primeira' }),
        createLyricLine({
          id: 'second-line',
          startTimeMs: 5_000,
          text: 'Segunda',
        }),
      ],
    }),
  ],
});

describe('<SongLyricsContent />', () => {
  it('destaca a linha ativa sem alterar fonte ou altura e adiciona respiro', async () => {
    const view = await render(
      <SongLyricsContent
        activeLineIds={new Set(['first-line'])}
        lyrics={lyrics}
        variant="fullscreen"
      />,
    );
    const activeLine = view.getByTestId('lyric-line-active-first-line');
    const activeStyle = StyleSheet.flatten(activeLine.props.style);

    expect(activeStyle).toMatchObject({
      fontSize: 24,
      lineHeight: 38,
      fontWeight: '700',
      marginVertical: spacing.sm,
      opacity: 1,
    });
    expect(activeStyle.backgroundColor).toBeUndefined();
    expect(activeStyle.color).toBe(colors.text.primary);
    expect(
      StyleSheet.flatten(view.getByTestId('lyric-line-second-line').props.style)
        .opacity,
    ).toBe(0.65);
    expect(activeLine.props.children).toBe('Primeira');
  });

  it('restaura a linha anterior quando o destaque muda', async () => {
    const view = await render(
      <SongLyricsContent
        activeLineIds={new Set(['first-line'])}
        lyrics={lyrics}
        variant="fullscreen"
      />,
    );
    const stableFirstLine = view.getByTestId('lyric-line-active-first-line');

    await view.rerender(
      <SongLyricsContent
        activeLineIds={new Set(['second-line'])}
        lyrics={lyrics}
        variant="fullscreen"
      />,
    );

    expect(view.queryByTestId('lyric-line-active-first-line')).toBeNull();
    expect(view.getByTestId('lyric-line-first-line')).toBe(stableFirstLine);
    const restoredStyle = StyleSheet.flatten(
      view.getByTestId('lyric-line-first-line').props.style,
    );
    const currentStyle = StyleSheet.flatten(
      view.getByTestId('lyric-line-active-second-line').props.style,
    );
    expect(view.getByTestId('lyric-line-first-line').props.children).toBe(
      'Primeira',
    );
    expect(restoredStyle.opacity).toBe(0.65);
    expect(restoredStyle.color).toBe(colors.text.primary);
    expect(restoredStyle.backgroundColor).toBeUndefined();
    expect(currentStyle.opacity).toBe(1);
    expect(currentStyle.color).toBe(colors.text.primary);
  });

  it('não altera destaque nem interação da variante em card', async () => {
    const onTimedLinePress = jest.fn();
    const view = await render(
      <SongLyricsContent
        activeLineIds={new Set(['first-line'])}
        lyrics={lyrics}
        onTimedLinePress={onTimedLinePress}
        variant="card"
      />,
    );

    const line = view.getByTestId('lyric-line-first-line');
    expect(view.queryByTestId('lyric-line-active-first-line')).toBeNull();
    expect(line.props.onPress).toBeUndefined();
    expect(StyleSheet.flatten(line.props.style)).not.toMatchObject({
      backgroundColor: colors.background.selectedSubtle,
    });
  });

  it('informa as medidas finais do documento, bloco e linha destacada', async () => {
    const onDocumentLayout = jest.fn();
    const onBlockLayout = jest.fn();
    const onLineLayout = jest.fn();
    const view = await render(
      <SongLyricsContent
        activeLineIds={new Set(['first-line'])}
        lyrics={lyrics}
        onBlockLayout={onBlockLayout}
        onDocumentLayout={onDocumentLayout}
        onLineLayout={onLineLayout}
        variant="fullscreen"
      />,
    );

    await fireEvent(view.getByTestId('lyrics-document'), 'layout', {
      nativeEvent: { layout: { height: 220, width: 320, x: 0, y: 12 } },
    });
    await fireEvent(view.getByTestId('lyrics-block-lyrics-block'), 'layout', {
      nativeEvent: { layout: { height: 180, width: 320, x: 0, y: 40 } },
    });
    await fireEvent(
      view.getByTestId('lyric-line-active-first-line'),
      'layout',
      {
        nativeEvent: { layout: { height: 62, width: 320, x: 0, y: 28 } },
      },
    );

    expect(onDocumentLayout).toHaveBeenCalledWith(12);
    expect(onBlockLayout).toHaveBeenCalledWith('lyrics-block', 40);
    expect(onLineLayout).toHaveBeenCalledWith(
      'first-line',
      'lyrics-block',
      28,
      62,
    );
  });

  it('expõe somente linhas marcadas como alvos de salto por toque e teclado', async () => {
    const onTimedLinePress = jest.fn();
    const document = createLyricDocument({
      blocks: [
        createLyricBlock({
          id: 'seek-block',
          lines: [
            createLyricLine({
              id: 'timed-line',
              startTimeMs: 0,
              text: 'Primeira',
            }),
            createLyricLine({ id: 'untimed-line', text: 'Sem marca' }),
          ],
        }),
      ],
    });
    const view = await render(
      <SongLyricsContent
        lyrics={document}
        onTimedLinePress={onTimedLinePress}
        variant="fullscreen"
      />,
    );

    const timedLine = view.getByLabelText('Ir para Primeira');
    expect(timedLine.props.accessibilityRole).toBe('button');
    await fireEvent.press(timedLine);
    expect(onTimedLinePress).toHaveBeenCalledWith(0);
    expect(
      view.getByTestId('lyric-line-untimed-line').props.onPress,
    ).toBeUndefined();
    expect(view.queryByLabelText('Ir para Sem marca')).toBeNull();
  });
});
