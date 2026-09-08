import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSizes } from '@/theme/tokens';

type TextVariant = 'eyebrow' | 'title' | 'heading' | 'body' | 'caption';
type TextTone = 'default' | 'muted' | 'inverse' | 'accent';

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    tone?: TextTone;
  }
>;

export function AppText({
  children,
  style,
  tone = 'default',
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[styles.base, variants[variant], tones[tone], style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
  },
});

const variants = StyleSheet.create({
  eyebrow: {
    fontSize: fontSizes.caption,
    fontWeight: '800',
    letterSpacing: 1.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  heading: {
    fontSize: fontSizes.heading,
    fontWeight: '700',
    lineHeight: 27,
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: 24,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
});

const tones = StyleSheet.create({
  default: {
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
  },
  inverse: {
    color: colors.surface,
  },
  accent: {
    color: colors.violetDark,
  },
});
