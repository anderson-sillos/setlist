import { completesAndroidDrawerGesture } from '@/features/navigation/drawerGestures';

describe('gestos do menu Android', () => {
  it.each([
    ['abertura lenta', 'open', 48, 0, 0, true],
    ['fechamento lento', 'close', -48, 0, 0, true],
    ['abertura diagonal leve', 'open', 80, 35, 120, true],
    ['fechamento diagonal leve', 'close', -80, -35, -120, true],
    ['abertura rápida curta', 'open', 24, 3, 350, true],
    ['fechamento rápido curto', 'close', -24, 3, -350, true],
    ['abertura curta lenta', 'open', 24, 0, 100, false],
    ['fechamento curto lento', 'close', -24, 0, -100, false],
    [
      'distância insuficiente mesmo com velocidade',
      'close',
      -17,
      0,
      -900,
      false,
    ],
    ['distância anterior ao limite', 'open', 47, 0, 0, false],
    ['velocidade anterior ao limite', 'close', -24, 0, -249, false],
    ['abertura vertical', 'open', 50, 80, 900, false],
    ['fechamento vertical', 'close', -50, 80, -900, false],
    ['abertura na direção errada', 'open', -80, 0, -900, false],
    ['fechamento na direção errada', 'close', 80, 0, 900, false],
    ['recuo rápido após tentar abrir', 'open', 80, 0, -500, false],
    ['recuo rápido após tentar fechar', 'close', -80, 0, 500, false],
  ] as const)(
    '%s',
    (_label, direction, translationX, translationY, velocityX, expected) => {
      expect(
        completesAndroidDrawerGesture({
          direction,
          translationX,
          translationY,
          velocityX,
        }),
      ).toBe(expected);
    },
  );
});
