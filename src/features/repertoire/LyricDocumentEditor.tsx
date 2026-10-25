import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { LyricDocument } from '@/domain';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { KeyboardDismissRegion } from '@/components/ui/KeyboardDismissRegion';
import { colors, layout, radii, spacing } from '@/theme/tokens';
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
  const [guideVisible, setGuideVisible] = useState(false);
  const [helpFocused, setHelpFocused] = useState(false);
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

      <View style={styles.headingRow}>
        <View style={styles.headingLabel}>
          <KeyboardDismissRegion>
            <AppText accessibilityRole="header" variant="heading">
              Letra
            </AppText>
          </KeyboardDismissRegion>
          <Pressable
            accessibilityLabel="Ajuda de formatação"
            accessibilityRole="button"
            accessibilityState={{ expanded: guideVisible }}
            onBlur={() => setHelpFocused(false)}
            onFocus={() => setHelpFocused(true)}
            onPress={() => setGuideVisible((visible) => !visible)}
            // Keep the textarea focus and cursor when using the help button.
            onPointerDown={
              Platform.OS === 'web'
                ? (event) => event.preventDefault()
                : undefined
            }
            style={({ pressed }) => [
              styles.helpButton,
              (guideVisible || pressed) && styles.helpButtonActive,
              helpFocused && styles.helpButtonFocused,
            ]}
          >
            <AppIcon
              color={
                guideVisible ? colors.action.primary : colors.text.secondary
              }
              name="info"
              size={18}
            />
          </Pressable>
        </View>
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

      {guideVisible ? (
        <View style={styles.guide}>
          <AppText style={styles.guideTitle} variant="caption">
            Formato rápido
          </AppText>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              # Refrão
            </AppText>
            <AppText
              style={styles.guideDescription}
              tone="muted"
              variant="caption"
            >
              cria um novo bloco da música
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              ---
            </AppText>
            <AppText
              style={styles.guideDescription}
              tone="muted"
              variant="caption"
            >
              mantém uma linha em branco
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              **Texto**
            </AppText>
            <AppText
              style={styles.guideDescription}
              tone="muted"
              variant="caption"
            >
              destaca a linha em negrito
            </AppText>
          </View>
          <View style={styles.guideRow}>
            <AppText style={styles.marker} variant="caption">
              ***
            </AppText>
            <AppText
              style={styles.guideDescription}
              tone="muted"
              variant="caption"
            >
              insere uma linha de separação
            </AppText>
          </View>
          <AppText tone="muted" variant="caption">
            Os marcadores são removidos na apresentação da letra.
          </AppText>
        </View>
      ) : null}

      <TextInput
        accessibilityLabel="Letra completa"
        autoCapitalize="sentences"
        multiline
        onChangeText={handleTextChange}
        placeholder="Digite ou cole a letra completa aqui"
        placeholderTextColor={colors.text.muted}
        scrollEnabled
        style={styles.input}
        textAlignVertical="top"
        testID="lyric-full-text"
        value={draftText}
      />
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
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  helpButton: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  helpButtonActive: {
    backgroundColor: colors.background.hover,
  },
  helpButtonFocused: {
    borderColor: colors.border.focus,
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
    backgroundColor: colors.background.canvas,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  guideRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  guideDescription: {
    flex: 1,
  },
  guideTitle: {
    fontWeight: '600',
  },
  marker: {
    fontWeight: '600',
    width: 80,
  },
  input: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 16,
    height: 420,
    lineHeight: 24,
    padding: spacing.md,
    width: '100%',
    ...(Platform.OS === 'web' ? { maxHeight: 420, minHeight: 420 } : {}),
  },
});
