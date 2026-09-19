import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { EntityId } from '@/domain';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { navigationItems } from '@/features/navigation/navigationItems';
import type { BandSection } from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface NavigationPanelProps {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onNavigate?: () => void;
  readonly onLogout?: () => void | Promise<void>;
}

function SidebarNavigationLink({
  active,
  href,
  icon,
  label,
  onNavigate,
}: {
  readonly active: boolean;
  readonly href: Href;
  readonly icon: AppIconName;
  readonly label: string;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link href={href} replace asChild>
      <Pressable
        accessibilityLabel={`Ir para ${label}`}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={onNavigate}
        style={({ pressed }) => [
          styles.sectionItem,
          active && styles.sectionItemActive,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.sectionContent}>
          <AppIcon color={colors.surface} name={icon} size={20} />
          <AppText tone="inverse">{label}</AppText>
        </View>
      </Pressable>
    </Link>
  );
}

function DisabledGeneralItem({ label }: { readonly label: string }) {
  return (
    <View
      accessibilityLabel={`${label}, disponível após a autenticação`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessible
      style={styles.generalItem}
    >
      <AppText style={styles.muted}>{label}</AppText>
    </View>
  );
}

function GeneralNavigationAction({
  icon,
  label,
  onPress,
}: {
  readonly icon: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.sectionItem, pressed && styles.pressed]}
    >
      <View style={styles.sectionContent}>
        <AppIcon color={colors.surface} name={icon} size={20} />
        <AppText tone="inverse">{label}</AppText>
      </View>
    </Pressable>
  );
}

function getAccountSummary(session: Session | null): {
  readonly name: string;
  readonly email: string;
} {
  if (!session) {
    return {
      email: 'Conta de demonstração',
      name: 'Ana Martins',
    };
  }

  const metadata = session.user.user_metadata;
  const metadataName = ['full_name', 'name', 'preferred_username']
    .map((key) => metadata[key])
    .find(
      (value): value is string =>
        typeof value === 'string' && Boolean(value.trim()),
    );

  return {
    email: session.user.email ?? 'Conta autenticada',
    name: metadataName ?? session.user.email ?? 'Usuário autenticado',
  };
}

export function NavigationPanel({
  activeSection,
  bandId,
  bandName,
  getSectionHref,
  onNavigate,
  onLogout,
}: NavigationPanelProps) {
  const { session } = useAuthSession();
  const account = getAccountSummary(session);

  return (
    <ScrollView contentContainerStyle={styles.panel}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <AppIcon color={colors.surface} name="music" />
        </View>
        <View>
          <AppText tone="inverse" variant="heading">
            Setlist
          </AppText>
          <AppText style={styles.muted} variant="caption">
            A banda no mesmo compasso
          </AppText>
        </View>
      </View>

      <View style={styles.accountSummary}>
        <AppText tone="inverse">{account.name}</AppText>
        <AppText style={styles.muted} variant="caption">
          {account.email}
        </AppText>
      </View>

      <SidebarNavigationLink
        active={!bandId}
        href="/"
        icon="bands"
        label="Minhas bandas"
        onNavigate={onNavigate}
      />

      {bandId ? (
        <View style={styles.bandNavigation}>
          <AppText style={styles.muted} variant="eyebrow">
            {bandName ?? 'Banda selecionada'}
          </AppText>
          <View accessibilityRole="tablist" style={styles.sidebarTabs}>
            {navigationItems.map((item) => (
              <SidebarNavigationLink
                active={activeSection === item.section}
                href={getSectionHref(item.section)}
                icon={item.icon}
                key={item.section}
                label={item.label}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.generalNavigation}>
        {/* Remover quando a validação do player YouTube (atividade 3.2) terminar. */}
        <SidebarNavigationLink
          active={false}
          href="/youtube-prototype"
          icon="music"
          label="Player YouTube (protótipo)"
          onNavigate={onNavigate}
        />
        <DisabledGeneralItem label="Perfil e conta" />
        <DisabledGeneralItem label="Termos e privacidade" />
        <DisabledGeneralItem label="Sobre o Setlist" />
      </View>

      <View style={styles.footer}>
        <GeneralNavigationAction
          icon="logout"
          label="Sair"
          onPress={() => {
            onNavigate?.();
            void onLogout?.();
          }}
        />
        <AppText style={styles.muted} variant="caption">
          Google ativo · Apple em breve.
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  brandMark: {
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  muted: {
    color: '#aab3ce',
  },
  accountSummary: {
    backgroundColor: colors.navyRaised,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  bandNavigation: {
    gap: spacing.sm,
  },
  sidebarTabs: {
    gap: spacing.xs,
  },
  sectionItem: {
    borderRadius: radii.md,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionItemActive: {
    backgroundColor: colors.navyRaised,
  },
  sectionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  generalNavigation: {
    borderTopColor: colors.navyRaised,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  generalItem: {
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    gap: spacing.xs,
    marginTop: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});
