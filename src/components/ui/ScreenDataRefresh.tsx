import { Platform, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';

interface ScreenDataRefreshProps {
  readonly onRefresh: () => void | Promise<void>;
  readonly refreshing: boolean;
}

export function ListRefreshControl({
  onRefresh,
  refreshing,
}: ScreenDataRefreshProps) {
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <RefreshControl
      onRefresh={() => void onRefresh()}
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
      <AppButton
        accessibilityLabel="Atualizar dados desta tela"
        disabled={refreshing}
        icon="renew"
        label={refreshing ? 'Atualizando…' : 'Atualizar'}
        onPress={() => void onRefresh()}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webAction: {
    alignSelf: 'flex-end',
  },
});
