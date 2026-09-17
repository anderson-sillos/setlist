import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Show } from '@/domain';
import {
  formatShowDuration,
  formatShowListDate,
  showStatusLabels,
} from '@/features/navigation/display';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface ShowListRowProps {
  readonly accessibilityLabel: string;
  readonly durationMs: number | null;
  readonly href: Href;
  readonly show: Show;
}

export function ShowListRow({
  accessibilityLabel,
  durationMs,
  href,
  show,
}: ShowListRowProps) {
  return (
    <View style={styles.rowFrame}>
      <Link href={href} asChild>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.listRow,
            show.status === 'cancelled' && styles.cancelledRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.rowLayout}>
            <View style={styles.rowContent}>
              <View style={styles.rowTitleLine}>
                <AppText style={styles.rowTitle} variant="heading">
                  {show.name}
                </AppText>
                <StatusPill
                  tone={show.status === 'ready' ? 'ready' : 'default'}
                >
                  {showStatusLabels[show.status]}
                </StatusPill>
              </View>
              <View style={styles.rowMetaLine}>
                <AppText numberOfLines={1} style={styles.rowDate} tone="muted">
                  {formatShowListDate(show.startsAt)}
                </AppText>
                <View
                  accessibilityLabel={`Duração ${
                    durationMs === null
                      ? 'não informada'
                      : formatShowDuration(durationMs)
                  }`}
                  style={styles.durationMeta}
                >
                  <AppIcon color={colors.violet} name="duration" size={12} />
                  <AppText style={styles.durationValue} tone="accent">
                    {durationMs === null ? '—' : formatShowDuration(durationMs)}
                  </AppText>
                </View>
              </View>
              <AppText
                numberOfLines={1}
                style={styles.rowVenue}
                variant="caption"
              >
                {show.venue}
              </AppText>
            </View>
            <View style={styles.rowNavigation}>
              <AppIcon color={colors.violet} name="forward" size={20} />
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  listRow: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 82,
    padding: spacing.md,
  },
  cancelledRow: {
    opacity: 0.66,
  },
  rowLayout: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
  },
  rowContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowTitle: {
    flexShrink: 1,
  },
  rowMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  rowDate: {
    flex: 1,
    minWidth: 0,
  },
  rowVenue: {
    minWidth: 0,
  },
  rowNavigation: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 20,
  },
  durationValue: {
    fontVariant: ['tabular-nums'],
  },
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
