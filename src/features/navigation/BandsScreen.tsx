import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useUserBands } from '@/data/queries';
import type { BandRole } from '@/domain';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { getBandSectionHref } from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';

const roleLabels: Record<BandRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  member: 'Member',
};

export default function BandsScreen() {
  const bandsQuery = useUserBands();

  return (
    <AppNavigationShell
      currentRoute="/"
      testID="bands-screen"
      title="Minhas bandas"
    >
      <Card style={styles.hero} tone="dark">
        <AppText tone="inverse" variant="eyebrow">
          SETLIST · DEMONSTRAÇÃO
        </AppText>
        <AppText
          accessibilityRole="header"
          style={styles.heroTitle}
          tone="inverse"
          variant="title"
        >
          Minhas bandas
        </AppText>
        <AppText style={styles.heroDescription} tone="inverse">
          Escolha uma banda para consultar seus shows, repertório e integrantes.
        </AppText>
      </Card>

      <View style={styles.sectionHeader}>
        <AppText variant="heading">Bandas disponíveis</AppText>
        <AppText tone="muted" variant="caption">
          Conteúdo local de demonstração
        </AppText>
      </View>

      {bandsQuery.isPending ? (
        <AppText accessibilityLiveRegion="polite">Carregando bandas…</AppText>
      ) : null}

      {bandsQuery.isError ? (
        <AppText accessibilityRole="alert">
          Não foi possível carregar as bandas.
        </AppText>
      ) : null}

      <View style={styles.bandGrid}>
        {bandsQuery.data?.map(({ band, membership }) => (
          <Link
            key={band.id}
            href={getBandSectionHref(band.id, 'shows')}
            asChild
          >
            <Pressable
              accessibilityLabel={`Abrir ${band.name}`}
              accessibilityRole="link"
              style={({ pressed }) => [
                styles.bandCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bandCopy}>
                <AppText tone="accent" variant="eyebrow">
                  {roleLabels[membership.role]}
                </AppText>
                <AppText variant="heading">{band.name}</AppText>
                <AppText tone="muted">
                  Shows, repertório e informações da banda
                </AppText>
              </View>
              <AppText style={styles.openLabel} tone="accent">
                Abrir →
              </AppText>
            </Pressable>
          </Link>
        ))}
      </View>
    </AppNavigationShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  heroDescription: {
    maxWidth: 640,
    opacity: 0.78,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xxxl,
  },
  bandGrid: {
    gap: spacing.lg,
  },
  bandCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  bandCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  openLabel: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
