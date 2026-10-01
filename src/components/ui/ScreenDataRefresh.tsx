import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type RefreshControlProps,
} from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, layout, radii } from '@/theme/tokens';

interface ScreenDataRefreshProps {
  readonly onRefresh: () => void | Promise<void>;
  readonly refreshing: boolean;
}

export function getListRefreshControl({
  onRefresh,
  refreshing,
}: ScreenDataRefreshProps): ReactElement<RefreshControlProps> | undefined {
  if (Platform.OS === 'web') {
    return undefined;
  }

  return (
    <RefreshControl
      onRefresh={() => {
        void onRefresh();
      }}
      refreshing={refreshing}
    />
  );
}

export function WebRefreshButton({
  onRefresh,
  refreshing,
}: ScreenDataRefreshProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.webAction}>
      <Pressable
        accessibilityLabel={
          refreshing
            ? 'Atualizando dados desta tela'
            : 'Atualizar dados desta tela'
        }
        accessibilityRole="button"
        disabled={refreshing}
        onPress={() => void onRefresh()}
        style={({ pressed }) => [
          styles.webIconButton,
          refreshing && styles.webIconButtonDisabled,
          pressed && styles.webIconButtonPressed,
        ]}
      >
        {refreshing ? (
          <ActivityIndicator color={colors.violet} size="small" />
        ) : (
          <AppIcon color={colors.violet} name="renew" size={18} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  webAction: {
    alignSelf: 'flex-end',
    height: layout.minimumTouchTarget,
  },
  webIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.violet,
    borderRadius: radii.md,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  webIconButtonDisabled: {
    opacity: 0.5,
  },
  webIconButtonPressed: {
    opacity: 0.72,
  },
});
