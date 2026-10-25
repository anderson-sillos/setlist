import {
  getCenteredLyricScrollOffset,
  getLyricFollowTargetGroup,
  getLyricGroupBounds,
  getLyricScrollBehavior,
  getLyricsEdgeSpacer,
} from '@/features/repertoire/lyricAutoScroll';
import { projectTimedLyrics } from '@/features/repertoire/timedLyrics';
import {
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
} from '@/testing/factories';

function groupWithIds(...ids: readonly string[]) {
  const projection = projectTimedLyrics(
    createLyricDocument({
      blocks: [
        createLyricBlock({
          lines: ids.map((id) =>
            createLyricLine({ id, startTimeMs: 0, text: id }),
          ),
        }),
      ],
    }),
  );

  return projection.groups[0]!;
}

describe('rolagem centralizada da letra', () => {
  it('suaviza a centralização e respeita movimento reduzido', () => {
    expect(getLyricScrollBehavior(false)).toBe('smooth');
    expect(getLyricScrollBehavior(true)).toBe('auto');
  });

  it('calcula o centro considerando a altura final após as quebras de texto', () => {
    const bounds = getLyricGroupBounds(
      groupWithIds('wrapped'),
      new Map([['wrapped', { top: 300, height: 144 }]]),
    );

    expect(bounds).toEqual({ top: 300, height: 144 });
    expect(getCenteredLyricScrollOffset(bounds!, 600)).toBe(72);
  });

  it('usa as extremidades do grupo de horários iguais', () => {
    const group = groupWithIds('first', 'second');
    const bounds = getLyricGroupBounds(
      group,
      new Map([
        ['first', { top: 200, height: 50 }],
        ['second', { top: 330, height: 50 }],
      ]),
    );

    expect(bounds).toEqual({ top: 200, height: 180 });
    expect(getCenteredLyricScrollOffset(bounds!, 600)).toBe(0);
  });

  it('acompanha a primeira marca antes do início e preserva a última após o fim', () => {
    const projection = projectTimedLyrics(
      createLyricDocument({
        blocks: [
          createLyricBlock({
            lines: [
              createLyricLine({
                id: 'first',
                startTimeMs: 2_000,
                text: 'Início',
              }),
              createLyricLine({
                id: 'last',
                startTimeMs: 8_000,
                text: 'Final',
              }),
            ],
          }),
        ],
      }),
    );

    expect(getLyricFollowTargetGroup(projection.groups, 0, 10_000)?.id).toBe(
      'first',
    );
    expect(
      getLyricFollowTargetGroup(projection.groups, 5_000, 10_000)?.id,
    ).toBe('first');
    expect(
      getLyricFollowTargetGroup(projection.groups, 10_000, 10_000)?.id,
    ).toBe('last');
  });

  it('não escolhe um trecho sem grupos ou com tempo inválido', () => {
    const groups = projectTimedLyrics(
      createLyricDocument({ blocks: [createLyricBlock({ lines: [] })] }),
    ).groups;
    const timedGroups = [groupWithIds('line')];

    expect(getLyricFollowTargetGroup(groups, 0, null)).toBeNull();
    expect(getLyricFollowTargetGroup(timedGroups, Number.NaN, null)).toBeNull();
    expect(getLyricFollowTargetGroup(timedGroups, -1, null)).toBeNull();
  });

  it('adiciona respiro para centralizar a primeira e a última linha', () => {
    expect(getLyricsEdgeSpacer(600)).toBe(300);
    expect(getCenteredLyricScrollOffset({ top: 300, height: 48 }, 600)).toBe(
      24,
    );
    expect(getCenteredLyricScrollOffset({ top: 1_000, height: 48 }, 600)).toBe(
      724,
    );
  });

  it('alinha pelo início quando o trecho excede a área visível', () => {
    expect(
      getCenteredLyricScrollOffset({ top: 400, height: 800 }, 600, 20),
    ).toBe(380);
  });

  it('recalcula o centro quando a área visível muda de tamanho', () => {
    const bounds = { height: 64, top: 500 };

    expect(getCenteredLyricScrollOffset(bounds, 600)).toBe(232);
    expect(getCenteredLyricScrollOffset(bounds, 400)).toBe(332);
  });

  it('rejeita área útil ou medições inválidas', () => {
    expect(getCenteredLyricScrollOffset({ top: 0, height: 20 }, 0)).toBeNull();
    expect(
      getLyricGroupBounds(
        groupWithIds('line'),
        new Map([['line', { top: Number.NaN, height: 20 }]]),
      ),
    ).toBeNull();
  });
});
