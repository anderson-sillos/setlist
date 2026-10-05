import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { navigationItems } from '@/features/navigation/navigationItems';
import type { BandSection } from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';

interface BottomNavigationProps {
  readonly activeSection: BandSection;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onStagePress: () => void;
}

export function BottomNavigation({
  activeSection,
  getSectionHref,
  onStagePress,
}: BottomNavigationProps) {
  return (
    <View
      accessibilityRole="tablist"
      style={styles.navigation}
      testID="bottom-navigation"
    >
      {navigationItems.map((item) => {
        const active = activeSection === item.section;
        const stage = item.section === 'stage';
        const content = (
          <Pressable
            key={item.section}
            accessibilityLabel={
              stage ? 'Palco, em breve' : `Ir para ${item.label}`
            }
            accessibilityRole={stage ? 'button' : 'tab'}
            accessibilityState={stage ? undefined : { selected: active }}
            onPress={stage ? onStagePress : undefined}
            style={StyleSheet.flatten([
              styles.item,
              active && styles.itemActive,
            ])}
          >
            <View
              style={styles.content}
              testID="bottom-navigation-item-content"
            >
              <AppIcon
                color={active ? colors.action.primary : colors.text.secondary}
                name={item.icon}
                size={22}
                strokeWidth={active ? 2.5 : 2}
              />
              <AppText
                numberOfLines={1}
                style={styles.label}
                tone={active ? 'accent' : 'muted'}
                variant="caption"
              >
                {item.label}
              </AppText>
            </View>
          </Pressable>
        );

        return stage ? (
          content
        ) : (
          <Link
            href={getSectionHref(item.section)}
            key={item.section}
            replace
            asChild
            disabled={active}
          >
            {content}
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    alignItems: 'center',
    backgroundColor: colors.background.canvas,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    minHeight: 60,
    paddingVertical: spacing.xs,
  },
  item: {
    alignItems: 'center',
    flexShrink: 1,
    height: 56,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: 72,
  },
  content: {
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    width: '100%',
  },
  itemActive: {
    backgroundColor: colors.background.selected,
    borderRadius: radii.sm,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
});
