import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { LyricDocument } from '@/domain';
import { colors, spacing } from '@/theme/tokens';

interface SongLyricsContentProps {
  readonly lyrics: LyricDocument;
  readonly variant?: 'card' | 'fullscreen';
}

export function SongLyricsContent({
  lyrics,
  variant = 'card',
}: SongLyricsContentProps) {
  const isFullscreen = variant === 'fullscreen';

  if (lyrics.blocks.length === 0) {
    return <AppText tone="inverse">Sem letra cadastrada</AppText>;
  }

  return (
    <>
      {lyrics.blocks.map((block) => (
        <View key={block.id} style={styles.block}>
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
              <AppText
                key={line.id}
                style={[
                  styles.line,
                  isFullscreen && styles.fullscreenLine,
                  line.text.length === 0 && styles.blankLine,
                  isFullscreen &&
                    line.text.length === 0 &&
                    styles.fullscreenBlankLine,
                  line.bold && styles.boldLine,
                ]}
                tone="inverse"
              >
                {line.text}
              </AppText>
            ),
          )}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
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
    borderTopColor: colors.muted,
    borderTopWidth: 1,
    marginVertical: spacing.sm,
    minHeight: 1,
    opacity: 0.72,
  },
  fullscreenSeparator: {
    marginVertical: spacing.lg,
  },
});
