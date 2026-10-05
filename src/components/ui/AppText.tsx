import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSizes } from '@/theme/tokens';

type TextVariant =
  | 'eyebrow'
  | 'display'
  | 'title'
  | 'detail'
  | 'heading'
  | 'body'
  | 'metadata'
  | 'caption'
  | 'footer'
  | 'version'
  | 'lyric';
type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'onAccent'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

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
    color: colors.text.primary,
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
  display: {
    fontSize: fontSizes.display,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 46,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
  },
  detail: {
    fontSize: fontSizes.detail,
    fontWeight: '700',
    lineHeight: 34,
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
  metadata: {
    fontSize: fontSizes.metadata,
    lineHeight: 20,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  footer: {
    fontSize: fontSizes.footer,
    lineHeight: 18,
  },
  version: {
    fontSize: fontSizes.version,
    lineHeight: 16,
  },
  lyric: {
    fontSize: fontSizes.lyric,
    lineHeight: 38,
  },
});

const tones = StyleSheet.create({
  default: {
    color: colors.text.primary,
  },
  muted: {
    color: colors.text.secondary,
  },
  subtle: {
    color: colors.text.muted,
  },
  inverse: {
    color: colors.text.primary,
  },
  onAccent: {
    color: colors.text.onAccent,
  },
  accent: {
    color: colors.action.primary,
  },
  danger: {
    color: colors.semantic.danger,
  },
  success: {
    color: colors.semantic.success,
  },
  warning: {
    color: colors.semantic.warning,
  },
  info: {
    color: colors.semantic.info,
  },
});
