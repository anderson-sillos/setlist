import type { LyricDocument } from '@/domain/entities';

export type DerivedLyricStatus =
  'missing' | 'static' | 'incomplete' | 'synchronized';

export function deriveLyricStatus(document: LyricDocument): DerivedLyricStatus {
  const textLines = document.blocks.flatMap((block) =>
    block.lines.filter((line) => line.text.trim().length > 0),
  );

  if (textLines.length === 0) {
    return 'missing';
  }

  const timedLines = textLines.filter((line) => line.startTimeMs !== null);

  if (timedLines.length === 0) {
    return 'static';
  }

  if (
    timedLines.length < textLines.length ||
    timedLines.some(
      (line, index) =>
        index > 0 &&
        line.startTimeMs! < (timedLines[index - 1]?.startTimeMs ?? 0),
    )
  ) {
    return 'incomplete';
  }

  return 'synchronized';
}
