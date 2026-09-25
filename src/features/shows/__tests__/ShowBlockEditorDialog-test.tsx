import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { demoRepositoryData } from '@/data/demo';
import { ShowBlockEditorDialog } from '@/features/shows/ShowBlockEditorDialog';
import { formatSongDuration } from '@/utils/duration';

function createResponderEvent(
  pageY = 0,
  previousPageY = pageY,
  timestamp = 10,
) {
  return {
    persist: jest.fn(),
    nativeEvent: { touches: [{}] },
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      numberActiveTouches: 1,
      touchBank: [
        {
          currentPageX: 0,
          currentPageY: pageY,
          currentTimeStamp: timestamp,
          previousPageX: 0,
          previousPageY,
          previousTimeStamp: timestamp - 1,
          startPageX: 0,
          startPageY: previousPageY,
          startTimeStamp: 0,
          touchActive: true,
        },
      ],
    },
  };
}

describe('<ShowBlockEditorDialog />', () => {
  it('pede confirmação antes de sair com a setlist alterada', async () => {
    const onClose = jest.fn();
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[{ id: 'block-1', items: [], name: 'Principal' }]}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={jest.fn()}
        songs={[]}
        visible
      />,
    );

    await fireEvent.changeText(
      view.getByLabelText('Nome do bloco 1'),
      'Abertura',
    );
    await fireEvent.press(view.getByText('Cancelar'));

    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByTestId('show-block-editor-discard-sheet')).toBeTruthy();

    await fireEvent.press(view.getByText('Continuar editando'));

    expect(onClose).not.toHaveBeenCalled();
  });
  it('permite excluir um bloco, mas preserva o último bloco', async () => {
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          { id: 'block-1', items: [], name: 'Principal' },
          { id: 'block-2', items: [], name: 'Bis' },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[]}
        visible
      />,
    );

    await fireEvent.press(view.getByLabelText('Excluir bloco Bis'));
    expect(
      view.getByTestId('show-block-editor-delete-block-sheet'),
    ).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Confirmar exclusão do bloco'));

    expect(view.queryByLabelText('Nome do bloco 2')).toBeNull();
    expect(view.getByLabelText('Nome do bloco 1')).toHaveDisplayValue(
      'Principal',
    );
  });

  it('exibe a exclusão à esquerda e o arraste no próprio item', async () => {
    const song = demoRepositoryData.songs[0];
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [
              {
                id: 'item-1',
                notes: null,
                songId: song.id,
                type: 'song',
              },
            ],
            name: 'Principal',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[song]}
        visible
      />,
    );

    expect(view.getByLabelText('Remover música 1')).toBeTruthy();
    expect(view.getByLabelText('Arrastar música 1')).toBeTruthy();
    expect(
      view.getByText(
        'Duração · ' + formatSongDuration(song.estimatedDurationMs),
      ),
    ).toBeTruthy();
    expect(view.queryByText('Reordenar item')).toBeNull();
    expect(view.queryByText('Destino:')).toBeNull();
    expect(view.queryByText('Destino selecionado')).toBeNull();
    expect(view.queryByText('Toque para selecionar')).toBeNull();
  });

  it('seleciona o bloco ao tocar na alça de arraste', async () => {
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          { id: 'block-1', items: [], name: 'Principal' },
          { id: 'block-2', items: [], name: 'Bis' },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[]}
        visible
      />,
    );

    const handle = view.getByTestId('block-drag-handle-block-2');
    const event = createResponderEvent();
    await act(async () => {
      handle.props.onStartShouldSetResponderCapture(event);
      handle.props.onResponderGrant(event);
    });

    expect(
      StyleSheet.flatten(view.getByTestId('setlist-block-block-2').props.style)
        .borderWidth,
    ).toBe(2);
    await act(async () => {
      handle.props.onResponderRelease(event);
    });
  });

  it('seleciona o bloco como destino ao tocar em um de seus itens', async () => {
    const song = demoRepositoryData.songs[0];
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [],
            name: 'Principal',
          },
          {
            id: 'block-2',
            items: [
              { id: 'item-1', notes: null, songId: song.id, type: 'song' },
            ],
            name: 'Bis',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[song]}
        visible
      />,
    );

    expect(
      StyleSheet.flatten(view.getByTestId('setlist-block-block-1').props.style)
        .borderWidth,
    ).toBe(2);
    const itemRow = view.getByTestId('setlist-item-row-item-1');
    const containingBlock = view.getByTestId('setlist-block-block-2');
    await act(async () => {
      expect(containingBlock.props.onStartShouldSetResponderCapture()).toBe(
        false,
      );
    });
    expect(itemRow).toBeTruthy();
    expect(
      StyleSheet.flatten(view.getByTestId('setlist-block-block-2').props.style)
        .borderWidth,
    ).toBe(2);
  });

  it('mantém os campos de duração em uma linha e salva os segundos', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [
              {
                description: 'Troca de instrumento',
                estimatedDurationMs: 3_720_000,
                id: 'planning-1',
                type: 'planning',
              },
            ],
            name: 'Principal',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
        songs={[]}
        visible
      />,
    );

    const planningRow = view.getByTestId('setlist-item-row-planning-1');
    const durationControls = view.getByTestId(
      'setlist-duration-controls-planning-1',
    );
    const totalDuration = view.getByTestId('setlist-total-duration');
    const scrollView = view.getByTestId('setlist-scroll-view');
    const hoursInput = view.getByLabelText('Horas do planejamento 1');
    const minutesInput = view.getByLabelText('Minutos do planejamento 1');
    const secondsInput = view.getByLabelText('Segundos do planejamento 1');
    expect(StyleSheet.flatten(planningRow.props.style).flexDirection).toBe(
      'column',
    );
    expect(StyleSheet.flatten(planningRow.props.style).alignItems).toBe(
      'stretch',
    );
    expect(StyleSheet.flatten(planningRow.props.style).paddingHorizontal).toBe(
      0,
    );
    expect(StyleSheet.flatten(durationControls.props.style).flexWrap).toBe(
      'nowrap',
    );
    expect(StyleSheet.flatten(durationControls.props.style).alignSelf).toBe(
      'stretch',
    );
    expect(
      StyleSheet.flatten(hoursInput.parent?.parent?.props.style).flexShrink,
    ).toBe(1);
    expect(
      StyleSheet.flatten(hoursInput.parent?.parent?.props.style).flexDirection,
    ).toBe('row');
    expect(view.getByText('Duração')).toBeTruthy();
    expect(totalDuration.parent).toBe(scrollView.parent);
    expect(hoursInput).toHaveDisplayValue('01');
    expect(minutesInput).toHaveDisplayValue('02');
    expect(secondsInput).toHaveDisplayValue('00');
    expect(StyleSheet.flatten(hoursInput.parent?.props.style).minWidth).toBe(
      76,
    );
    expect(StyleSheet.flatten(minutesInput.parent?.props.style).minWidth).toBe(
      76,
    );
    expect(StyleSheet.flatten(secondsInput.parent?.props.style).minWidth).toBe(
      76,
    );

    await fireEvent.changeText(secondsInput, '45');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));
    expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({
        items: [expect.objectContaining({ estimatedDurationMs: 3_765_000 })],
      }),
    ]);
  });

  it('move o bloco fantasma e aplica a nova ordem ao soltar', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          { id: 'block-1', items: [], name: 'Principal' },
          { id: 'block-2', items: [], name: 'Meio' },
          { id: 'block-3', items: [], name: 'Final' },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
        songs={[]}
        visible
      />,
    );
    const startEvent = createResponderEvent();
    const initialHandle = view.getByTestId('block-drag-handle-block-1');
    const initialMoveHandler = initialHandle.props.onResponderMove;

    await act(async () => {
      initialHandle.props.onStartShouldSetResponderCapture(startEvent);
      initialHandle.props.onResponderGrant(startEvent);
    });

    expect(view.getByTestId('setlist-drag-preview')).toBeTruthy();
    const activeHandle = view.getByTestId('block-drag-handle-block-1');
    expect(activeHandle.props.onResponderMove).toBe(initialMoveHandler);

    await act(async () => {
      activeHandle.props.onResponderMove(createResponderEvent(400, 0, 20));
    });

    const preview = view.getByTestId('setlist-drag-preview');
    expect(StyleSheet.flatten(preview.props.style).top).toBe(400);

    await act(async () => {
      activeHandle.props.onResponderRelease(createResponderEvent(400, 400, 21));
    });

    expect(view.queryByTestId('setlist-drag-preview')).toBeNull();
    await fireEvent.press(view.getByLabelText('Salvar setlist'));
    expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'block-2' }),
      expect.objectContaining({ id: 'block-3' }),
      expect.objectContaining({ id: 'block-1' }),
    ]);
  });

  it('limpa a prévia do item quando o sistema cancela o gesto', async () => {
    const song = demoRepositoryData.songs[0];
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [
              {
                id: 'item-1',
                notes: null,
                songId: song.id,
                type: 'song',
              },
            ],
            name: 'Principal',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[song]}
        visible
      />,
    );
    const event = createResponderEvent();
    const initialHandle = view.getByTestId('item-drag-handle-item-1');
    const initialMoveHandler = initialHandle.props.onResponderMove;

    await act(async () => {
      initialHandle.props.onStartShouldSetResponderCapture(event);
      initialHandle.props.onResponderGrant(event);
    });

    expect(view.getByTestId('setlist-drag-preview')).toBeTruthy();
    const activeHandle = view.getByTestId('item-drag-handle-item-1');
    expect(activeHandle.props.onResponderMove).toBe(initialMoveHandler);

    await act(async () => {
      activeHandle.props.onResponderTerminate(event);
    });

    expect(view.queryByTestId('setlist-drag-preview')).toBeNull();
  });

  it('move o item fantasma e aplica a nova ordem ao soltar', async () => {
    const song = demoRepositoryData.songs[0];
    const onSubmit = jest.fn();
    const view = await render(
      <ShowBlockEditorDialog
        addSheetVisible={false}
        onAddSheetVisibilityChange={jest.fn()}
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [
              { id: 'item-1', notes: null, songId: song.id, type: 'song' },
              { id: 'item-2', notes: null, songId: song.id, type: 'song' },
            ],
            name: 'Principal',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
        songs={[song]}
        visible
      />,
    );
    const startEvent = createResponderEvent();
    const initialHandle = view.getByTestId('item-drag-handle-item-1');
    const initialMoveHandler = initialHandle.props.onResponderMove;

    await act(async () => {
      initialHandle.props.onStartShouldSetResponderCapture(startEvent);
      initialHandle.props.onResponderGrant(startEvent);
    });

    const activeHandle = view.getByTestId('item-drag-handle-item-1');
    expect(activeHandle.props.onResponderMove).toBe(initialMoveHandler);
    await act(async () => {
      activeHandle.props.onResponderMove(createResponderEvent(120, 0, 20));
    });

    expect(
      StyleSheet.flatten(view.getByTestId('setlist-drag-preview').props.style)
        .top,
    ).toBe(120);

    await act(async () => {
      activeHandle.props.onResponderRelease(createResponderEvent(120, 120, 21));
    });

    expect(view.queryByTestId('setlist-drag-preview')).toBeNull();
    await fireEvent.press(view.getByLabelText('Salvar setlist'));
    expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'block-1',
        items: [
          expect.objectContaining({ id: 'item-2' }),
          expect.objectContaining({ id: 'item-1' }),
        ],
      }),
    ]);
  });

  it('rola automaticamente enquanto o item permanece perto da borda inferior', async () => {
    const song = demoRepositoryData.songs[0];
    const onSubmit = jest.fn();
    const frames: FrameRequestCallback[] = [];
    let frameId = 0;
    const requestFrame = jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.push(callback);
        frameId += 1;
        return frameId;
      });
    const cancelFrame = jest
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    try {
      const view = await render(
        <ShowBlockEditorDialog
          addSheetVisible={false}
          onAddSheetVisibilityChange={jest.fn()}
          errorMessage={null}
          initialBlocks={[
            {
              id: 'block-1',
              items: [
                { id: 'item-1', notes: null, songId: song.id, type: 'song' },
              ],
              name: 'Primeiro',
            },
            { id: 'block-2', items: [], name: 'Segundo' },
            { id: 'block-3', items: [], name: 'Terceiro' },
            { id: 'block-4', items: [], name: 'Quarto' },
          ]}
          isSubmitting={false}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          songs={[song]}
          visible
        />,
      );
      const scrollView = view.getByTestId('setlist-scroll-view');
      await act(async () => {
        scrollView.props.onLayout({
          nativeEvent: { layout: { height: 200, width: 320, x: 0, y: 0 } },
        });
        scrollView.props.onContentSizeChange(320, 800);
      });

      const startEvent = createResponderEvent();
      const initialHandle = view.getByTestId('item-drag-handle-item-1');
      await act(async () => {
        initialHandle.props.onStartShouldSetResponderCapture(startEvent);
        initialHandle.props.onResponderGrant(startEvent);
      });

      const activeHandle = view.getByTestId('item-drag-handle-item-1');
      await act(async () => {
        activeHandle.props.onResponderMove(createResponderEvent(200, 0, 20));
      });
      expect(requestFrame).toHaveBeenCalled();

      for (let frame = 0; frame < 30; frame += 1) {
        const callback = frames.shift();
        if (!callback) break;
        await act(async () => {
          callback((frame + 1) * 16);
        });
      }

      await act(async () => {
        activeHandle.props.onResponderRelease(
          createResponderEvent(200, 200, 40),
        );
      });
      expect(view.queryByTestId('setlist-drag-preview')).toBeNull();
      await fireEvent.press(view.getByLabelText('Salvar setlist'));
      expect(onSubmit).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'block-1',
          items: [],
        }),
        expect.objectContaining({ id: 'block-2' }),
        expect.objectContaining({ id: 'block-3' }),
        expect.objectContaining({
          id: 'block-4',
          items: [expect.objectContaining({ id: 'item-1' })],
        }),
      ]);
    } finally {
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    }
  });
});
