import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

type StatusPillTone = 'default' | 'ready' | 'warning' | 'danger' | 'info';

interface StatusPillProps extends PropsWithChildren {
  readonly tone?: StatusPillTone;
}

export function StatusPill({ children, tone = 'default' }: StatusPillProps) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'ready' && styles.ready,
        tone === 'warning' && styles.warning,
        tone === 'danger' && styles.danger,
        tone === 'info' && styles.info,
      ]}
    >
      <AppText tone={textTones[tone]} variant="caption">
        {children}
      </AppText>
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
