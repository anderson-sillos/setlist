import { Pressable, StyleSheet } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, layout, radii } from '@/theme/tokens';

interface NavigationIconButtonProps {
  readonly accessibilityLabel: string;
  readonly color?: string;
  readonly icon: AppIconName;
  readonly onPress: () => void;
}

export function NavigationIconButton({
  accessibilityLabel,
  color = colors.ink,
  icon,
  onPress,
}: NavigationIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppIcon color={color} name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  pressed: {
    opacity: 0.7,
  },
});
