import { useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { getAppReleaseInfo } from '@/config/appRelease';
import { legalUrls } from '@/features/legal/legalUrls';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

const repositoryUrl = 'https://github.com/anderson-sillos/setlist';

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.informationRow}>
      <AppText style={styles.informationLabel} tone="muted">
        {label}
      </AppText>
      <AppText selectable style={styles.informationValue}>
        {value}
      </AppText>
    </View>
  );
}

function AboutLink({ label, onPress }: { label: string; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={() => {
        blurWebFocus();
        onPress();
      }}
      style={({ pressed }) => [
        styles.link,
        focused && styles.linkFocused,
        pressed && styles.linkPressed,
      ]}
    >
      <AppText style={styles.linkLabel}>{label}</AppText>
      <AppIcon name="externalLink" color={colors.text.secondary} size={16} />
    </Pressable>
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
      scrollable={false}
      testID="about-screen"
      title="Sobre o Setlist"
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        overScrollMode="never"
        testID="about-scroll-area"
      >
        <View style={styles.content} testID="about-content">
          <Card style={styles.card}>
            <View style={styles.identity}>
              <AppLogo size={40} />
              <View style={styles.identityCopy}>
                <AppText accessibilityRole="header" style={styles.appName}>
                  Setlist
                </AppText>
                <AppText style={styles.tagline} tone="muted">
                  A banda no mesmo compasso
                </AppText>
              </View>
            </View>
            <AppText style={styles.description}>
              Organize o repertório da sua banda, prepare shows e setlists e
              mantenha as letras à mão. Compartilhe a preparação com os outros
              integrantes em um só lugar.
            </AppText>
          </Card>

          <Card style={styles.card}>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>
              Informações da versão
            </AppText>
            <View style={styles.informationRows}>
              <InformationRow
                label={
                  Platform.OS === 'web' || !release.installedVersion
                    ? 'Versão do código'
                    : 'Versão instalada'
                }
                value={release.version}
              />
              {release.installedVersion &&
              release.codeVersion !== release.installedVersion ? (
                <InformationRow
                  label="Código em execução"
                  value={release.codeVersion}
                />
              ) : null}
              {Platform.OS !== 'web' ? (
                <InformationRow
                  label="Build"
                  value={release.build ?? 'Não disponível'}
                />
              ) : null}
              <InformationRow label="Plataforma" value={release.platform} />
              <InformationRow label="Ambiente" value={release.environment} />
              {release.tag ? (
                <InformationRow label="Release" value={release.tag} />
              ) : null}
              {release.commit ? (
                <InformationRow
                  label="Commit"
                  value={release.commit.slice(0, 7)}
                />
              ) : null}
            </View>
          </Card>

          <Card style={styles.card}>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>
              Links e código-fonte
            </AppText>
            <View>
              <AboutLink
                label="Termos de uso"
                onPress={() => void openLink(legalUrls.terms)}
              />
              <AboutLink
                label="Política de privacidade"
                onPress={() => void openLink(legalUrls.privacy)}
              />
              <AboutLink
                label="Notas das versões"
                onPress={() => void openLink(`${repositoryUrl}/releases`)}
              />
              <AboutLink
                label="Código-fonte no GitHub"
                onPress={() => void openLink(repositoryUrl)}
              />
            </View>
            <AppText style={styles.license} tone="muted">
              Código disponibilizado sob a licença AGPL-3.0-only.
            </AppText>
            {linkError ? (
              <AppText accessibilityRole="alert" style={styles.description}>
                {linkError}
              </AppText>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </AppNavigationShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: spacing.md },
  content: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 600,
    width: '100%',
  },
  card: { gap: spacing.sm, padding: spacing.md },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  identityCopy: { flex: 1, gap: 2, minWidth: 0 },
  appName: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  tagline: { fontSize: 12, lineHeight: 18 },
  description: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  informationRows: { gap: spacing.xs },
  informationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  informationLabel: { flexShrink: 1, fontSize: 13, lineHeight: 20 },
  informationValue: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  link: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  linkLabel: { flexShrink: 1, fontSize: 14, lineHeight: 20 },
  linkFocused: { borderColor: colors.border.focus },
  linkPressed: { backgroundColor: colors.background.pressed },
  license: { fontSize: 12, lineHeight: 18 },
});
