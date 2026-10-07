import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

let mockBeforeRemove:
  | ((event: {
      preventDefault: () => void;
      data: { action: { type: string } };
    }) => void)
  | undefined;
const mockDispatch = jest.fn();
const mockAddListener = jest.fn(
  (_type: string, callback: typeof mockBeforeRemove) => {
    mockBeforeRemove = callback;
    return jest.fn();
  },
);

jest.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: mockAddListener,
    dispatch: mockDispatch,
  }),
}));

describe('useUnsavedChangesGuard', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  beforeEach(() => {
    mockBeforeRemove = undefined;
    mockDispatch.mockClear();
    mockAddListener.mockClear();
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(Platform, 'OS', originalPlatform);
    }
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  });

  it('asks before removing a dirty route and dispatches only after discard', async () => {
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: true, saving: false }),
    );
    const preventDefault = jest.fn();

    await act(async () => {
      mockBeforeRemove?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.confirmationVisible).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();

    await act(async () => result.current.discardAndLeave());

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    expect(result.current.confirmationVisible).toBe(false);
  });

  it('keeps the route while saving and does not open the discard prompt', async () => {
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: true, saving: true }),
    );
    const preventDefault = jest.fn();

    await act(async () => {
      mockBeforeRemove?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.confirmationVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('permite sair de uma rota sem alterações', async () => {
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: false, saving: false }),
    );
    const preventDefault = jest.fn();

    await act(() => {
      mockBeforeRemove?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.confirmationVisible).toBe(false);
  });

  it('continuar editando cancela a saída pendente e um novo descarte usa somente a nova ação', async () => {
    const firstExit = jest.fn();
    const secondExit = jest.fn();
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: true, saving: false }),
    );

    await act(() => result.current.requestConfirmation(firstExit));
    expect(result.current.confirmationVisible).toBe(true);
    await act(() => result.current.continueEditing());
    expect(result.current.confirmationVisible).toBe(false);
    await act(() => result.current.discardAndLeave());
    expect(firstExit).not.toHaveBeenCalled();

    await act(() => result.current.requestConfirmation(secondExit));
    await act(() => result.current.discardAndLeave());
    await act(() => result.current.discardAndLeave());
    expect(secondExit).toHaveBeenCalledTimes(1);
    expect(firstExit).not.toHaveBeenCalled();
  });

  it('bloqueia saída solicitada pelo formulário durante a gravação e libera após a falha', async () => {
    const exit = jest.fn();
    const { result, rerender } = await renderHook(
      ({ saving }: { saving: boolean }) =>
        useUnsavedChangesGuard({ dirty: true, saving }),
      { initialProps: { saving: true } },
    );

    await act(() => result.current.requestConfirmation(exit));
    expect(result.current.confirmationVisible).toBe(false);
    expect(exit).not.toHaveBeenCalled();

    await rerender({ saving: false });
    await act(() => result.current.requestConfirmation(exit));
    expect(result.current.confirmationVisible).toBe(true);
    await act(() => result.current.discardAndLeave());
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('libera o retorno após salvar mesmo antes de o estado alterado ser limpo', async () => {
    const exit = jest.fn();
    const { result, rerender } = await renderHook(
      ({ saving }: { saving: boolean }) =>
        useUnsavedChangesGuard({ dirty: true, saving }),
      { initialProps: { saving: false } },
    );
    await act(() => result.current.requestConfirmation(exit));
    await act(() => result.current.allowNextRemoval());
    await rerender({ saving: true });
    const preventDefault = jest.fn();

    await act(() => {
      mockBeforeRemove?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
      mockBeforeRemove?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
      result.current.discardAndLeave();
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(result.current.confirmationVisible).toBe(false);
  });

  it('acompanha novas alterações depois de continuar editando', async () => {
    const { result, rerender } = await renderHook(
      ({ dirty }: { dirty: boolean }) =>
        useUnsavedChangesGuard({ dirty, saving: false }),
      { initialProps: { dirty: false } },
    );
    await rerender({ dirty: true });
    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: 'GO_BACK' } },
    };

    await act(() => mockBeforeRemove?.(event));
    await act(() => result.current.continueEditing());
    await act(() => mockBeforeRemove?.(event));
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(result.current.confirmationVisible).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('registra o aviso de fechar aba somente enquanto houver alterações na Web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener, removeEventListener },
    });
    const { rerender, unmount } = await renderHook(
      ({ dirty }: { dirty: boolean }) =>
        useUnsavedChangesGuard({ dirty, saving: false }),
      { initialProps: { dirty: false } },
    );
    expect(addEventListener).not.toHaveBeenCalled();
    await rerender({ dirty: true });
    expect(addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function),
    );
    const listener = addEventListener.mock.calls[0][1] as (
      event: BeforeUnloadEvent,
    ) => void;
    const event = { preventDefault: jest.fn(), returnValue: undefined };
    listener(event as unknown as BeforeUnloadEvent);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.returnValue).toBe('');

    await rerender({ dirty: false });
    expect(removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
    await unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('remove o aviso ao desmontar o editor Web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener, removeEventListener },
    });
    const { unmount } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: true, saving: false }),
    );
    await unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'beforeunload',
      addEventListener.mock.calls[0][1],
    );
  });

  it('não registra aviso de aba quando não existe window', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    Reflect.deleteProperty(globalThis, 'window');
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ dirty: true, saving: false }),
    );
    expect(result.current.confirmationVisible).toBe(false);
  });
});
