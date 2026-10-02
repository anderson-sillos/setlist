import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

import appConfig from '../../../app.json';
import { AppText } from '@/components/ui/AppText';

interface AppVersionLabelProps {
  readonly align?: 'center' | 'left';
  readonly compact?: boolean;
  readonly inverse?: boolean;
}

export function AppVersionLabel({
  align = 'center',
  compact = false,
  inverse = false,
}: AppVersionLabelProps) {
  const version = Constants.expoConfig?.version ?? appConfig.expo.version;

  return (
    <AppText
      style={[
        styles.label,
        align === 'left' && styles.left,
        inverse && styles.inverse,
      ]}
      tone="muted"
      variant="caption"
    >
      {compact ? `v${version}` : `Versão ${version}`}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
  inverse: {
    color: '#aab3ce',
  },
  left: {
    textAlign: 'left',
  },
});
