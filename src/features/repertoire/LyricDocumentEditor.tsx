import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { LyricDocument } from '@/domain';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { KeyboardDismissRegion } from '@/components/ui/KeyboardDismissRegion';
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
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: document.isInstrumental === true }}
        accessibilityLabel="Música instrumental"
        onPress={() =>
          onChange({
            ...document,
            ...(document.isInstrumental === true
              ? { isInstrumental: false }
              : { isInstrumental: true }),
          })
        }
        style={({ pressed }) => [
          styles.instrumentalOption,
          pressed && styles.instrumentalOptionPressed,
        ]}
        testID="lyric-instrumental-toggle"
      >
        <View
          style={[
            styles.checkbox,
            document.isInstrumental === true && styles.checkboxChecked,
          ]}
        >
          {document.isInstrumental === true ? (
            <AppIcon color={colors.text.onBrand} name="check" size={13} />
          ) : null}
        </View>
        <View style={styles.instrumentalCopy}>
          <AppText style={styles.instrumentalLabel}>
            Música instrumental
          </AppText>
          <AppText tone="muted" variant="caption">
            Não há letra cantada nesta música.
          </AppText>
        </View>
      </Pressable>

      <KeyboardDismissRegion>
        <View style={styles.sectionHeading}>
          <View style={styles.headingRow}>
            <AppText accessibilityRole="header" variant="heading">
              Letra
            </AppText>
            {draftText.length > 0 ? (
              <Pressable
                accessibilityHint="Remove todo o conteúdo do campo da letra."
                accessibilityLabel="Limpar letra"
                accessibilityRole="button"
                hitSlop={14}
                onPress={() => handleTextChange('')}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.clearButtonPressed,
                ]}
                testID="lyric-clear-button"
              >
                <AppIcon color={colors.action.primary} name="close" size={10} />
              </Pressable>
            ) : null}
          </View>
          <AppText tone="muted">
            Cole ou digite a letra completa abaixo.
          </AppText>
        </View>
      </KeyboardDismissRegion>

      <KeyboardDismissRegion>
        <View style={styles.guide}>
          <AppText style={styles.guideTitle} variant="caption">
            Formato rápido
          </AppText>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              # Refrão
            </AppText>
            <AppText tone="muted" variant="caption">
              cria um novo bloco da música
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              ---
            </AppText>
            <AppText tone="muted" variant="caption">
              mantém uma linha em branco
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              **Texto**
            </AppText>
            <AppText tone="muted" variant="caption">
              destaca a linha em negrito
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              ***
            </AppText>
            <AppText tone="muted" variant="caption">
              insere uma linha de separação
            </AppText>
          </View>
        </View>
      </KeyboardDismissRegion>

      <View style={styles.inputFrame}>
        <TextInput
          accessibilityLabel="Letra completa"
          autoCapitalize="sentences"
          multiline
          onChangeText={handleTextChange}
          placeholder={
            '# Verso\nDigite ou cole a letra completa aqui…\n**Linha em destaque**\n---\n***\n# Refrão'
          }
          placeholderTextColor={colors.text.muted}
          scrollEnabled
          style={styles.input}
          textAlignVertical="top"
          testID="lyric-full-text"
          value={draftText}
        />
        <KeyboardDismissRegion>
          <View style={styles.inputHint}>
            <AppIcon color={colors.text.secondary} name="music" size={16} />
            <AppText tone="muted" variant="caption">
              Os marcadores são removidos na apresentação da letra.
            </AppText>
          </View>
        </KeyboardDismissRegion>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: spacing.md,
  },
  instrumentalOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  instrumentalOptionPressed: {
    opacity: 0.72,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxChecked: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
  instrumentalCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  instrumentalLabel: {
    fontWeight: '600',
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.background.hover,
    borderRadius: radii.pill,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  clearButtonPressed: {
    opacity: 0.72,
  },
  guide: {
    backgroundColor: colors.background.selected,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  guideRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  guideTitle: {
    color: colors.action.primary,
    fontWeight: '700',
  },
  marker: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.action.primary,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputFrame: {
    alignSelf: 'stretch',
    backgroundColor: colors.background.canvas,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text.primary,
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
