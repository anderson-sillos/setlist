import * as ExpoCrypto from 'expo-crypto';

import type { LyricBlock, LyricDocument, LyricLine } from '@/domain';

export const lyricBlockMarker = '#';
export const lyricBlankLineMarker = '---';

function createLine(
  text: string,
  previousLine: LyricLine | undefined,
): LyricLine {
  return {
    id: previousLine?.id ?? ExpoCrypto.randomUUID(),
    startTimeMs: previousLine?.startTimeMs ?? null,
    text,
  };
}

function createBlock(
  name: string | null,
  lines: readonly string[],
  previousBlock: LyricBlock | undefined,
): LyricBlock {
  return {
    id: previousBlock?.id ?? ExpoCrypto.randomUUID(),
    name,
    lines: lines.map((text, index) =>
      createLine(text, previousBlock?.lines[index]),
    ),
  };
}

export function lyricDocumentToText(document: LyricDocument): string {
  return document.blocks
    .map((block) => {
      const header = block.name
        ? `${lyricBlockMarker} ${block.name}`
        : lyricBlockMarker;
      const lines = block.lines.map(({ text }) =>
        text.trim().length > 0 ? text : lyricBlankLineMarker,
      );

      return [header, ...lines].join('\n');
    })
    .join('\n\n');
}

export function parseLyricText(
  text: string,
  previousDocument: LyricDocument,
): LyricDocument {
  const blocks: { name: string | null; lines: string[] }[] = [];
  let current = { name: null as string | null, lines: [] as string[] };

  const pushCurrent = () => {
    if (current.lines.length > 0 || current.name !== null) {
      blocks.push(current);
    }
  };

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trimEnd();
    const marker = line.match(/^#\s*(.*)$/);

    if (marker) {
      pushCurrent();
      current = { name: marker[1]?.trim() || null, lines: [] };
      continue;
    }

    if (line.trim() === lyricBlankLineMarker) {
      current.lines.push('');
      continue;
    }

    if (line.trim().length > 0) {
      current.lines.push(line);
    }
  }
  pushCurrent();

  return {
    blocks: blocks.map((block, blockIndex) =>
      createBlock(block.name, block.lines, previousDocument.blocks[blockIndex]),
    ),
  };
}
