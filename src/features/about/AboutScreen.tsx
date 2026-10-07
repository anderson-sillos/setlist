import { useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { getAppReleaseInfo } from '@/config/appRelease';
import { legalUrls } from '@/features/legal/legalUrls';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { spacing } from '@/theme/tokens';

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.informationRow}>
      <AppText tone="muted">{label}</AppText>
      <AppText selectable style={styles.informationValue}>
        {value}
      </AppText>
    </View>
  );
}

export function AboutScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const release = getAppReleaseInfo();
  const [linkError, setLinkError] = useState<string | null>(null);
  const backHref =
    typeof returnTo === 'string' &&
    /^\/bands\/[^/]+\/(shows|repertoire|band)$/.test(returnTo)
      ? (returnTo as Href)
      : '/';

  const openLink = async (url: string) => {
    setLinkError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('Não foi possível abrir o link. Tente novamente.');
    }
  };

  return (
    <AppNavigationShell
      backHref={backHref}
      currentRoute="/about"
      screenKind="detail"
      testID="about-screen"
      title="Sobre o Setlist"
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.identity}>
            <AppLogo size={64} />
            <View style={styles.identityCopy}>
              <AppText accessibilityRole="header" variant="title">
                Setlist
              </AppText>
              <AppText tone="muted">A banda no mesmo compasso</AppText>
            </View>
          </View>
          <AppText>
            Organize o repertório da sua banda, prepare shows e setlists e
            mantenha as letras à mão. Compartilhe a preparação com os outros
            integrantes em um só lugar.
          </AppText>
        </Card>

        <Card style={styles.card}>
          <AppText accessibilityRole="header" variant="heading">
            Informações da versão
          </AppText>
          <InformationRow label="Versão" value={release.version} />
          {Platform.OS !== 'web' ? (
            <InformationRow
              label="Build"
              value={release.build ?? 'Não informado'}
            />
          ) : null}
          <InformationRow label="Plataforma" value={release.platform} />
          <InformationRow label="Ambiente" value={release.environment} />
          {release.tag ? (
            <InformationRow label="Release" value={release.tag} />
          ) : null}
          {release.commit ? (
            <InformationRow label="Código" value={release.commit.slice(0, 7)} />
          ) : null}
        </Card>

        <Card style={styles.card}>
          <AppText accessibilityRole="header" variant="heading">
            Links e informações legais
          </AppText>
          <AppButton
            icon="externalLink"
            label="Termos de uso"
            onPress={() => void openLink(legalUrls.terms)}
            variant="secondary"
          />
          <AppButton
            icon="externalLink"
            label="Política de privacidade"
            onPress={() => void openLink(legalUrls.privacy)}
            variant="secondary"
          />
          <AppButton
            icon="externalLink"
            label="Notas das versões"
            onPress={() =>
              void openLink(
                'https://github.com/anderson-sillos/setlist/releases',
              )
            }
            variant="secondary"
          />
          <AppText tone="muted" variant="caption">
            Código disponibilizado sob a licença AGPL-3.0-only.
          </AppText>
          {linkError ? (
            <AppText accessibilityRole="alert">{linkError}</AppText>
          ) : null}
        </Card>
      </View>
    </AppNavigationShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  card: { gap: spacing.md },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  identityCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  informationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  informationValue: { flexShrink: 1, textAlign: 'right' },
});
