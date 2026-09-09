import { Link } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useBand } from '@/data/queries';
import type { EntityId } from '@/domain';
import {
  getBandSectionHref,
  type BandSection,
} from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';

interface BandAreaLayoutProps extends PropsWithChildren {
  readonly activeSection: BandSection;
  readonly bandId: EntityId;
}

const navigationItems: readonly {
  readonly label: string;
  readonly section: BandSection;
}[] = [
  { label: 'Shows', section: 'shows' },
  { label: 'Repertório', section: 'repertoire' },
  { label: 'Banda', section: 'band' },
];

export function BandAreaLayout({
  activeSection,
  bandId,
  children,
}: BandAreaLayoutProps) {
  const bandQuery = useBand(bandId);
  const bandName = bandQuery.data?.name ?? 'Carregando banda…';

  return (
    <Screen testID={`band-area-${activeSection}`}>
      <View style={styles.topBar}>
        <View style={styles.heading}>
          <AppText tone="accent" variant="eyebrow">
            Banda selecionada
          </AppText>
          <AppText accessibilityRole="header" variant="title">
            {bandName}
          </AppText>
        </View>

        <Link href="/" asChild>
          <Pressable
            accessibilityLabel="Voltar para Minhas bandas"
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.switchButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="accent">Trocar banda</AppText>
          </Pressable>
        </Link>
      </View>

      <View accessibilityRole="tablist" style={styles.navigation}>
        {navigationItems.map((item) => {
          const isActive = item.section === activeSection;

          return (
            <Link
              key={item.section}
              href={getBandSectionHref(bandId, item.section)}
              asChild
            >
              <Pressable
                accessibilityLabel={`Ir para ${item.label}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.navigationItem,
                  isActive && styles.navigationItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <AppText tone={isActive ? 'inverse' : 'accent'}>
                  {item.label}
                </AppText>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View style={styles.content}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  heading: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  switchButton: {
    borderColor: colors.violet,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  navigationItem: {
    borderColor: colors.violet,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navigationItemActive: {
    backgroundColor: colors.violet,
  },
  pressed: {
    opacity: 0.72,
  },
  content: {
    marginTop: spacing.xxl,
  },
});
