import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { LyricDocument } from '@/domain';
import { colors, spacing } from '@/theme/tokens';

interface SongLyricsContentProps {
  readonly activeLineIds?: ReadonlySet<string>;
  readonly lyrics: LyricDocument;
  readonly onBlockLayout?: (blockId: string, top: number) => void;
  readonly onDocumentLayout?: (top: number) => void;
  readonly onLineLayout?: (
    lineId: string,
    blockId: string,
    top: number,
    height: number,
    target?: unknown,
  ) => void;
  readonly onTimedLinePress?: (startTimeMs: number) => void;
  readonly variant?: 'card' | 'fullscreen';
}

export function SongLyricsContent({
  activeLineIds,
  lyrics,
  onBlockLayout,
  onDocumentLayout,
  onLineLayout,
  onTimedLinePress,
  variant = 'card',
}: SongLyricsContentProps) {
  const isFullscreen = variant === 'fullscreen';
  const hasTimedHighlight = isFullscreen && activeLineIds !== undefined;

  const hasDisplayableContent = lyrics.blocks.some((block) =>
    block.lines.some(
      (line) => line.kind === 'separator' || line.text.trim().length > 0,
    ),
  );

  if (!hasDisplayableContent) {
    return (
      <AppText tone="inverse">
        {lyrics.isInstrumental === true
          ? 'Música instrumental'
          : 'Sem letra cadastrada'}
      </AppText>
    );
  }

  return (
    <View
      onLayout={(event) => onDocumentLayout?.(event.nativeEvent.layout.y)}
      style={[styles.document, isFullscreen && styles.fullscreenDocument]}
      testID="lyrics-document"
    >
      {lyrics.isInstrumental === true ? (
        <AppText tone="inverse" variant="caption">
          Música instrumental
        </AppText>
      ) : null}
      {lyrics.blocks.map((block) => (
        <View
          key={block.id}
          onLayout={(event) =>
            onBlockLayout?.(block.id, event.nativeEvent.layout.y)
          }
          style={styles.block}
          testID={`lyrics-block-${block.id}`}
        >
          {block.name ? (
            <AppText
              style={
                isFullscreen
                  ? [styles.blockName, styles.fullscreenBlockName]
                  : styles.blockName
              }
              tone="inverse"
            >
              {block.name}
            </AppText>
          ) : null}
          {block.lines.map((line) =>
            line.kind === 'separator' ? (
              <View
                accessibilityLabel="Linha de separação"
                accessible
                key={line.id}
                style={[
                  styles.separator,
                  isFullscreen && styles.fullscreenSeparator,
                ]}
                testID={`lyric-separator-${line.id}`}
              />
            ) : (
              <LyricTextLine
                active={
                  Boolean(activeLineIds?.has(line.id)) && hasTimedHighlight
                }
                blockId={block.id}
                dimmed={hasTimedHighlight && !activeLineIds?.has(line.id)}
                key={line.id}
                line={line}
                onLayout={onLineLayout}
                onPress={onTimedLinePress}
                fullscreen={isFullscreen}
              />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

interface LyricTextLineProps {
  readonly active: boolean;
  readonly blockId: string;
  readonly dimmed: boolean;
  readonly fullscreen: boolean;
  readonly line: LyricDocument['blocks'][number]['lines'][number];
  readonly onLayout?: SongLyricsContentProps['onLineLayout'];
  readonly onPress?: (startTimeMs: number) => void;
}

function LyricTextLine({
  active,
  blockId,
  dimmed,
  fullscreen,
  line,
  onLayout,
  onPress,
}: LyricTextLineProps) {
  const canSeek =
    fullscreen &&
    onPress !== undefined &&
    line.startTimeMs !== null &&
    Number.isFinite(line.startTimeMs) &&
    line.startTimeMs >= 0 &&
    line.text.trim().length > 0;

  return (
    <AppText
      accessibilityHint={
        canSeek ? 'Posiciona o cronômetro no início desta linha.' : undefined
      }
      accessibilityLabel={canSeek ? `Ir para ${line.text}` : undefined}
      accessibilityRole={canSeek ? 'button' : undefined}
      accessibilityState={canSeek ? { selected: active } : undefined}
      onPress={
        canSeek ? () => onPress?.(line.startTimeMs as number) : undefined
      }
      onLayout={(event: LayoutChangeEvent) => {
        const nativeEvent =
          event.nativeEvent as LayoutChangeEvent['nativeEvent'] & {
            target?: unknown;
          };
        onLayout?.(
          line.id,
          blockId,
          nativeEvent.layout.y,
          nativeEvent.layout.height,
          nativeEvent.target,
        );
      }}
      style={[
        styles.line,
        fullscreen && styles.fullscreenLine,
        dimmed && styles.dimmedTimedLine,
        line.text.length === 0 && styles.blankLine,
        fullscreen && line.text.length === 0 && styles.fullscreenBlankLine,
        active && styles.activeLine,
        line.bold && styles.boldLine,
      ]}
      testID={active ? `lyric-line-active-${line.id}` : `lyric-line-${line.id}`}
      tone="inverse"
    >
      {line.text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  document: {
    gap: spacing.xxl,
  },
  fullscreenDocument: {
    gap: spacing.xxxl,
  },
  block: {
    gap: spacing.sm,
  },
  blockName: {
    fontWeight: '800',
    marginBottom: spacing.xs,
    opacity: 0.55,
  },
  fullscreenBlockName: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7,
  },
  line: {
    minHeight: 24,
  },
  fullscreenLine: {
    fontSize: 24,
    lineHeight: 38,
  },
  dimmedTimedLine: {
    opacity: 0.65,
  },
  activeLine: {
    fontWeight: '700',
    marginVertical: spacing.sm,
    opacity: 1,
  },
  blankLine: {
    minHeight: spacing.md,
  },
  fullscreenBlankLine: {
    minHeight: spacing.lg,
  },
  boldLine: {
    fontWeight: '800',
  },
  separator: {
    borderTopColor: colors.text.secondary,
    borderTopWidth: 1,
    marginVertical: spacing.sm,
    minHeight: 1,
    opacity: 0.72,
  },
  fullscreenSeparator: {
    marginVertical: spacing.lg,
  },
});
