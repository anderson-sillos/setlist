import { act, renderHook } from '@testing-library/react-native';
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
  beforeEach(() => {
    mockBeforeRemove = undefined;
    mockDispatch.mockClear();
    mockAddListener.mockClear();
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
});
