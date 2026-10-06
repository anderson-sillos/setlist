import { useCallback, useRef, useState } from 'react';

const HIDE_CONTROLS_SCROLL_DISTANCE = 24;
const SHOW_CONTROLS_SCROLL_DISTANCE = 32;
const SCROLL_DIRECTION_DEAD_ZONE = 3;
const TOP_OFFSET_THRESHOLD = 4;

export function useScrollDirectionVisibility(initialOffset = 0) {
  const [visible, setVisible] = useState(true);
  const lastStableOffset = useRef(initialOffset);
  const lastDirection = useRef<-1 | 0 | 1>(0);
  const directionalDistance = useRef(0);

  const updateVisibility = useCallback(
    (offsetY: number) => {
      if (offsetY <= TOP_OFFSET_THRESHOLD) {
        lastStableOffset.current = offsetY;
        lastDirection.current = 0;
        directionalDistance.current = 0;
        setVisible(true);
        return;
      }

      const movement = offsetY - lastStableOffset.current;

      if (Math.abs(movement) < SCROLL_DIRECTION_DEAD_ZONE) {
        return;
      }

      lastStableOffset.current = offsetY;
      const direction: -1 | 1 = movement > 0 ? 1 : -1;

      if (direction !== lastDirection.current) {
        lastDirection.current = direction;
        directionalDistance.current = Math.abs(movement);
      } else {
        directionalDistance.current += Math.abs(movement);
      }

      const threshold =
        direction > 0
          ? HIDE_CONTROLS_SCROLL_DISTANCE
          : SHOW_CONTROLS_SCROLL_DISTANCE;
      const shouldChangeVisibility =
        directionalDistance.current >= threshold &&
        (direction > 0 ? visible : !visible);

      if (shouldChangeVisibility) {
        directionalDistance.current = 0;
        setVisible(direction < 0);
      }
    },
    [visible],
  );

  return { updateVisibility, visible };
}
