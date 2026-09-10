import { Link, type Href } from 'expo-router';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConnectionBanner, type ConnectionStatus } from '@/components/feedback';
import { AppText } from '@/components/ui/AppText';
import type { EntityId } from '@/domain';
import { useNavigationMemory } from '@/features/navigation/NavigationMemory';
import {
  getBandSectionHref,
  type BandSection,
} from '@/features/navigation/routes';
import { getLayoutMode, getNavigationPresentation } from '@/theme/responsive';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export type NavigationScreenKind = 'main' | 'detail' | 'edit';

export interface HeaderAction {
  readonly accessibilityLabel: string;
  readonly label: string;
  readonly onPress: () => void;
}

export interface EditActions {
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly saveDisabled?: boolean;
}

interface AppNavigationShellProps extends PropsWithChildren {
  readonly activeSection?: BandSection;
  readonly backHref?: Href;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly connectionStatus?: ConnectionStatus;
  readonly currentRoute?: string;
  readonly editActions?: EditActions;
  readonly fixedContent?: ReactNode;
  readonly headerAction?: HeaderAction;
  readonly onConnectionRetry?: () => void;
  readonly scrollable?: boolean;
  readonly screenKind?: NavigationScreenKind;
  readonly subtitle?: string;
  readonly testID?: string;
  readonly title: string;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

const navigationItems: readonly {
  readonly label: string;
  readonly marker: string;
  readonly section: BandSection;
}[] = [
  { label: 'Shows', marker: '▣', section: 'shows' },
  { label: 'Repertório', marker: '♫', section: 'repertoire' },
  { label: 'Palco', marker: '▶', section: 'stage' },
  { label: 'Banda', marker: '♬', section: 'band' },
];

function IconButton({
  accessibilityLabel,
  children,
  onPress,
}: {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <AppText style={styles.iconLabel}>{children}</AppText>
    </Pressable>
  );
}

function NavigationLink({
  active = false,
  href,
  label,
  marker,
  presentation,
}: {
  readonly active?: boolean;
  readonly href: Href;
  readonly label: string;
  readonly marker: string;
  readonly presentation: 'bottom' | 'sidebar';
}) {
  return (
    <Link href={href} replace asChild>
      <Pressable
        accessibilityLabel={`Ir para ${label}`}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [
          presentation === 'bottom'
            ? styles.bottomNavigationItem
            : styles.sidebarNavigationItem,
          active &&
            (presentation === 'bottom'
              ? styles.bottomNavigationItemActive
              : styles.sidebarNavigationItemActive),
          pressed && styles.pressed,
        ]}
      >
        {presentation === 'bottom' ? (
          <>
            <AppText
              style={styles.bottomMarker}
              tone={active ? 'accent' : 'muted'}
            >
              {marker}
            </AppText>
            <AppText
              numberOfLines={1}
              style={styles.bottomLabel}
              tone={active ? 'accent' : 'muted'}
              variant="caption"
            >
              {label}
            </AppText>
          </>
        ) : (
          <AppText tone="inverse">
            {marker} {label}
          </AppText>
        )}
      </Pressable>
    </Link>
  );
}

function GeneralLink({
  href,
  label,
  onNavigate,
}: {
  readonly href: Href;
  readonly label: string;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="link"
        onPress={onNavigate}
        style={({ pressed }) => [
          styles.generalNavigationItem,
          pressed && styles.pressed,
        ]}
      >
        <AppText tone="inverse">{label}</AppText>
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
      style={styles.generalNavigationItem}
    >
      <AppText style={styles.sidebarMuted}>{label}</AppText>
    </View>
  );
}

function NavigationPanel({
  activeSection,
  bandId,
  bandName,
  getSectionHref,
  onNavigate,
}: {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onNavigate?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.navigationPanel}>
      <View style={styles.brand}>
        <AppText style={styles.brandMark} tone="inverse" variant="heading">
          ♪
        </AppText>
        <View>
          <AppText tone="inverse" variant="heading">
            Setlist
          </AppText>
          <AppText style={styles.sidebarMuted} variant="caption">
            A banda no mesmo compasso
          </AppText>
        </View>
      </View>

      <View style={styles.accountSummary}>
        <AppText tone="inverse">Ana Martins</AppText>
        <AppText style={styles.sidebarMuted} variant="caption">
          Conta de demonstração
        </AppText>
      </View>

      <GeneralLink href="/" label="Minhas bandas" onNavigate={onNavigate} />

      {bandId ? (
        <View style={styles.bandNavigation}>
          <AppText style={styles.sidebarMuted} variant="eyebrow">
            {bandName ?? 'Banda selecionada'}
          </AppText>
          <View accessibilityRole="tablist" style={styles.sidebarTabs}>
            {navigationItems.map((item) => (
              <NavigationLink
                active={activeSection === item.section}
                href={getSectionHref(item.section)}
                key={item.section}
                label={item.label}
                marker={item.marker}
                presentation="sidebar"
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.generalNavigation}>
        <DisabledGeneralItem label="Perfil e conta" />
        <DisabledGeneralItem label="Termos e privacidade" />
        <DisabledGeneralItem label="Sobre o Setlist" />
      </View>

      <View style={styles.sidebarFooter}>
        <DisabledGeneralItem label="Sair" />
        <AppText style={styles.sidebarMuted} variant="caption">
          A autenticação entra em um próximo incremento.
        </AppText>
      </View>
    </ScrollView>
  );
}

function AppHeader({
  backHref,
  bandName,
  editActions,
  headerAction,
  onOpenMenu,
  persistentSidebar,
  screenKind,
  subtitle,
  title,
}: Pick<
  AppNavigationShellProps,
  | 'backHref'
  | 'bandName'
  | 'editActions'
  | 'headerAction'
  | 'screenKind'
  | 'subtitle'
  | 'title'
> & {
  readonly onOpenMenu: () => void;
  readonly persistentSidebar: boolean;
}) {
  const kind = screenKind ?? 'main';

  return (
    <View style={styles.header} testID="app-header">
      {kind === 'main' && !persistentSidebar ? (
        <IconButton accessibilityLabel="Abrir menu geral" onPress={onOpenMenu}>
          ☰
        </IconButton>
      ) : null}

      {kind === 'detail' && backHref ? (
        <Link href={backHref} asChild>
          <Pressable
            accessibilityLabel={`Voltar para ${subtitle ?? 'a tela anterior'}`}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.iconLabel}>←</AppText>
          </Pressable>
        </Link>
      ) : null}

      {kind === 'edit' && editActions ? (
        <Pressable
          accessibilityLabel="Cancelar edição"
          accessibilityRole="button"
          onPress={editActions.onCancel}
          style={({ pressed }) => [
            styles.headerTextButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">Cancelar</AppText>
        </Pressable>
      ) : null}

      <View style={styles.headerCopy}>
        <AppText accessibilityRole="header" numberOfLines={1} variant="heading">
          {title}
        </AppText>
        {bandName && kind !== 'edit' ? (
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {bandName}
          </AppText>
        ) : null}
      </View>

      {kind === 'edit' && editActions ? (
        <Pressable
          accessibilityLabel="Salvar edição"
          accessibilityRole="button"
          accessibilityState={{ disabled: editActions.saveDisabled }}
          disabled={editActions.saveDisabled}
          onPress={editActions.onSave}
          style={({ pressed }) => [
            styles.headerTextButton,
            editActions.saveDisabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">Salvar</AppText>
        </Pressable>
      ) : null}

      {kind !== 'edit' && headerAction ? (
        <Pressable
          accessibilityLabel={headerAction.accessibilityLabel}
          accessibilityRole="button"
          onPress={headerAction.onPress}
          style={({ pressed }) => [
            styles.headerTextButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">{headerAction.label}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AppNavigationShell({
  activeSection,
  backHref,
  bandId,
  bandName,
  children,
  contentStyle,
  connectionStatus,
  currentRoute,
  editActions,
  fixedContent,
  headerAction,
  onConnectionRetry,
  screenKind = 'main',
  scrollable = true,
  subtitle,
  testID,
  title,
  viewportHeight,
  viewportWidth,
}: AppNavigationShellProps) {
  const window = useWindowDimensions();
  const width = viewportWidth ?? window.width;
  const height = viewportHeight ?? window.height;
  const layoutMode = getLayoutMode(width);
  const navigationPresentation = getNavigationPresentation(width, height);
  const persistentSidebar = navigationPresentation === 'sidebar';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTranslateX] = useState(() => new Animated.Value(-360));
  const navigationMemory = useNavigationMemory();

  const openDrawer = useCallback(() => {
    drawerTranslateX.setValue(-Math.min(width * 0.86, 360));
    setDrawerOpen(true);
  }, [drawerTranslateX, width]);

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerTranslateX, {
      duration: 180,
      toValue: -Math.min(width * 0.86, 360),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDrawerOpen(false);
      }
    });
  }, [drawerTranslateX, width]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const animation = Animated.timing(drawerTranslateX, {
      duration: 240,
      toValue: 0,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [drawerOpen, drawerTranslateX]);

  useEffect(() => {
    if (bandId && activeSection && currentRoute && screenKind !== 'edit') {
      navigationMemory.rememberRoute(bandId, activeSection, currentRoute);
    }
  }, [activeSection, bandId, currentRoute, navigationMemory, screenKind]);

  const getSectionHref = (section: BandSection): Href => {
    if (!bandId) {
      return '/' as Href;
    }

    return (navigationMemory.getSectionMemory(bandId, section).route ??
      getBandSectionHref(bandId, section)) as Href;
  };

  const initialScrollOffset =
    bandId && activeSection && screenKind === 'main'
      ? (navigationMemory.getSectionMemory(bandId, activeSection)
          .scrollOffset ?? 0)
      : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (bandId && activeSection && screenKind === 'main') {
      navigationMemory.rememberScrollOffset(
        bandId,
        activeSection,
        event.nativeEvent.contentOffset.y,
      );
    }
  };

  const edgeGesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          screenKind === 'main' &&
          !persistentSidebar &&
          gesture.dx > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= 40) {
            openDrawer();
          }
        },
      }),
    [openDrawer, persistentSidebar, screenKind],
  );

  const showBottomNavigation =
    !persistentSidebar &&
    Boolean(bandId && activeSection) &&
    screenKind !== 'edit';

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID={testID ?? `navigation-shell-${layoutMode}`}
    >
      <View style={styles.shellRow}>
        {persistentSidebar ? (
          <View style={styles.sidebar} testID="navigation-sidebar">
            <NavigationPanel
              activeSection={activeSection}
              bandId={bandId}
              bandName={bandName}
              getSectionHref={getSectionHref}
            />
          </View>
        ) : null}

        <View style={styles.mainArea}>
          <AppHeader
            backHref={backHref}
            bandName={bandName}
            editActions={editActions}
            headerAction={headerAction}
            onOpenMenu={openDrawer}
            persistentSidebar={persistentSidebar}
            screenKind={screenKind}
            subtitle={subtitle}
            title={title}
          />

          {connectionStatus ? (
            <ConnectionBanner
              onRetry={onConnectionRetry}
              status={connectionStatus}
            />
          ) : null}

          {fixedContent ? (
            <View style={styles.fixedContentFrame}>
              <View style={styles.fixedContent}>{fixedContent}</View>
            </View>
          ) : null}

          {scrollable ? (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              contentOffset={{ x: 0, y: initialScrollOffset }}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              scrollEventThrottle={120}
              testID="screen-scroll-area"
            >
              <View style={styles.content}>{children}</View>
            </ScrollView>
          ) : (
            <View
              style={[styles.unscrolledContent, contentStyle]}
              testID="screen-static-area"
            >
              {children}
            </View>
          )}

          {showBottomNavigation ? (
            <View
              accessibilityRole="tablist"
              style={styles.bottomNavigation}
              testID="bottom-navigation"
            >
              {navigationItems.map((item) => (
                <NavigationLink
                  active={activeSection === item.section}
                  href={getSectionHref(item.section)}
                  key={item.section}
                  label={item.label}
                  marker={item.marker}
                  presentation="bottom"
                />
              ))}
            </View>
          ) : null}

          {!persistentSidebar && screenKind === 'main' ? (
            <View
              {...edgeGesture.panHandlers}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="box-only"
              style={styles.edgeGesture}
              testID="drawer-edge-gesture"
            />
          ) : null}
        </View>
      </View>

      {!persistentSidebar ? (
        <Modal
          animationType="none"
          onRequestClose={closeDrawer}
          transparent
          visible={drawerOpen}
        >
          <View style={styles.drawerLayer}>
            <Animated.View
              style={[
                styles.drawerFrame,
                { transform: [{ translateX: drawerTranslateX }] },
              ]}
            >
              <SafeAreaView style={styles.drawer} testID="navigation-drawer">
                <View style={styles.drawerHeader}>
                  <AppText tone="inverse" variant="eyebrow">
                    Menu geral
                  </AppText>
                  <IconButton
                    accessibilityLabel="Fechar menu geral"
                    onPress={closeDrawer}
                  >
                    ×
                  </IconButton>
                </View>
                <NavigationPanel
                  activeSection={activeSection}
                  bandId={bandId}
                  bandName={bandName}
                  getSectionHref={getSectionHref}
                  onNavigate={closeDrawer}
                />
              </SafeAreaView>
            </Animated.View>
            <Pressable
              accessibilityLabel="Fechar menu geral"
              accessibilityRole="button"
              onPress={closeDrawer}
              style={styles.drawerScrim}
            />
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  shellRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    zIndex: 4,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  iconLabel: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  headerTextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedContentFrame: {
    backgroundColor: colors.paper,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    zIndex: 2,
  },
  fixedContent: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  content: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  unscrolledContent: {
    flex: 1,
    minHeight: 0,
  },
  bottomNavigation: {
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    width: '100%',
  },
  bottomNavigationItem: {
    alignItems: 'center',
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    gap: 1,
    justifyContent: 'center',
    maxWidth: '25%',
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: '25%',
  },
  bottomNavigationItemActive: {
    backgroundColor: colors.violetSoft,
  },
  bottomMarker: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
  },
  bottomLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  edgeGesture: {
    bottom: 58,
    left: 0,
    position: 'absolute',
    top: 64,
    width: 16,
    zIndex: 3,
  },
  sidebar: {
    backgroundColor: colors.navy,
    flexBasis: 284,
    maxWidth: 320,
    minWidth: 260,
  },
  navigationPanel: {
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
  sidebarMuted: {
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
  sidebarNavigationItem: {
    borderRadius: radii.md,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sidebarNavigationItemActive: {
    backgroundColor: colors.navyRaised,
  },
  generalNavigation: {
    borderTopColor: colors.navyRaised,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  generalNavigationItem: {
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sidebarFooter: {
    gap: spacing.xs,
    marginTop: 'auto',
  },
  drawerLayer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerFrame: {
    maxWidth: 360,
    width: '86%',
  },
  drawer: {
    backgroundColor: colors.navy,
    flex: 1,
    width: '100%',
  },
  drawerScrim: {
    backgroundColor: 'rgba(11, 16, 32, 0.52)',
    flex: 1,
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: colors.navyRaised,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
});
