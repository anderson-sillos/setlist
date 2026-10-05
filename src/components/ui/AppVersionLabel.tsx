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
      style={[styles.label, align === 'left' && styles.left]}
      tone={inverse ? 'muted' : 'subtle'}
      variant="version"
    >
      {compact ? `v${version}` : `Versão ${version}`}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',
  },
  left: {
    textAlign: 'left',
  },
});
