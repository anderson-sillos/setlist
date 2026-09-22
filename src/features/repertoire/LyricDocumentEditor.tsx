import * as ExpoCrypto from 'expo-crypto';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { LyricDocument } from '@/domain';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import {
  addLyricBlock,
  addLyricLine,
  moveLyricBlock,
  moveLyricLine,
  removeLyricBlock,
  removeLyricLine,
  renameLyricBlock,
  updateLyricLine,
} from './lyricEditor';

interface LyricDocumentEditorProps {
  readonly document: LyricDocument;
  readonly onChange: (document: LyricDocument) => void;
}

export function LyricDocumentEditor({
  document,
  onChange,
}: LyricDocumentEditorProps) {
  return (
    <View style={styles.editor} testID="lyric-document-editor">
      <View style={styles.sectionHeading}>
        <AppText accessibilityRole="header" variant="heading">
          Letra
        </AppText>
        <AppText tone="muted">
          Organize o texto em blocos e linhas. A ordem e a identidade de cada
          linha são preservadas ao salvar.
        </AppText>
      </View>

      {document.blocks.length === 0 ? (
        <AppText tone="muted">Nenhum bloco adicionado ainda.</AppText>
      ) : null}

      {document.blocks.map((block, blockIndex) => (
        <View
          key={block.id}
          style={styles.block}
          testID={`lyric-block-${block.id}`}
        >
          <View style={styles.blockHeader}>
            <AppText variant="heading">
              {block.name || `Bloco ${blockIndex + 1}`}
            </AppText>
            <View style={styles.actionGroup}>
              <EditorIconButton
                accessibilityLabel={`Mover bloco ${blockIndex + 1} para cima`}
                disabled={blockIndex === 0}
                icon="moveUp"
                onPress={() =>
                  onChange(moveLyricBlock(document, block.id, 'up'))
                }
              />
              <EditorIconButton
                accessibilityLabel={`Mover bloco ${blockIndex + 1} para baixo`}
                disabled={blockIndex === document.blocks.length - 1}
                icon="moveDown"
                onPress={() =>
                  onChange(moveLyricBlock(document, block.id, 'down'))
                }
              />
              <EditorIconButton
                accessibilityLabel={`Excluir bloco ${blockIndex + 1}`}
                icon="remove"
                onPress={() => onChange(removeLyricBlock(document, block.id))}
              />
            </View>
          </View>

          <TextInput
            accessibilityLabel={`Nome do bloco ${blockIndex + 1} (opcional)`}
            autoCapitalize="sentences"
            onChangeText={(name) =>
              onChange(renameLyricBlock(document, block.id, name))
            }
            placeholder="Ex.: Verso, Refrão"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={block.name ?? ''}
          />

          {block.lines.map((line, lineIndex) => (
            <View key={line.id} style={styles.line}>
              <TextInput
                accessibilityLabel={`Linha ${lineIndex + 1} do bloco ${blockIndex + 1}`}
                autoCapitalize="sentences"
                onChangeText={(text) =>
                  onChange(updateLyricLine(document, block.id, line.id, text))
                }
                placeholder="Digite uma linha da letra"
                placeholderTextColor={colors.muted}
                style={styles.input}
                testID={`lyric-line-${line.id}`}
                value={line.text}
              />
              <View style={styles.actionGroup}>
                <EditorIconButton
                  accessibilityLabel={`Mover linha ${lineIndex + 1} do bloco ${blockIndex + 1} para cima`}
                  disabled={lineIndex === 0}
                  icon="moveUp"
                  onPress={() =>
                    onChange(moveLyricLine(document, block.id, line.id, 'up'))
                  }
                />
                <EditorIconButton
                  accessibilityLabel={`Mover linha ${lineIndex + 1} do bloco ${blockIndex + 1} para baixo`}
                  disabled={lineIndex === block.lines.length - 1}
                  icon="moveDown"
                  onPress={() =>
                    onChange(moveLyricLine(document, block.id, line.id, 'down'))
                  }
                />
                <EditorIconButton
                  accessibilityLabel={`Excluir linha ${lineIndex + 1} do bloco ${blockIndex + 1}`}
                  icon="remove"
                  onPress={() =>
                    onChange(removeLyricLine(document, block.id, line.id))
                  }
                />
              </View>
            </View>
          ))}

          <AppButton
            accessibilityLabel={`Adicionar linha ao bloco ${blockIndex + 1}`}
            icon="add"
            label="Adicionar linha"
            onPress={() =>
              onChange(
                addLyricLine(document, block.id, ExpoCrypto.randomUUID()),
              )
            }
            style={styles.addButton}
            variant="secondary"
          />
        </View>
      ))}

      <AppButton
        accessibilityLabel="Adicionar bloco à letra"
        icon="add"
        label="Adicionar bloco"
        onPress={() =>
          onChange(addLyricBlock(document, ExpoCrypto.randomUUID()))
        }
        variant="secondary"
      />
    </View>
  );
}

interface EditorIconButtonProps {
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly icon: 'moveDown' | 'moveUp' | 'remove';
  readonly onPress: () => void;
}

function EditorIconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
}: EditorIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconAction,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        color={disabled ? colors.muted : colors.violet}
        name={icon}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: spacing.md,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  block: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    minWidth: 160,
    paddingHorizontal: spacing.md,
  },
  actionGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconAction: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
