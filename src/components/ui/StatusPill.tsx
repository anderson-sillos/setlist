import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export type StatusPillTone =
  'default' | 'ready' | 'warning' | 'danger' | 'info';

interface StatusPillProps extends PropsWithChildren {
  readonly accessible?: boolean;
  readonly accessibilityLabel?: string;
  readonly icon?: AppIconName;
  readonly tone?: StatusPillTone;
}

export function StatusPill({
  accessible,
  accessibilityLabel,
  children,
  icon,
  tone = 'default',
}: StatusPillProps) {
  const exposesIconToAccessibility = accessible ?? Boolean(icon);

  return (
    <View
      accessible={exposesIconToAccessibility}
      accessibilityLabel={
        exposesIconToAccessibility ? accessibilityLabel : undefined
      }
      accessibilityRole={
        icon && exposesIconToAccessibility ? 'image' : undefined
      }
      style={[
        styles.pill,
        icon && styles.iconPill,
        tone === 'ready' && styles.ready,
        tone === 'warning' && styles.warning,
        tone === 'danger' && styles.danger,
        tone === 'info' && styles.info,
      ]}
    >
      {icon ? (
        <AppIcon color={iconTones[tone]} name={icon} size={16} />
      ) : (
        <AppText tone={textTones[tone]} variant="caption">
          {children}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.semantic.neutralSurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconPill: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 24,
  },
  ready: {
    backgroundColor: colors.semantic.successSurface,
  },
  warning: {
    backgroundColor: colors.semantic.warningSurface,
  },
  danger: {
    backgroundColor: colors.semantic.dangerSurface,
  },
  info: {
    backgroundColor: colors.semantic.infoSurface,
  },
});

const textTones: Record<
  StatusPillTone,
  'muted' | 'success' | 'warning' | 'danger' | 'info'
> = {
  default: 'muted',
  ready: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
};

const iconTones: Record<StatusPillTone, string> = {
  default: colors.text.secondary,
  ready: colors.semantic.success,
  warning: colors.semantic.warning,
  danger: colors.semantic.danger,
  info: colors.semantic.info,
};
