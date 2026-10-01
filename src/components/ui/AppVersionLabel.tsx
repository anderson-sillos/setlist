import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

import appConfig from '../../../app.json';
import { AppText } from '@/components/ui/AppText';

interface AppVersionLabelProps {
  readonly inverse?: boolean;
}

export function AppVersionLabel({ inverse = false }: AppVersionLabelProps) {
  const version = Constants.expoConfig?.version ?? appConfig.expo.version;

  return (
    <AppText
      style={[styles.label, inverse && styles.inverse]}
      tone="muted"
      variant="caption"
    >
      Versão {version}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    opacity: 0.8,
    textAlign: 'center',
  },
  inverse: {
    color: '#aab3ce',
  },
});
