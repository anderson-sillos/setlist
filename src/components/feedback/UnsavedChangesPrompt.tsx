import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { spacing } from '@/theme/tokens';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface UnsavedChangesPromptProps {
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
  readonly testID?: string;
  readonly visible: boolean;
}

export function UnsavedChangesPrompt({
  onContinue,
  onDiscard,
  testID = 'unsaved-changes-prompt',
  visible,
}: UnsavedChangesPromptProps) {
  const returnFocusTarget = useRef<HTMLElement | null>(null);
  const [dismissingForDiscard, setDismissingForDiscard] = useState(false);
  const pendingDiscard = useRef(false);

  if (!visible && dismissingForDiscard) {
    setDismissingForDiscard(false);
  }

  const handleDiscard = () => {
    returnFocusTarget.current = null;

    if (Platform.OS === 'ios') {
      // O formulário/rota só pode fechar após o Modal da confirmação sair.
      // Fechar ambos no mesmo commit pode deixar um modal nativo bloqueando
      // os toques, mesmo com visible=false no React.
      pendingDiscard.current = true;
      setDismissingForDiscard(true);
      return;
    }

    onDiscard();
  };

  const handleDismiss = () => {
    if (!pendingDiscard.current) return;
    pendingDiscard.current = false;
    onDiscard();
  };

  useIsomorphicLayoutEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof document === 'undefined') {
      return;
    }

    const activeElement = document.activeElement;
    if (
      !(activeElement instanceof HTMLElement) ||
      activeElement === document.body
    ) {
      returnFocusTarget.current = null;
      return;
    }

    returnFocusTarget.current = activeElement;
    activeElement.blur();
  }, [visible]);

  const handleWebContinue = () => {
    const target = returnFocusTarget.current;
    returnFocusTarget.current = null;
    onContinue();

    if (Platform.OS === 'web' && target && typeof document !== 'undefined') {
      setTimeout(() => {
        if (
          document.contains(target) &&
          !target.closest('[aria-hidden="true"]')
        ) {
          target.focus();
        }
      }, 0);
    }
  };

  // No Web, um Modal oculto mantido montado pode ficar atrás de outro diálogo.
  if (Platform.OS === 'web' && !visible) return null;

  return (
    <OptionSheet
      closeAccessibilityLabel="Continuar editando"
      label="Descartar alterações?"
      onClose={Platform.OS === 'web' ? handleWebContinue : onContinue}
      onDismiss={handleDismiss}
      showCloseButton={false}
      testID={testID}
      visible={visible && !dismissingForDiscard}
    >
      <AppText tone="muted">
        As alterações ainda não foram salvas. Você pode continuar editando ou
        descartá-las.
      </AppText>
      <AppButton
        accessibilityLabel="Continuar editando"
        label="Continuar editando"
        onPress={Platform.OS === 'web' ? handleWebContinue : onContinue}
        style={{ marginTop: spacing.lg }}
        variant="secondary"
      />
      <AppButton
        accessibilityLabel="Descartar alterações"
        label="Descartar alterações"
        onPress={handleDiscard}
        style={{ marginTop: spacing.sm }}
        variant="destructive"
      />
    </OptionSheet>
  );
}
