import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  getProgressSliderKeyboardAction,
  ProgressSlider,
} from '@/components/ui/ProgressSlider';

jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const gestureHandler = jest.requireActual<
    typeof import('react-native-gesture-handler')
  >('react-native-gesture-handler');
  const createPanGesture = () => {
    const gesture = {
      callbacks: {} as Record<string, (...args: never[]) => void>,
      activeOffsetX: () => gesture,
      failOffsetY: () => gesture,
      onEnd: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onEnd = callback;
        return gesture;
      },
      onFinalize: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onFinalize = callback;
        return gesture;
      },
      onStart: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onStart = callback;
        return gesture;
      },
      onUpdate: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onUpdate = callback;
        return gesture;
      },
      runOnJS: () => gesture,
      shouldCancelWhenOutside: () => gesture,
      withTestId: (testID: string) => {
        gesture.testID = testID;
        return gesture;
      },
      testID: '',
    };
    return gesture;
  };

  return {
    ...gestureHandler,
    Gesture: { ...gestureHandler.Gesture, Pan: createPanGesture },
    GestureDetector: ({
      children,
      gesture,
    }: {
      readonly children?: import('react').ReactNode;
      readonly gesture: ReturnType<typeof createPanGesture>;
    }) =>
      React.createElement(
        'GestureDetectorMock',
        {
          onEnd: gesture.callbacks.onEnd,
          onFinalize: gesture.callbacks.onFinalize,
          onStart: gesture.callbacks.onStart,
          onUpdate: gesture.callbacks.onUpdate,
          testID: gesture.testID,
        },
        children,
      ),
  };
});

describe('<ProgressSlider />', () => {
  it('apresenta posição proporcional, duração e semântica ajustável', async () => {
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={jest.fn()}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={10_000}
      />,
    );

    expect(view.getByLabelText('Tempo atual 00:10')).toBeTruthy();
    expect(view.getByLabelText('Duração total 00:40')).toBeTruthy();
    expect(view.getByLabelText('Posição na música').props).toMatchObject({
      accessibilityRole: 'adjustable',
      accessibilityValue: {
        min: 0,
        max: 40_000,
        now: 10_000,
        text: '00:10',
      },
    });
    expect(
      StyleSheet.flatten(view.getByTestId('progress-fill').props.style).width,
    ).toBe('25%');
  });

  it('permite escolher um tempo tocando a trilha', async () => {
    const onCommit = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={0}
      />,
    );
    const hitArea = view.getByTestId('progress-slider-hit-area');

    await act(() =>
      hitArea.props.onLayout({
        nativeEvent: { layout: { height: 48, width: 208, x: 0, y: 0 } },
      }),
    );
    await fireEvent.press(hitArea, {
      nativeEvent: { locationX: 54 },
    });

    expect(onCommit).toHaveBeenCalledWith(10_000);
  });

  it('mantém a prévia no marcador durante os ticks e confirma ao soltar', async () => {
    const onCommit = jest.fn();
    const onPreviewChange = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={onPreviewChange}
        previewPositionMs={null}
        valueMs={10_000}
      />,
    );
    const hitArea = view.getByTestId('progress-slider-hit-area');
    await act(() =>
      hitArea.props.onLayout({
        nativeEvent: { layout: { height: 48, width: 208, x: 0, y: 0 } },
      }),
    );
    const gesture = view.getByTestId('progress-slider-gesture');

    await act(() => gesture.props.onStart({ x: 104 }));
    await act(() => gesture.props.onUpdate({ x: 154 }));
    expect(onPreviewChange).toHaveBeenLastCalledWith(30_000);
    expect(
      view.getByTestId('progress-preview-bubble').props.children.props.children,
    ).toBe('00:30');

    await view.rerender(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={onPreviewChange}
        previewPositionMs={30_000}
        valueMs={35_000}
      />,
    );
    expect(
      StyleSheet.flatten(view.getByTestId('progress-fill').props.style).width,
    ).toBe('75%');

    await act(() => gesture.props.onEnd({ x: 154 }, true));
    expect(onCommit).toHaveBeenCalledWith(30_000);
  });

  it('descarta a prévia quando o gesto é cancelado', async () => {
    const onCancel = jest.fn();
    const onPreviewChange = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={onCancel}
        onCommit={jest.fn()}
        onPreviewChange={onPreviewChange}
        previewPositionMs={null}
        valueMs={0}
      />,
    );
    const hitArea = view.getByTestId('progress-slider-hit-area');
    await act(() =>
      hitArea.props.onLayout({
        nativeEvent: { layout: { height: 48, width: 208, x: 0, y: 0 } },
      }),
    );
    const gesture = view.getByTestId('progress-slider-gesture');

    await act(() => gesture.props.onStart({ x: 54 }));
    await act(() => gesture.props.onFinalize({}, false));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onPreviewChange).toHaveBeenLastCalledWith(null);
    expect(view.queryByTestId('progress-preview-bubble')).toBeNull();
  });

  it('não apresenta a barra sem uma duração positiva válida', async () => {
    const view = await render(
      <ProgressSlider
        durationMs={0}
        onCancel={jest.fn()}
        onCommit={jest.fn()}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={0}
      />,
    );

    expect(view.queryByTestId('progress-slider')).toBeNull();
  });

  it('ignora valores temporais inválidos e nomes de ação assistiva desconhecidos', async () => {
    const onCommit = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={jest.fn()}
        previewPositionMs={Number.POSITIVE_INFINITY}
        valueMs={Number.NaN}
      />,
    );

    expect(view.getByLabelText('Tempo atual 00:00')).toBeTruthy();
    expect(
      StyleSheet.flatten(view.getByTestId('progress-fill').props.style).width,
    ).toBe('0%');

    await act(() =>
      view.getByLabelText('Posição na música').props.onAccessibilityAction({
        nativeEvent: { actionName: 'unsupported' },
      }),
    );
    expect(onCommit).not.toHaveBeenCalled();

    await view.rerender(
      <ProgressSlider
        durationMs={Number.NaN}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={0}
      />,
    );
    expect(view.queryByTestId('progress-slider')).toBeNull();
  });

  it('cancela ao soltar um gesto malsucedido e ignora o clique sintetizado', async () => {
    const onCancel = jest.fn();
    const onCommit = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={onCancel}
        onCommit={onCommit}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={0}
      />,
    );
    const hitArea = view.getByTestId('progress-slider-hit-area');
    await act(() =>
      hitArea.props.onLayout({
        nativeEvent: { layout: { height: 48, width: 208, x: 0, y: 0 } },
      }),
    );
    const gesture = view.getByTestId('progress-slider-gesture');

    await act(() => gesture.props.onStart({ x: 54 }));
    await act(() => gesture.props.onEnd({ x: 54 }, false));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await fireEvent.press(hitArea, {
      nativeEvent: { locationX: 54 },
    });
    expect(onCommit).not.toHaveBeenCalled();
    await fireEvent.press(hitArea, {
      nativeEvent: { locationX: 54 },
    });
    expect(onCommit).toHaveBeenCalledWith(10_000);
  });

  it('expõe ajustes acessíveis sem contornar a barra ao receber foco', async () => {
    const onCommit = jest.fn();
    const view = await render(
      <ProgressSlider
        durationMs={40_000}
        onCancel={jest.fn()}
        onCommit={onCommit}
        onPreviewChange={jest.fn()}
        previewPositionMs={null}
        valueMs={10_000}
      />,
    );
    const slider = view.getByLabelText('Posição na música');

    expect(slider.props.accessibilityActions).toEqual([
      { name: 'decrement', label: 'Voltar 5 segundos' },
      { name: 'increment', label: 'Avançar 5 segundos' },
    ]);

    await act(() => slider.props.onFocus());
    expect(
      StyleSheet.flatten(
        view.getByTestId('progress-slider-hit-area').props.style,
      ).borderWidth,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(view.getByTestId('progress-thumb').props.style),
    ).toMatchObject({ borderWidth: 3, height: 20 });
    await act(() =>
      slider.props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(onCommit).toHaveBeenCalledWith(15_000);

    expect(getProgressSliderKeyboardAction('ArrowLeft')).toBe('decrement');
    expect(getProgressSliderKeyboardAction('ArrowDown')).toBe('decrement');
    expect(getProgressSliderKeyboardAction('ArrowRight')).toBe('increment');
    expect(getProgressSliderKeyboardAction('ArrowUp')).toBe('increment');
    expect(getProgressSliderKeyboardAction('Home')).toBe('start');
    expect(getProgressSliderKeyboardAction('End')).toBe('end');
    expect(getProgressSliderKeyboardAction('Enter')).toBeNull();
  });
});
