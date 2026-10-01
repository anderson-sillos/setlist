import { Image, View } from 'react-native';

type AuthProvider = 'apple' | 'google';

interface AuthProviderIconProps {
  readonly provider: AuthProvider;
  readonly size?: number;
}

export function AuthProviderIcon({
  provider,
  size = 20,
}: AuthProviderIconProps) {
  const isGoogle = provider === 'google';
  const iconSlotSize = size * 1.75;
  const artworkSize = isGoogle ? size * 0.75 : iconSlotSize;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: 'center',
        height: size,
        justifyContent: 'center',
        overflow: 'visible',
        width: iconSlotSize,
      }}
    >
      <Image
        resizeMode="contain"
        source={
          isGoogle
            ? require('../../../assets/auth/google-g.png')
            : require('../../../assets/auth/apple-logo.png')
        }
        style={{ height: artworkSize, width: artworkSize }}
      />
    </View>
  );
}
