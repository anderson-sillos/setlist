import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/feedback';
import { getListRefreshControl } from '@/components/ui/ScreenDataRefresh';
import { AppHeader } from '@/features/navigation/components/AppHeader';
import { BottomNavigation } from '@/features/navigation/components/BottomNavigation';
import { MobileNavigationDrawer } from '@/features/navigation/components/MobileNavigationDrawer';
import { NavigationPanel } from '@/features/navigation/components/NavigationPanel';
import { signOut } from '@/features/auth/authService';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { useBandNavigationState } from '@/features/navigation/hooks/useBandNavigationState';
import { useNavigationDrawer } from '@/features/navigation/hooks/useNavigationDrawer';
import type { AppNavigationShellProps } from '@/features/navigation/types';
import { StageAvailabilityDialog } from '@/features/stage/StageAvailabilityDialog';
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
  editActions,
  fixedContent,
  headerAction,
  onConnectionRetry,
  onRefresh,
  refreshing = false,
  screenKind = 'main',
  scrollable = true,
  subtitle,
  testID,
  title,
  viewportHeight,
  viewportWidth,
}: AppNavigationShellProps) {
  const router = useRouter();
  const { clearLastBand, setLastBand } = useLastBandSelection();
  const [stageDialogVisible, setStageDialogVisible] = useState(false);
  const stageDialogPending = useRef(false);

  useEffect(() => {
    if (bandId) {
      void setLastBand(bandId);
    }
  }, [bandId, setLastBand]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      await clearLastBand();
      router.replace('/auth' as Href);
    } catch (error) {
      console.error('[auth] Falha ao sair.', error);
    }
  }, [clearLastBand, router]);
  const window = useWindowDimensions();
  const width = viewportWidth ?? window.width;
  const height = viewportHeight ?? window.height;
  const layoutMode = getLayoutMode(width);
  const navigationPresentation = getNavigationPresentation(width, height);
  const persistentSidebar = navigationPresentation === 'sidebar';
  const horizontalPadding =
    layoutMode === 'desktop'
      ? layout.desktopHorizontalMargin
      : layoutMode === 'tablet'
        ? layout.tabletHorizontalMargin
        : layout.phoneHorizontalMargin;
  const { getSectionHref, handleScroll, initialScrollOffset } =
    useBandNavigationState({
      activeSection,
      bandId,
      currentRoute,
      screenKind,
    });
  const { closeDrawer, drawerOpen, drawerTranslateX, edgeGesture, openDrawer } =
    useNavigationDrawer({ persistentSidebar, screenKind, width });
  const handleStagePress = useCallback(() => {
    if (drawerOpen && Platform.OS === 'ios') {
      stageDialogPending.current = true;
      closeDrawer();
      return;
    }

    closeDrawer();
    setStageDialogVisible(true);
  }, [closeDrawer, drawerOpen]);
  const handleDrawerDismiss = useCallback(() => {
    if (stageDialogPending.current) {
      stageDialogPending.current = false;
      setStageDialogVisible(true);
    }
  }, []);

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
              compact
              getSectionHref={getSectionHref}
              onLogout={handleLogout}
              onStagePress={handleStagePress}
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
              <View
                style={[
                  styles.fixedContent,
                  { paddingHorizontal: horizontalPadding },
                ]}
              >
                {fixedContent}
              </View>
            </View>
          ) : null}

          {scrollable ? (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              contentOffset={{ x: 0, y: initialScrollOffset }}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              refreshControl={
                onRefresh
                  ? getListRefreshControl({
                      onRefresh,
                      refreshing,
                    })
                  : undefined
              }
              scrollEventThrottle={120}
              testID="screen-scroll-area"
            >
              <View
                style={[
                  styles.content,
                  { paddingHorizontal: horizontalPadding },
                ]}
              >
                {children}
              </View>
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
              onStagePress={handleStagePress}
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
          onDismiss={handleDrawerDismiss}
          onLogout={handleLogout}
          onStagePress={handleStagePress}
          translateX={drawerTranslateX}
          visible={drawerOpen}
        />
      ) : null}

      <StageAvailabilityDialog
        onClose={() => setStageDialogVisible(false)}
        visible={stageDialogVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.canvas,
    flex: 1,
  },
  shellRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainArea: {
    backgroundColor: colors.background.base,
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedContentFrame: {
    backgroundColor: colors.background.canvas,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    zIndex: 2,
  },
  fixedContent: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  content: {
    alignSelf: 'center',
    backgroundColor: colors.background.base,
    maxWidth: layout.contentMaxWidth,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
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
    backgroundColor: colors.background.canvas,
    flexBasis: 248,
    maxWidth: 248,
    minWidth: 224,
  },
});
