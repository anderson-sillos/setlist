import type { Href } from 'expo-router';
import { useCallback } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import type { EntityId } from '@/domain';
import { NavigationIconButton } from '@/features/navigation/components/NavigationIconButton';
import { NavigationPanel } from '@/features/navigation/components/NavigationPanel';
import type { BandSection } from '@/features/navigation/routes';
import { colors, spacing } from '@/theme/tokens';

interface MobileNavigationDrawerProps {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly getSectionHref: (section: BandSection) => Href;
  readonly onClose: () => void;
  readonly onLogout?: () => void | Promise<void>;
  readonly translateX: Animated.Value;
  readonly visible: boolean;
}

export function MobileNavigationDrawer({
  activeSection,
  bandId,
  bandName,
  getSectionHref,
  onClose,
  onLogout,
  translateX,
  visible,
}: MobileNavigationDrawerProps) {
  const handleClose = useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const activeElement = document.activeElement as HTMLElement | null;
      activeElement?.blur();
    }

    onClose();
  }, [onClose]);

  return (
    <Modal
      animationType="none"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View style={styles.layer}>
        <Animated.View style={[styles.frame, { transform: [{ translateX }] }]}>
          <SafeAreaView style={styles.drawer} testID="navigation-drawer">
            <View style={styles.header}>
              <AppText tone="inverse" variant="eyebrow">
                Menu geral
              </AppText>
              <NavigationIconButton
                accessibilityLabel="Fechar menu geral"
                color={colors.surface}
                icon="close"
                onPress={handleClose}
              />
            </View>
            <NavigationPanel
              activeSection={activeSection}
              bandId={bandId}
              bandName={bandName}
              getSectionHref={getSectionHref}
              onNavigate={handleClose}
              onLogout={onLogout}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    flexDirection: 'row',
  },
  frame: {
    maxWidth: 360,
    width: '86%',
  },
  drawer: {
    backgroundColor: colors.navy,
    flex: 1,
    width: '100%',
  },
  scrim: {
    backgroundColor: 'rgba(11, 16, 32, 0.52)',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.navyRaised,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
});
