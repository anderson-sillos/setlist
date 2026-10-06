import { Link, type Href } from 'expo-router';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { AppVersionLabel } from '@/components/ui/AppVersionLabel';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useBandMembers } from '@/data/queries';
import type { BandRole, EntityId } from '@/domain';
import { useCurrentProfile } from '@/features/account/useCurrentProfile';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { legalUrls } from '@/features/legal/legalUrls';
import { navigationItems } from '@/features/navigation/navigationItems';
import type { BandSection } from '@/features/navigation/routes';
import { useSectionTransition } from '@/features/navigation/SectionTransition';
import { colors, radii, spacing } from '@/theme/tokens';

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

interface NavigationPanelProps {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly compact?: boolean;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly largeTargets?: boolean;
  readonly onNavigate?: () => void;
  readonly onLogout?: () => void | Promise<void>;
  readonly onStagePress: () => void;
  readonly showBrand?: boolean;
}

function NavigationItemContent({
  active = false,
  compact = false,
  icon,
  label,
  largeTargets = false,
}: {
  readonly active?: boolean;
  readonly compact?: boolean;
  readonly icon: AppIconName;
  readonly label: string;
  readonly largeTargets?: boolean;
}) {
  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionIcon}>
        <AppIcon
          color={active ? colors.action.primary : colors.text.secondary}
          name={icon}
          size={20}
        />
      </View>
      <AppText
        style={[
          styles.sectionLabel,
          compact && styles.compactSectionLabel,
          largeTargets && styles.drawerSectionLabel,
        ]}
        tone={active ? 'inverse' : 'muted'}
      >
        {label}
      </AppText>
    </View>
  );
}

function SidebarNavigationLink({
  active,
  compact = false,
  href,
  icon,
  label,
  largeTargets = false,
  rowHeight,
  onNavigate,
  onPress,
}: {
  readonly active: boolean;
  readonly compact?: boolean;
  readonly href?: Href;
  readonly icon: AppIconName;
  readonly label: string;
  readonly largeTargets?: boolean;
  readonly rowHeight: number;
  readonly onNavigate?: () => void;
  readonly onPress?: () => void;
}) {
  const baseStyle = [
    styles.sectionItem,
    compact && styles.compactItem,
    largeTargets && styles.drawerItem,
    { height: rowHeight, minHeight: rowHeight, paddingVertical: 0 },
  ];
  const itemStyle = href
    ? StyleSheet.flatten([...baseStyle, active && styles.sectionItemActive])
    : ({ pressed }: { pressed: boolean }) => [
        ...baseStyle,
        pressed && styles.pressed,
        active && styles.sectionItemActive,
      ];
  const item = (
    <Pressable
      accessibilityLabel={onPress ? `${label}, em breve` : `Ir para ${label}`}
      accessibilityRole={onPress ? 'button' : 'tab'}
      accessibilityState={onPress ? undefined : { selected: active }}
      onPress={onPress}
      onPressIn={onPress ? undefined : onNavigate}
      style={itemStyle}
    >
      {active ? (
        <View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            compact && styles.compactActiveIndicator,
            largeTargets && styles.drawerActiveIndicator,
          ]}
        />
      ) : null}
      <NavigationItemContent
        active={active}
        compact={compact}
        icon={icon}
        label={label}
        largeTargets={largeTargets}
      />
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

function GeneralNavigationLink({
  compact = false,
  href,
  icon,
  label,
  largeTargets = false,
  rowHeight,
  onNavigate,
}: {
  readonly compact?: boolean;
  readonly href: Href;
  readonly icon: AppIconName;
  readonly label: string;
  readonly largeTargets?: boolean;
  readonly rowHeight: number;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link href={href} replace asChild>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="link"
        onPressIn={onNavigate}
        style={StyleSheet.flatten([
          styles.sectionItem,
          compact && styles.compactItem,
          largeTargets && styles.drawerItem,
          { height: rowHeight, minHeight: rowHeight, paddingVertical: 0 },
        ])}
      >
        <NavigationItemContent
          compact={compact}
          icon={icon}
          label={label}
          largeTargets={largeTargets}
        />
      </Pressable>
    </Link>
  );
}

function GeneralNavigationAction({
  compact = false,
  icon,
  label,
  largeTargets = false,
  rowHeight,
  onPress,
}: {
  readonly compact?: boolean;
  readonly icon: AppIconName;
  readonly label: string;
  readonly largeTargets?: boolean;
  readonly rowHeight: number;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.sectionItem,
        compact && styles.compactItem,
        largeTargets && styles.drawerItem,
        { height: rowHeight, minHeight: rowHeight, paddingVertical: 0 },
        pressed && styles.pressed,
      ]}
    >
      <NavigationItemContent
        compact={compact}
        icon={icon}
        label={label}
        largeTargets={largeTargets}
      />
    </Pressable>
  );
}

function FooterLegalLink({
  label,
  rowHeight,
  onPress,
}: {
  readonly label: string;
  readonly rowHeight: number;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.legalLink,
        { height: rowHeight, minHeight: rowHeight },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.legalIconSlot} />
      <AppText numberOfLines={1} style={styles.legalLabel}>
        {label}
      </AppText>
      <AppIcon color={colors.text.secondary} name="externalLink" size={16} />
    </Pressable>
  );
}

export function NavigationPanel({
  activeSection,
  bandId,
  bandName,
  compact = false,
  getSectionHref,
  largeTargets = false,
  onNavigate,
  onLogout,
  onStagePress,
  showBrand = true,
}: NavigationPanelProps) {
  const { setSectionTransition } = useSectionTransition();
  const { session } = useAuthSession();
  const { fontScale } = useWindowDimensions();
  const profileQuery = useCurrentProfile();
  const membersQuery = useBandMembers(bandId);
  const rowHeight =
    (largeTargets ? 48 : compact ? 28 : 32) * Math.max(1, fontScale);
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
  const membership = membersQuery.data?.find(
    (member) => member.userId === session?.user.id,
  );
  const membershipLabel = membership
    ? roleLabels[membership.role]
    : membersQuery.isLoading
      ? 'Carregando papel…'
      : membersQuery.isError
        ? 'Papel indisponível'
        : null;

  return (
    <ScrollView contentContainerStyle={styles.panel}>
      {showBrand ? (
        <View style={styles.brand}>
          <AppLogo size={40} />
          <View>
            <AppText tone="inverse" variant="heading">
              Setlist
            </AppText>
            <AppText style={styles.muted} variant="caption">
              A banda no mesmo compasso
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.bandContext}>
        <AppText style={styles.bandContextName} tone="inverse">
          {bandId
            ? (bandName ?? 'Banda selecionada')
            : 'Nenhuma banda selecionada'}
        </AppText>
        {bandId && membershipLabel ? (
          <AppText style={styles.muted} variant="caption">
            {membershipLabel}
          </AppText>
        ) : null}
      </View>

      {bandId ? (
        <View style={styles.bandNavigation}>
          <View accessibilityRole="tablist" style={styles.sidebarTabs}>
            {navigationItems.map((item) => (
              <SidebarNavigationLink
                active={activeSection === item.section}
                compact={compact}
                href={
                  item.section === 'stage'
                    ? undefined
                    : getSectionHref(item.section)
                }
                icon={item.icon}
                key={item.section}
                label={item.label}
                largeTargets={largeTargets}
                rowHeight={rowHeight}
                onNavigate={() => {
                  if (activeSection && item.section !== 'stage') {
                    setSectionTransition(activeSection, item.section);
                  }
                  onNavigate?.();
                }}
                onPress={item.section === 'stage' ? onStagePress : undefined}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.generalNavigation}>
        <SidebarNavigationLink
          active={!bandId}
          compact={compact}
          href="/"
          icon="bands"
          label="Minhas bandas"
          largeTargets={largeTargets}
          rowHeight={rowHeight}
          onNavigate={onNavigate}
        />
        <GeneralNavigationLink
          compact={compact}
          href="/account"
          icon="account"
          label="Perfil e conta"
          largeTargets={largeTargets}
          rowHeight={rowHeight}
          onNavigate={onNavigate}
        />
      </View>

      <View style={styles.footer}>
        <View
          style={[styles.accountIdentity, { minHeight: rowHeight }]}
          testID="navigation-account-identity"
        >
          <UserAvatar
            avatarUrl={account.avatarUrl}
            displayName={account.name}
            size={28}
          />
          <View style={styles.accountCopy} testID="navigation-account-copy">
            <AppText
              numberOfLines={1}
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
        <FooterLegalLink
          label="Termos de uso"
          rowHeight={rowHeight}
          onPress={() => {
            onNavigate?.();
            void Linking.openURL(legalUrls.terms);
          }}
        />
        <FooterLegalLink
          label="Política de privacidade"
          rowHeight={rowHeight}
          onPress={() => {
            onNavigate?.();
            void Linking.openURL(legalUrls.privacy);
          }}
        />
        <GeneralNavigationAction
          compact={compact}
          icon="logout"
          label="Sair da conta"
          largeTargets={largeTargets}
          rowHeight={rowHeight}
          onPress={() => {
            onNavigate?.();
            void onLogout?.();
          }}
        />
        <View style={styles.versionLabel}>
          <AppVersionLabel inverse />
        </View>
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
  muted: {
    color: colors.text.secondary,
  },
  bandContext: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  bandContextName: {
    fontSize: 14,
    fontWeight: '600',
  },
  bandNavigation: {
    gap: spacing.sm,
  },
  sidebarTabs: {
    gap: 0,
  },
  sectionItem: {
    alignSelf: 'stretch',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 32,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: 'relative',
    width: '100%',
  },
  compactItem: {
    minHeight: 28,
  },
  drawerItem: {
    minHeight: 48,
    paddingVertical: 0,
  },
  sectionItemActive: {
    backgroundColor: colors.background.selected,
  },
  activeIndicator: {
    backgroundColor: colors.action.primary,
    borderRadius: radii.pill,
    bottom: 8,
    left: spacing.sm,
    position: 'absolute',
    top: 8,
    width: 2,
  },
  compactActiveIndicator: {
    bottom: 6,
    top: 6,
  },
  drawerActiveIndicator: {
    bottom: 14,
    top: 14,
  },
  sectionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  sectionIcon: {
    alignItems: 'center',
    flexBasis: 24,
    flexGrow: 0,
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minWidth: 0,
  },
  compactSectionLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  drawerSectionLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  generalNavigation: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: 0,
  },
  footer: {
    gap: 0,
    marginTop: 'auto',
  },
  accountIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  accountName: {
    fontSize: 13,
    lineHeight: 18,
  },
  accountEmail: {
    fontSize: 11,
    lineHeight: 14,
  },
  legalLink: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 28,
    paddingHorizontal: spacing.md,
  },
  legalIconSlot: {
    height: 24,
    width: 24,
  },
  legalLabel: {
    color: colors.text.secondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    minWidth: 0,
  },
  versionLabel: {
    marginTop: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background.pressed,
  },
});
