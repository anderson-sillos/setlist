import { useCallback, useRef, useState } from 'react';

const HIDE_CONTROLS_SCROLL_DISTANCE = 48;
const SHOW_CONTROLS_SCROLL_DISTANCE = 24;
const TOP_OFFSET_THRESHOLD = 8;
const DIRECTION_NOISE_THRESHOLD = 6;

export function useScrollDirectionVisibility(initialOffset = 0) {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const directionAnchor = useRef(Math.max(0, initialOffset));
  const lastOffset = useRef(Math.max(0, initialOffset));
  const gestureAnchor = useRef(Math.max(0, initialOffset));
  const lastDirection = useRef<'down' | 'up' | null>(null);
  const momentumActive = useRef(false);

  const beginDrag = useCallback(() => {
    momentumActive.current = false;
    lastDirection.current = null;
    directionAnchor.current = lastOffset.current;
    gestureAnchor.current = lastOffset.current;
  }, []);

  const beginMomentum = useCallback(() => {
    momentumActive.current = true;
  }, []);

  const endMomentum = useCallback(() => {
    momentumActive.current = false;
    directionAnchor.current = lastOffset.current;
    gestureAnchor.current = lastOffset.current;
  }, []);

  const updateVisibility = useCallback(
    (offsetY: number, maximumOffset = Infinity) => {
      // Ignore overscroll: a bounce at either end is not a change of intent.
      const offset = Math.max(0, Math.min(offsetY, Math.max(0, maximumOffset)));
      lastOffset.current = offset;
      if (!momentumActive.current || lastDirection.current === null) {
        const delta = offset - gestureAnchor.current;
        if (
          (lastDirection.current === 'down' && delta >= 0) ||
          (lastDirection.current === 'up' && delta <= 0)
        ) {
          gestureAnchor.current = offset;
        } else if (Math.abs(delta) >= DIRECTION_NOISE_THRESHOLD) {
          lastDirection.current = delta > 0 ? 'down' : 'up';
          gestureAnchor.current = offset;
        }
      }

      // Inertia keeps the user's last direction, even if native offsets briefly
      // move backwards. A new drag can deliberately reverse it immediately.
      if (
        momentumActive.current &&
        ((lastDirection.current === 'down' && !visibleRef.current) ||
          (lastDirection.current === 'up' && visibleRef.current))
      ) {
        return;
      }

      if (offset <= TOP_OFFSET_THRESHOLD) {
        directionAnchor.current = offset;
        if (!visibleRef.current) {
          visibleRef.current = true;
          setVisible(true);
        }
        return;
      }

      // Measure net travel from the furthest point, rather than summing jitter.
      directionAnchor.current = visibleRef.current
        ? Math.min(directionAnchor.current, offset)
        : Math.max(directionAnchor.current, offset);
      const distance = Math.abs(offset - directionAnchor.current);
      const threshold = visibleRef.current
        ? HIDE_CONTROLS_SCROLL_DISTANCE
        : SHOW_CONTROLS_SCROLL_DISTANCE;

      const nextVisible = !visibleRef.current;
      const momentumAllowsChange =
        !momentumActive.current ||
        lastDirection.current === null ||
        (nextVisible
          ? lastDirection.current === 'up'
          : lastDirection.current === 'down');
      if (distance >= threshold && momentumAllowsChange) {
        visibleRef.current = !visibleRef.current;
        directionAnchor.current = offset;
        setVisible(visibleRef.current);
      }
    },
    [],
  );

  return { beginDrag, beginMomentum, endMomentum, updateVisibility, visible };
}
