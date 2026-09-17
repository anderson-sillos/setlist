import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface DemoActionNoticeProps {
  readonly message: string | null;
  readonly onClose: () => void;
}

export function DemoActionNotice({ message, onClose }: DemoActionNoticeProps) {
  return message ? (
    <View accessibilityLiveRegion="polite" style={styles.notice}>
      <AppText>{message}</AppText>
      <Pressable
        accessibilityLabel="Fechar aviso de demonstração"
        accessibilityRole="button"
        onPress={onClose}
      >
        <AppText tone="accent">Fechar</AppText>
      </Pressable>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
});
