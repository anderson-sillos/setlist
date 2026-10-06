import { useState } from 'react';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Show } from '@/domain';
import { colors, fontSizes, layout, radii, spacing } from '@/theme/tokens';
import { formatCompactShowListDate } from '@/utils/dateTime';
import { formatShowDuration } from '@/utils/duration';
import { blurWebFocus } from '@/utils/focus';
import {
  showStatusIcons,
  showStatusLabels,
  showStatusTones,
} from './showPresentation';

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
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.rowFrame}>
      <Link href={href} onPress={blurWebFocus} asChild>
        <Pressable
          accessibilityLabel={`${accessibilityLabel}. Status: ${showStatusLabels[show.status]}`}
          accessibilityRole="link"
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={StyleSheet.flatten([
            styles.listRow,
            show.status === 'cancelled' && styles.cancelledRow,
            pressed && styles.pressed,
          ])}
        >
          <View style={styles.rowLayout}>
            <View style={styles.rowPrimaryContent}>
              <View style={styles.rowLeadingIcon}>
                <AppIcon color={colors.text.secondary} name="shows" size={40} />
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowTitleLine}>
                  <AppText
                    numberOfLines={2}
                    style={styles.rowTitle}
                    variant="heading"
                  >
                    {show.name}
                  </AppText>
                  <StatusPill
                    accessible={false}
                    accessibilityLabel={`Status: ${showStatusLabels[show.status]}`}
                    icon={showStatusIcons[show.status]}
                    tone={showStatusTones[show.status]}
                  />
                </View>
                <View style={styles.rowMetaLine}>
                  <AppText
                    numberOfLines={1}
                    style={styles.rowVenue}
                    variant="metadata"
                  >
                    {show.venue}
                  </AppText>
                  <View
                    accessibilityLabel={`Duração ${
                      durationMs === null
                        ? 'não informada'
                        : formatShowDuration(durationMs)
                    }`}
                    style={styles.durationMeta}
                  >
                    <AppIcon
                      color={colors.text.secondary}
                      name="duration"
                      size={12}
                    />
                    <AppText style={styles.durationValue} tone="accent">
                      {durationMs === null
                        ? '—'
                        : formatShowDuration(durationMs)}
                    </AppText>
                  </View>
                </View>
                <AppText style={styles.rowDate} tone="muted">
                  {formatCompactShowListDate(show.startsAt)}
                </AppText>
              </View>
            </View>
            <View style={styles.rowNavigation}>
              <AppIcon color={colors.text.secondary} name="forward" size={20} />
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
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 84,
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
  rowPrimaryContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  rowLeadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 48,
  },
  rowContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
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
    fontSize: fontSizes.body,
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
