import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import type { EntityId } from '@/domain';
import { NavigationIconButton } from '@/features/navigation/components/NavigationIconButton';
import { NavigationPanel } from '@/features/navigation/components/NavigationPanel';
import type { BandSection } from '@/features/navigation/routes';
import { colors, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

interface MobileNavigationDrawerProps {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onClose: () => void;
  readonly onDismiss: () => void;
  readonly onLogout?: () => void | Promise<void>;
  readonly onStagePress: () => void;
  readonly translateX: Animated.Value;
  readonly visible: boolean;
}

export function MobileNavigationDrawer({
  activeSection,
  bandId,
  bandName,
  getSectionHref,
  onClose,
  onDismiss,
  onLogout,
  onStagePress,
  translateX,
  visible,
}: MobileNavigationDrawerProps) {
  const handleClose = useCallback(() => {
    blurWebFocus();

    onClose();
  }, [onClose]);

  return (
    <Modal
      animationType="none"
      onDismiss={onDismiss}
      onRequestClose={handleClose}
      testID="navigation-drawer-modal"
      transparent
      visible={visible}
    >
      {visible ? <StatusBar style="light" /> : null}
      <SafeAreaProvider style={styles.provider}>
        <View style={styles.layer}>
          <Animated.View
            style={[styles.frame, { transform: [{ translateX }] }]}
          >
            <View pointerEvents="none" style={styles.drawerSurface} />
            <SafeAreaView
              accessibilityViewIsModal
              edges={['top', 'bottom']}
              style={styles.drawerContent}
              testID="navigation-drawer"
            >
              <View style={styles.header}>
                <View style={styles.brand}>
                  <AppLogo size={32} />
                  <View style={styles.brandCopy}>
                    <AppText tone="inverse" variant="heading">
                      Setlist
                    </AppText>
                    <AppText style={styles.subtitle} variant="caption">
                      A banda no mesmo compasso
                    </AppText>
                  </View>
                </View>
                <NavigationIconButton
                  accessibilityLabel="Fechar menu geral"
                  color={colors.text.primary}
                  icon="close"
                  onPress={handleClose}
                />
              </View>
              <NavigationPanel
                activeSection={activeSection}
                bandId={bandId}
                bandName={bandName}
                largeTargets
                showBrand={false}
                getSectionHref={getSectionHref}
                onNavigate={handleClose}
                onLogout={onLogout}
                onStagePress={onStagePress}
              />
            </SafeAreaView>
          </Animated.View>
          <Pressable
            accessibilityLabel="Fechar menu geral"
            accessibilityRole="button"
            onPress={handleClose}
            style={styles.scrim}
          />
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
  },
  layer: {
    flex: 1,
    flexDirection: 'row',
  },
  frame: {
    alignSelf: 'stretch',
    maxWidth: 360,
    position: 'relative',
    width: '86%',
  },
  drawerSurface: {
    backgroundColor: colors.background.canvas,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  drawerContent: {
    flex: 1,
    width: '100%',
  },
  scrim: {
    backgroundColor: colors.background.overlay,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  brandCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  subtitle: {
    color: colors.text.secondary,
  },
});
