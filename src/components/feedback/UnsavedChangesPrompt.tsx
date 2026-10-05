import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { spacing } from '@/theme/tokens';

interface UnsavedChangesPromptProps {
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
  readonly visible: boolean;
}

export function UnsavedChangesPrompt({
  onContinue,
  onDiscard,
  visible,
}: UnsavedChangesPromptProps) {
  return (
    <OptionSheet
      closeAccessibilityLabel="Continuar editando"
      label="Descartar alterações?"
      onClose={onContinue}
      showCloseButton={false}
      testID="unsaved-changes-prompt"
      visible={visible}
    >
      <AppText tone="muted">
        As alterações ainda não foram salvas. Você pode continuar editando ou
        descartá-las.
      </AppText>
      <AppButton
        label="Continuar editando"
        onPress={onContinue}
        style={{ marginTop: spacing.lg }}
        variant="secondary"
      />
      <AppButton
        label="Descartar alterações"
        onPress={onDiscard}
        style={{ marginTop: spacing.sm }}
        variant="destructive"
      />
    </OptionSheet>
  );
}
