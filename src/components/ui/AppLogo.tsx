import { Image, StyleSheet } from 'react-native';

interface AppLogoProps {
  readonly size: number;
}

export function AppLogo({ size }: AppLogoProps) {
  return (
    <Image
      accessibilityLabel="Logo do Setlist"
      accessibilityRole="image"
      resizeMode="cover"
      source={require('../../../assets/icons/app-icon-512.png')}
      style={[
        styles.logo,
        { borderRadius: size * 0.25, height: size, width: size },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
