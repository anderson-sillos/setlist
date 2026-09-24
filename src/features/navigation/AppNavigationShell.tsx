import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCallback, useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/feedback';
import { AppHeader } from '@/features/navigation/components/AppHeader';
import { BottomNavigation } from '@/features/navigation/components/BottomNavigation';
import { MobileNavigationDrawer } from '@/features/navigation/components/MobileNavigationDrawer';
import { NavigationPanel } from '@/features/navigation/components/NavigationPanel';
import { signOut } from '@/features/auth/authService';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { useBandNavigationState } from '@/features/navigation/hooks/useBandNavigationState';
import { useNavigationDrawer } from '@/features/navigation/hooks/useNavigationDrawer';
import type { AppNavigationShellProps } from '@/features/navigation/types';
import { getLayoutMode, getNavigationPresentation } from '@/theme/responsive';
import { colors, layout, spacing } from '@/theme/tokens';

export type {
  EditActions,
  HeaderAction,
  NavigationScreenKind,
} from '@/features/navigation/types';

export function AppNavigationShell({
  activeSection,
  backHref,
  bandId,
  bandName,
  children,
  contentStyle,
  connectionStatus,
  currentRoute,
  headerActions,
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
  const router = useRouter();
  const { setLastBand } = useLastBandSelection();

  useEffect(() => {
    if (bandId) {
      void setLastBand(bandId);
    }
  }, [bandId, setLastBand]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.replace('/auth' as Href);
    } catch (error) {
      console.error('[auth] Falha ao sair.', error);
    }
  }, [router]);
  const window = useWindowDimensions();
  const width = viewportWidth ?? window.width;
  const height = viewportHeight ?? window.height;
  const layoutMode = getLayoutMode(width);
  const navigationPresentation = getNavigationPresentation(width, height);
  const persistentSidebar = navigationPresentation === 'sidebar';
  const { getSectionHref, handleScroll, initialScrollOffset } =
    useBandNavigationState({
      activeSection,
      bandId,
      currentRoute,
      screenKind,
    });
  const { closeDrawer, drawerOpen, drawerTranslateX, edgeGesture, openDrawer } =
    useNavigationDrawer({ persistentSidebar, screenKind, width });

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
              onLogout={handleLogout}
            />
          </View>
        ) : null}

        <View style={styles.mainArea}>
          <AppHeader
            backHref={backHref}
            bandName={bandName}
            editActions={editActions}
            headerActions={headerActions}
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

          {showBottomNavigation && activeSection ? (
            <BottomNavigation
              activeSection={activeSection}
              getSectionHref={getSectionHref}
            />
          ) : null}

          {!persistentSidebar && screenKind === 'main' ? (
            <View
              {...edgeGesture.panHandlers}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.edgeGesture}
              testID="drawer-edge-gesture"
            />
          ) : null}
        </View>
      </View>

      {!persistentSidebar ? (
        <MobileNavigationDrawer
          activeSection={activeSection}
          bandId={bandId}
          bandName={bandName}
          getSectionHref={getSectionHref}
          onClose={closeDrawer}
          onLogout={handleLogout}
          translateX={drawerTranslateX}
          visible={drawerOpen}
        />
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
  scrollContent: {
    flexGrow: 1,
  },
  fixedContentFrame: {
    backgroundColor: colors.paper,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    zIndex: 2,
  },
  fixedContent: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  content: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  unscrolledContent: {
    flex: 1,
    minHeight: 0,
  },
  edgeGesture: {
    bottom: 52,
    left: 0,
    pointerEvents: 'box-only',
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
});
