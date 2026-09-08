import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getCatalogColumnCount, getLayoutMode } from '@/theme/responsive';
import { colors, layout, radii, spacing } from '@/theme/tokens';

const platformCards = [
  {
    eyebrow: 'Android + iOS',
    title: 'Aplicativos móveis',
    description:
      'A mesma interface atende celulares e tablets, respeitando recortes e áreas seguras.',
  },
  {
    eyebrow: 'Navegador',
    title: 'Web responsiva',
    description:
      'A experiência se adapta ao computador sem manter uma segunda base de código.',
  },
  {
    eyebrow: 'Confiança',
    title: 'Qualidade automatizada',
    description:
      'Formatação, lint, tipos e testes protegem cada incremento antes da integração.',
  },
] as const;

type HomeScreenProps = {
  viewportWidth?: number;
};

export default function HomeScreen({ viewportWidth }: HomeScreenProps) {
  const window = useWindowDimensions();
  const width = viewportWidth ?? window.width;
  const layoutMode = getLayoutMode(width);
  const columns = getCatalogColumnCount(layoutMode);
  const usableWidth = Math.min(
    Math.max(width - spacing.xl * 2, 0),
    layout.contentMaxWidth - spacing.xl * 2,
  );
  const cardWidth =
    (usableWidth - spacing.lg * (columns - 1)) / Math.max(columns, 1);

  return (
    <Screen testID={`catalog-${layoutMode}`}>
      <Card
        style={[styles.hero, layoutMode !== 'phone' && styles.heroWide]}
        tone="dark"
      >
        <View style={styles.heroCopy}>
          <AppText tone="inverse" variant="eyebrow">
            SETLIST · FUNDAÇÃO
          </AppText>
          <AppText
            accessibilityRole="header"
            style={styles.heroTitle}
            tone="inverse"
            variant="title"
          >
            Organize o show. Toque no tempo certo.
          </AppText>
          <AppText style={styles.heroDescription} tone="inverse">
            Catálogo inicial dos elementos visuais compartilhados por Android,
            iOS e web.
          </AppText>
        </View>

        <View style={styles.heroStatus}>
          <View style={styles.statusDot} />
          <View style={styles.statusCopy}>
            <AppText tone="inverse" variant="heading">
              Base ativa
            </AppText>
            <AppText style={styles.statusText} tone="inverse" variant="caption">
              Layout {layoutMode} · {columns}{' '}
              {columns === 1 ? 'coluna' : 'colunas'}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <AppText tone="accent" variant="eyebrow">
            Plataformas
          </AppText>
          <AppText variant="heading">Uma interface, três contextos</AppText>
        </View>
        <AppText tone="muted" variant="caption">
          {Math.round(width)} px
        </AppText>
      </View>

      <View style={styles.grid}>
        {platformCards.map((item, index) => (
          <Card
            key={item.title}
            style={[styles.platformCard, { width: cardWidth }]}
            testID={`platform-card-${index}`}
            tone={index === 1 ? 'accent' : 'default'}
          >
            <AppText tone="accent" variant="eyebrow">
              {item.eyebrow}
            </AppText>
            <AppText style={styles.cardTitle} variant="heading">
              {item.title}
            </AppText>
            <AppText tone="muted">{item.description}</AppText>
          </Card>
        ))}
      </View>

      <View style={[styles.grid, styles.catalogSection]}>
        <Card style={[styles.catalogCard, { width: cardWidth }]}>
          <AppText tone="accent" variant="eyebrow">
            Ações
          </AppText>
          <AppText style={styles.cardTitle} variant="heading">
            Botões acessíveis
          </AppText>
          <View style={styles.actions}>
            <AppButton label="Ação principal" />
            <AppButton label="Ação secundária" variant="secondary" />
          </View>
        </Card>

        <Card style={[styles.catalogCard, { width: cardWidth }]}>
          <AppText tone="accent" variant="eyebrow">
            Cores
          </AppText>
          <AppText style={styles.cardTitle} variant="heading">
            Paleta do projeto
          </AppText>
          <View style={styles.palette}>
            <View
              accessibilityLabel="Violeta"
              style={[styles.swatch, styles.violetSwatch]}
            />
            <View
              accessibilityLabel="Ciano"
              style={[styles.swatch, styles.cyanSwatch]}
            />
            <View
              accessibilityLabel="Azul-marinho"
              style={[styles.swatch, styles.navySwatch]}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xxl,
    padding: spacing.xxl,
  },
  heroWide: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 720,
  },
  heroTitle: {
    marginTop: spacing.md,
  },
  heroDescription: {
    marginTop: spacing.md,
    maxWidth: 620,
    opacity: 0.78,
  },
  heroStatus: {
    alignItems: 'center',
    backgroundColor: colors.navyRaised,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 210,
    padding: spacing.lg,
  },
  statusDot: {
    backgroundColor: colors.cyan,
    borderRadius: radii.pill,
    height: 12,
    width: 12,
  },
  statusCopy: {
    flexShrink: 1,
  },
  statusText: {
    marginTop: spacing.xs,
    opacity: 0.72,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xxxl,
  },
  sectionCopy: {
    gap: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  platformCard: {
    minWidth: 0,
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  catalogSection: {
    marginTop: spacing.lg,
  },
  catalogCard: {
    minWidth: 0,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  palette: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  swatch: {
    borderRadius: radii.md,
    height: 56,
    width: 56,
  },
  violetSwatch: {
    backgroundColor: colors.violet,
  },
  cyanSwatch: {
    backgroundColor: colors.cyan,
  },
  navySwatch: {
    backgroundColor: colors.navy,
  },
});
