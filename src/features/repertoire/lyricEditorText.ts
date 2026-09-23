import * as ExpoCrypto from 'expo-crypto';

import type { LyricBlock, LyricDocument, LyricLine } from '@/domain';

export const lyricBlockMarker = '#';
export const lyricBlankLineMarker = '---';
export const lyricBoldMarker = '**';
export const lyricSeparatorMarker = '***';

interface ParsedLyricLine {
  readonly bold?: boolean;
  readonly kind?: 'separator';
  readonly text: string;
}

function createLine(
  parsedLine: ParsedLyricLine,
  previousLine: LyricLine | undefined,
): LyricLine {
  return {
    id: previousLine?.id ?? ExpoCrypto.randomUUID(),
    startTimeMs:
      parsedLine.kind === 'separator'
        ? null
        : (previousLine?.startTimeMs ?? null),
    text: parsedLine.text,
    ...(parsedLine.bold ? { bold: true } : {}),
    ...(parsedLine.kind === 'separator' ? { kind: 'separator' as const } : {}),
  };
}

function createBlock(
  name: string | null,
  lines: readonly ParsedLyricLine[],
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
      const lines = block.lines.map((line) => {
        if (line.kind === 'separator') {
          return lyricSeparatorMarker;
        }

        if (line.text.trim().length === 0) {
          return lyricBlankLineMarker;
        }

        return line.bold
          ? `${lyricBoldMarker}${line.text}${lyricBoldMarker}`
          : line.text;
      });

      return [header, ...lines].join('\n');
    })
    .join('\n\n');
}

export function parseLyricText(
  text: string,
  previousDocument: LyricDocument,
): LyricDocument {
  const blocks: { name: string | null; lines: ParsedLyricLine[] }[] = [];
  let current = {
    name: null as string | null,
    lines: [] as ParsedLyricLine[],
  };

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

    if (line.trim() === lyricSeparatorMarker) {
      current.lines.push({ kind: 'separator', text: '' });
      continue;
    }

    if (line.trim() === lyricBlankLineMarker) {
      current.lines.push({ text: '' });
      continue;
    }

    if (line.trim().length > 0) {
      const boldMatch = line.match(/^\*\*(.*)\*\*$/);

      if (boldMatch && boldMatch[1]?.trim().length > 0) {
        current.lines.push({ bold: true, text: boldMatch[1] });
      } else {
        current.lines.push({ text: line });
      }
    }
  }
  pushCurrent();

  return {
    blocks: blocks.map((block, blockIndex) =>
      createBlock(block.name, block.lines, previousDocument.blocks[blockIndex]),
    ),
  };
}
