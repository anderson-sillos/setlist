import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radii } from '@/theme/tokens';

interface UserAvatarProps {
  readonly avatarUrl?: string | null;
  readonly displayName: string;
  readonly size?: number;
  readonly testID?: string;
}

function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase('pt-BR');
}

export function UserAvatar({
  avatarUrl,
  displayName,
  size = 40,
  testID = 'user-avatar',
}: UserAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const initials = getInitials(displayName);

  return (
    <View
      accessibilityLabel={`Avatar de ${displayName}`}
      accessibilityRole="image"
      style={[styles.avatar, { height: size, width: size }]}
      testID={testID}
    >
      {avatarUrl && failedAvatarUrl !== avatarUrl ? (
        <Image
          onError={() => setFailedAvatarUrl(avatarUrl)}
          resizeMode="cover"
          source={{ uri: avatarUrl }}
          style={[styles.image, { height: size, width: size }]}
          testID={`${testID}-image`}
        />
      ) : initials ? (
        <AppText
          style={{ fontSize: Math.max(12, Math.round(size * 0.34)) }}
          tone="accent"
          variant="caption"
        >
          {initials}
        </AppText>
      ) : (
        <AppIcon color={colors.violet} name="account" size={size * 0.52} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    flexShrink: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: radii.pill,
  },
});
