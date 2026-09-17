import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import {
  MenuButton,
  OptionSheet,
} from '@/components/ui/list-controls/OptionSheet';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface FilterMenuProps {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly label: string;
  readonly summary?: string;
}

export function FilterMenu({
  accessibilityLabel,
  children,
  label,
  summary,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <MenuButton
        accessibilityLabel={accessibilityLabel}
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
        <Pressable
          accessibilityLabel="Aplicar filtros"
          accessibilityRole="button"
          onPress={close}
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="inverse">Concluir</AppText>
        </Pressable>
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  applyButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    opacity: 0.72,
  },
});
