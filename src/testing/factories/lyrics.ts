import type {
  LyricBlock,
  LyricDocument,
  LyricLine,
  LyricStatus,
} from '@/domain';

export function createLyricLine(overrides: Partial<LyricLine> = {}): LyricLine {
  return {
    id: 'line-test',
    text: 'Linha da letra',
    startTimeMs: null,
    ...overrides,
  };
}

export function createLyricBlock(
  overrides: Partial<LyricBlock> = {},
): LyricBlock {
  const { lines, ...fields } = overrides;

  return {
    id: 'block-test',
    name: 'Verso',
    ...fields,
    lines: lines?.map((line) => ({ ...line })) ?? [],
  };
}

export function createLyricDocument(
  overrides: Partial<LyricDocument> = {},
): LyricDocument {
  return {
    blocks: overrides.blocks?.map((block) => createLyricBlock(block)) ?? [],
  };
}

/** Produces an explicit lyric document whose derived status matches the input. */
export function createLyricsForStatus(status: LyricStatus): LyricDocument {
  switch (status) {
    case 'missing':
      return createLyricDocument();
    case 'static':
      return createLyricDocument({
        blocks: [
          createLyricBlock({
            lines: [
              createLyricLine({ text: 'Uma linha sem marcação de tempo' }),
            ],
          }),
        ],
      });
    case 'incomplete':
      return createLyricDocument({
        blocks: [
          createLyricBlock({
            lines: [
              createLyricLine({
                id: 'line-timed',
                text: 'Primeira linha',
                startTimeMs: 0,
              }),
              createLyricLine({ id: 'line-untimed', text: 'Segunda linha' }),
            ],
          }),
        ],
      });
    case 'synchronized':
      return createLyricDocument({
        blocks: [
          createLyricBlock({
            lines: [
              createLyricLine({
                id: 'line-first',
                text: 'Primeira linha',
                startTimeMs: 0,
              }),
              createLyricLine({
                id: 'line-second',
                text: 'Segunda linha',
                startTimeMs: 1500,
              }),
            ],
          }),
        ],
      });
  }
}
