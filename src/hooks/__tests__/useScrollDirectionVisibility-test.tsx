import { act, renderHook } from '@testing-library/react-native';

import { useScrollDirectionVisibility } from '@/hooks/useScrollDirectionVisibility';

describe('useScrollDirectionVisibility', () => {
  it('acompanha a rolagem lenta sem alternar por pequenas reversões', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );
    const scroll = result.current.updateVisibility;

    await act(() => {
      [102, 101, 107, 106, 118, 117, 130, 129, 147].forEach((offset) =>
        scroll(offset),
      );
    });
    expect(result.current.visible).toBe(true);

    await act(() => scroll(149));
    expect(result.current.visible).toBe(false);

    await act(() => {
      [155, 153, 163, 162, 170, 166, 170, 164, 168, 160, 168].forEach(
        (offset) => scroll(offset),
      );
    });
    expect(result.current.visible).toBe(false);

    await act(() => scroll(146));
    expect(result.current.visible).toBe(true);

    await act(() => {
      [148, 147, 159, 158, 173].forEach((offset) => scroll(offset));
    });
    expect(result.current.visible).toBe(true);

    await act(() => scroll(194));
    expect(result.current.visible).toBe(false);
  });

  it('ignora o rebote no fim da lista e reconhece uma subida intencional', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );

    await act(() => {
      [151, 200, 240, 225, 201, 200, 199].forEach((offset) =>
        result.current.updateVisibility(offset, 200),
      );
    });
    expect(result.current.visible).toBe(false);

    await act(() => result.current.updateVisibility(176, 200));
    expect(result.current.visible).toBe(true);
  });

  it('mantém os controles no topo e em listas sem área para rolagem', async () => {
    const { result } = await renderHook(() => useScrollDirectionVisibility());

    await act(() => result.current.updateVisibility(80));
    expect(result.current.visible).toBe(false);

    await act(() => result.current.updateVisibility(8));
    expect(result.current.visible).toBe(true);

    await act(() => {
      [-20, 0, 16, 48, 100].forEach((offset) =>
        result.current.updateVisibility(offset, 0),
      );
    });
    expect(result.current.visible).toBe(true);
  });

  it('mantém os controles ocultos durante a inércia de uma descida rápida', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );

    await act(() => {
      result.current.beginDrag();
      result.current.updateVisibility(160);
      result.current.updateVisibility(230);
      // A tiny reversal just before release does not change the gesture intent.
      result.current.updateVisibility(228);
      result.current.beginMomentum();
    });
    expect(result.current.visible).toBe(false);

    for (const offset of [340, 290, 420, 380, 540, 490]) {
      await act(() => result.current.updateVisibility(offset));
      expect(result.current.visible).toBe(false);
    }

    await act(() => result.current.endMomentum());
    await act(() => result.current.updateVisibility(490));
    expect(result.current.visible).toBe(false);
  });

  it('revela os controles em uma nova subida mesmo antes da inércia terminar', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );

    await act(() => {
      result.current.beginDrag();
      result.current.updateVisibility(160);
      result.current.beginMomentum();
      result.current.updateVisibility(400);
      result.current.beginDrag();
      result.current.updateVisibility(375);
    });
    expect(result.current.visible).toBe(true);

    await act(() => result.current.beginMomentum());
    for (const offset of [280, 340, 150, 230]) {
      await act(() => result.current.updateVisibility(offset));
      expect(result.current.visible).toBe(true);
    }
  });

  it('recolhe na inércia quando o arraste rápido inicial ainda é curto', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );

    await act(() => {
      result.current.beginDrag();
      result.current.updateVisibility(120);
      result.current.beginMomentum();
    });
    expect(result.current.visible).toBe(true);

    await act(() => result.current.updateVisibility(150));
    expect(result.current.visible).toBe(false);

    await act(() => result.current.updateVisibility(115));
    expect(result.current.visible).toBe(false);
  });

  it('reconhece o gesto rápido mesmo quando o primeiro scroll chega após o início da inércia', async () => {
    const { result } = await renderHook(() =>
      useScrollDirectionVisibility(100),
    );

    await act(() => {
      result.current.beginDrag();
      result.current.beginMomentum();
      result.current.updateVisibility(180);
    });
    expect(result.current.visible).toBe(false);

    for (const offset of [260, 220, 320, 280]) {
      await act(() => result.current.updateVisibility(offset));
      expect(result.current.visible).toBe(false);
    }
  });
});
