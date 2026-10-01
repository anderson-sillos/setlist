import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppVersionLabel } from '@/components/ui/AppVersionLabel';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { EntityId } from '@/domain';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { useCurrentProfile } from '@/features/account/useCurrentProfile';
import { navigationItems } from '@/features/navigation/navigationItems';
import type { BandSection } from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';

const menuItemHeight = 28;

interface NavigationPanelProps {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onNavigate?: () => void;
  readonly onLogout?: () => void | Promise<void>;
  readonly onStagePress: () => void;
}

function NavigationItemContent({
  icon,
  label,
}: {
  readonly icon: AppIconName;
  readonly label: string;
}) {
  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionIcon}>
        <AppIcon color={colors.surface} name={icon} size={20} />
      </View>
      <AppText style={styles.sectionLabel} tone="inverse">
        {label}
      </AppText>
    </View>
  );
}

function SidebarNavigationLink({
  active,
  href,
  icon,
  label,
  onNavigate,
  onPress,
}: {
  readonly active: boolean;
  readonly href?: Href;
  readonly icon: AppIconName;
  readonly label: string;
  readonly onNavigate?: () => void;
  readonly onPress?: () => void;
}) {
  const item = (
    <Pressable
      accessibilityLabel={onPress ? `${label}, em breve` : `Ir para ${label}`}
      accessibilityRole={onPress ? 'button' : 'tab'}
      accessibilityState={onPress ? undefined : { selected: active }}
      onPress={onPress}
      onPressIn={onPress ? undefined : onNavigate}
      style={StyleSheet.flatten([
        styles.sectionItem,
        active && styles.sectionItemActive,
      ])}
    >
      <NavigationItemContent icon={icon} label={label} />
    </Pressable>
  );

  return href ? (
    <Link href={href} replace asChild>
      {item}
    </Link>
  ) : (
    item
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

function GeneralNavigationLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  readonly href: Href;
  readonly icon: AppIconName;
  readonly label: string;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link href={href} replace asChild>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="link"
        onPressIn={onNavigate}
        style={styles.sectionItem}
      >
        <NavigationItemContent icon={icon} label={label} />
      </Pressable>
    </Link>
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
      <NavigationItemContent icon={icon} label={label} />
    </Pressable>
  );
}

export function NavigationPanel({
  activeSection,
  bandId,
  bandName,
  getSectionHref,
  onNavigate,
  onLogout,
  onStagePress,
}: NavigationPanelProps) {
  const { session } = useAuthSession();
  const profileQuery = useCurrentProfile();
  const account = session
    ? {
        avatarUrl: profileQuery.data?.avatarUrl,
        email:
          profileQuery.data?.email ??
          (profileQuery.isLoading
            ? 'Carregando perfil…'
            : 'E-mail não disponível'),
        name:
          profileQuery.data?.displayName ??
          (profileQuery.isLoading
            ? 'Carregando perfil…'
            : 'Perfil indisponível'),
      }
    : {
        avatarUrl: null,
        email: 'Sessão não iniciada',
        name: 'Visitante',
      };

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
        <View
          style={styles.accountIdentity}
          testID="navigation-account-identity"
        >
          <UserAvatar
            avatarUrl={account.avatarUrl}
            displayName={account.name}
            size={36}
          />
          <View style={styles.accountCopy} testID="navigation-account-copy">
            <AppText
              numberOfLines={2}
              style={styles.accountName}
              tone="inverse"
            >
              {account.name}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[styles.muted, styles.accountEmail]}
              variant="caption"
            >
              {account.email}
            </AppText>
          </View>
        </View>
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
                href={
                  item.section === 'stage'
                    ? undefined
                    : getSectionHref(item.section)
                }
                icon={item.icon}
                key={item.section}
                label={item.label}
                onNavigate={onNavigate}
                onPress={item.section === 'stage' ? onStagePress : undefined}
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
        <GeneralNavigationLink
          href="/account"
          icon="account"
          label="Perfil e conta"
          onNavigate={onNavigate}
        />
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
        <AppVersionLabel inverse />
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
  accountIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  accountCopy: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    gap: spacing.xs,
    minWidth: 0,
  },
  accountName: {
    alignSelf: 'stretch',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  accountEmail: {
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  bandNavigation: {
    gap: spacing.sm,
  },
  sidebarTabs: {
    gap: 0,
  },
  sectionItem: {
    alignSelf: 'stretch',
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: menuItemHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  sectionItemActive: {
    backgroundColor: colors.navyRaised,
  },
  sectionContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionIcon: {
    height: 20,
    marginTop: 2,
    width: 20,
  },
  sectionLabel: {
    flexShrink: 1,
    minWidth: 0,
  },
  generalNavigation: {
    borderTopColor: colors.navyRaised,
    borderTopWidth: 1,
    gap: 0,
    paddingTop: spacing.md,
  },
  generalItem: {
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: menuItemHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  footer: {
    gap: spacing.xs,
    marginTop: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});
