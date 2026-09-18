import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { navigationItems } from '@/features/navigation/navigationItems';
import type { BandSection } from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface BottomNavigationProps {
  readonly activeSection: BandSection;
  readonly getSectionHref: (section: BandSection) => Href;
}

export function BottomNavigation({
  activeSection,
  getSectionHref,
}: BottomNavigationProps) {
  return (
    <View
      accessibilityRole="tablist"
      style={styles.navigation}
      testID="bottom-navigation"
    >
      {navigationItems.map((item) => {
        const active = activeSection === item.section;

        return (
          <Link
            href={getSectionHref(item.section)}
            key={item.section}
            replace
            asChild
            disabled={active}
          >
            <Pressable
              accessibilityLabel={`Ir para ${item.label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={styles.content}
                testID="bottom-navigation-item-content"
              >
                <AppIcon
                  color={active ? colors.violet : colors.muted}
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
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    minHeight: 52,
    paddingVertical: 2,
  },
  item: {
    alignItems: 'center',
    flexShrink: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: 72,
  },
  content: {
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
    width: '100%',
  },
  itemActive: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.sm,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
