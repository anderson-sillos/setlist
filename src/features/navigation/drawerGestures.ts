export const androidDrawerGesture = {
  activationDistance: 8,
  edgeWidth: 24,
  horizontalRatio: 1.25,
  minimumFlingDistance: 18,
  minimumFlingVelocity: 250,
  completionDistance: 48,
  verticalTolerance: 18,
} as const;

export function completesAndroidDrawerGesture({
  direction,
  translationX,
  translationY,
  velocityX,
}: {
  readonly direction: 'open' | 'close';
  readonly translationX: number;
  readonly translationY: number;
  readonly velocityX: number;
}): boolean {
  const sign = direction === 'open' ? 1 : -1;
  const distance = translationX * sign;
  const velocity = velocityX * sign;
  return (
    velocity > -androidDrawerGesture.minimumFlingVelocity &&
    distance > Math.abs(translationY) * androidDrawerGesture.horizontalRatio &&
    (distance >= androidDrawerGesture.completionDistance ||
      (distance >= androidDrawerGesture.minimumFlingDistance &&
        velocity >= androidDrawerGesture.minimumFlingVelocity))
  );
}
