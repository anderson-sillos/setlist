import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AppIconName } from '@/components/ui/AppIcon';
import {
  MenuButton,
  OptionSheet,
} from '@/components/ui/list-controls/OptionSheet';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

interface FilterMenuProps {
  readonly active?: boolean;
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onClear?: () => void;
  readonly summary?: string;
}

export function FilterMenu({
  active = false,
  accessibilityLabel,
  children,
  icon,
  label,
  onClear,
  summary,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <MenuButton
        active={active}
        accessibilityLabel={accessibilityLabel}
        icon={icon}
        label={`${label}${summary ? `: ${summary}` : ''}`}
        onPress={() => setOpen(true)}
      />

      <OptionSheet
        closeAccessibilityLabel="Fechar filtros"
        label={label}
        onClose={close}
        visible={open}
      >
        <View style={styles.content}>{children}</View>
        <View style={styles.actions}>
          {onClear ? (
            <Pressable
              accessibilityLabel="Limpar filtros"
              accessibilityRole="button"
              onPress={() => {
                blurWebFocus();
                onClear();
                close();
              }}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText tone="accent">Limpar</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel="Aplicar filtros"
            accessibilityRole="button"
            onPress={() => {
              blurWebFocus();
              close();
            }}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="inverse">Concluir</AppText>
          </Pressable>
        </View>
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  actions: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  clearButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    opacity: 0.72,
  },
});
