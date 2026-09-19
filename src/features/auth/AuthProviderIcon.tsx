import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type AuthProvider = 'apple' | 'google';

interface AuthProviderIconProps {
  readonly provider: AuthProvider;
  readonly size?: number;
}

export function AuthProviderIcon({
  provider,
  size = 20,
}: AuthProviderIconProps) {
  return provider === 'google' ? (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="M21.35 12.1c0-.78-.07-1.53-.2-2.25H12v4.26h5.24c-.23 1.37-1.1 2.53-2.34 3.31v2.74h3.77c2.2-2.02 3.48-5 3.48-8.06Z"
          fill="#4285F4"
        />
        <Path
          d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.77-2.74c-1.03.69-2.35 1.1-3.78 1.1-2.91 0-5.38-1.97-6.27-4.62H.72v2.82C2.32 18.99 6.81 21.5 12 21.5Z"
          fill="#34A853"
        />
        <Path
          d="M3.73 12.89c-.23-.69-.36-1.43-.36-2.19s.13-1.5.36-2.19V5.69H.72C.26 6.6 0 7.63 0 8.7s.26 2.1.72 3.01l3.01 2.18Z"
          fill="#FBBC05"
        />
        <Path
          d="M12 4.08c1.51 0 2.86.52 3.92 1.54l2.94-2.94C16.83 1.08 14.63.1 12 .1 6.81.1 2.32 2.61.72 6.5l3.01 2.82C6.62 6.05 9.09 4.08 12 4.08Z"
          fill="#EA4335"
        />
      </Svg>
    </View>
  ) : (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.1.8 1.21-.25 2.37-.93 3.66-.84 1.55.12 2.72.74 3.5 1.86-3.2 1.92-2.44 6.14.5 7.32-.59 1.55-1.36 3.04-2.76 3.83ZM12.05 7.21C11.9 4.9 13.77 3 15.86 2.82c.29 2.66-2.41 4.66-3.81 4.39Z"
          fill="#172033"
        />
      </Svg>
    </View>
  );
}
