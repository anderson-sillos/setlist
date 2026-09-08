import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

type CardTone = 'default' | 'accent' | 'dark';

type CardProps = PropsWithChildren<
  ViewProps & {
    tone?: CardTone;
  }
>;

export function Card({
  children,
  style,
  tone = 'default',
  ...props
}: CardProps) {
  return (
    <View {...props} style={[styles.base, tones[tone], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
});

const tones = StyleSheet.create({
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  accent: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violet,
  },
  dark: {
    backgroundColor: colors.navy,
    borderColor: colors.navyRaised,
  },
});
