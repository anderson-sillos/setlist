import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import type { Song } from '@/domain';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

export interface RepertoireAction {
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
  readonly icon: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
}

interface MenuContent {
  readonly actions: readonly RepertoireAction[];
  readonly feedback?: ReactNode;
  readonly title: string;
}

/** One menu per screen; iOS actions wait for the native menu to dismiss. */
export function useRepertoireActionMenu() {
  const [target, setTarget] = useState<'collections' | Song | null>(null);
  const [visible, setVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const dismissing = useRef(false);
  const onDismiss = useCallback(() => {
    dismissing.current = false;
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  useEffect(() => {
    if (!visible && Platform.OS !== 'ios') onDismiss();
  }, [onDismiss, visible]);

  return {
    target,
    open: (nextTarget: 'collections' | Song) => {
      if (dismissing.current) return;
      pendingAction.current = null;
      setTarget(nextTarget);
      setVisible(true);
    },
    menuProps: {
      visible,
      onDismiss,
      onClose: () => {
        if (dismissing.current) return;
        pendingAction.current = null;
        dismissing.current = true;
        setVisible(false);
      },
      onSelect: (action: RepertoireAction) => {
        if (action.disabled || dismissing.current) return;
        blurWebFocus();
        pendingAction.current = action.onPress;
        dismissing.current = true;
        setVisible(false);
      },
    },
  };
}

interface ActionMenuProps extends MenuContent {
  readonly onClose: () => void;
  readonly onDismiss: () => void;
  readonly onSelect: (action: RepertoireAction) => void;
  readonly visible: boolean;
}

export function RepertoireActionMenu({
  actions,
  feedback,
  onClose,
  onDismiss,
  onSelect,
  title,
  visible,
}: ActionMenuProps) {
  // Web needs a fresh modal when switching between an action menu and a form.
  if (Platform.OS === 'web' && !visible) return null;

  return (
    <OptionSheet
      closeAccessibilityLabel="Fechar menu de ações do repertório"
      label={title}
      onClose={onClose}
      onDismiss={onDismiss}
      sheetStyle={styles.sheet}
      testID="repertoire-action-menu"
      visible={visible}
    >
      <ScrollView contentContainerStyle={styles.actions} style={styles.scroll}>
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.accessibilityLabel ?? action.label}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(action.disabled) }}
            disabled={action.disabled}
            key={action.label}
            onPress={() => onSelect(action)}
            style={({ pressed }) => [
              styles.action,
              action.disabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name={action.icon} size={20} />
            <AppText style={styles.label}>{action.label}</AppText>
          </Pressable>
        ))}
        {feedback ? <View style={styles.feedback}>{feedback}</View> : null}
      </ScrollView>
    </OptionSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: spacing.sm, maxHeight: '80%' },
  scroll: { flexGrow: 0 },
  actions: { gap: spacing.xs },
  action: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  label: { flex: 1 },
  feedback: { padding: spacing.sm },
  disabled: { opacity: 0.45 },
  pressed: { backgroundColor: colors.background.pressed },
});
