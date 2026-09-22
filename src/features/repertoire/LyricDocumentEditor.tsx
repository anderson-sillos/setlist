import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import type { LyricDocument } from '@/domain';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';
import { lyricDocumentToText, parseLyricText } from './lyricEditorText';

interface LyricDocumentEditorProps {
  readonly document: LyricDocument;
  readonly onChange: (document: LyricDocument) => void;
}

export function LyricDocumentEditor({
  document,
  onChange,
}: LyricDocumentEditorProps) {
  const [draftText, setDraftText] = useState(() =>
    lyricDocumentToText(document),
  );
  const lastParsedDocument = useRef(document);

  useEffect(() => {
    if (document !== lastParsedDocument.current) {
      lastParsedDocument.current = document;
      setDraftText(lyricDocumentToText(document));
    }
  }, [document]);

  const handleTextChange = (text: string) => {
    const nextDocument = parseLyricText(text, document);
    lastParsedDocument.current = nextDocument;
    setDraftText(text);
    onChange(nextDocument);
  };

  return (
    <View style={styles.editor} testID="lyric-document-editor">
      <View style={styles.sectionHeading}>
        <AppText accessibilityRole="header" variant="heading">
          Letra
        </AppText>
        <AppText tone="muted">
          Cole ou digite a letra completa. Use{' '}
          <AppText style={styles.marker}># Nome do bloco</AppText> para separar
          blocos e <AppText style={styles.marker}>---</AppText> para inserir uma
          linha em branco.
        </AppText>
      </View>

      <View style={styles.inputFrame}>
        <TextInput
          accessibilityLabel="Letra completa"
          autoCapitalize="sentences"
          multiline
          onChangeText={handleTextChange}
          placeholder={
            '# Verso\nDigite ou cole a letra completa aqui…\n---\n# Refrão'
          }
          placeholderTextColor={colors.muted}
          scrollEnabled
          style={styles.input}
          textAlignVertical="top"
          testID="lyric-full-text"
          value={draftText}
        />
        <View style={styles.inputHint}>
          <AppIcon color={colors.muted} name="music" size={16} />
          <AppText tone="muted" variant="caption">
            Os marcadores não aparecem na letra apresentada à banda.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: spacing.md,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  marker: {
    color: colors.violet,
    fontWeight: '700',
  },
  inputFrame: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    height: 280,
    lineHeight: 24,
    padding: spacing.md,
    width: '100%',
    ...(Platform.OS === 'web' ? { maxHeight: 280, minHeight: 280 } : {}),
  },
  inputHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
