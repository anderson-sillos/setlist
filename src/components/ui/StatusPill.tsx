import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

type StatusPillTone = 'default' | 'ready' | 'warning';

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
      ]}
    >
      <AppText variant="caption">{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ready: {
    backgroundColor: colors.cyanSoft,
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
});
