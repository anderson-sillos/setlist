import { useState, type CSSProperties } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { mobileStoreLinks } from '@/config/mobileStoreLinks';
import { colors, layout, radii, spacing } from '@/theme/tokens';

const badgeHeight = 44;

export function MobileAppDownloadLinks() {
  return (
    <View style={styles.section}>
      <AppText style={styles.heading} tone="muted" variant="caption">
        Baixe o Setlist no celular
      </AppText>
      <View style={styles.badges}>
        <StoreBadge
          accessibilityLabel="Baixar Setlist para iPhone e iPad na App Store"
          href={mobileStoreLinks.ios}
          source={require('../../../assets/store-badges/app-store-pt-br.svg')}
          width={badgeHeight * (119.66407 / 40)}
        />
        <StoreBadge
          accessibilityLabel="Baixar Setlist para Android na Google Play"
          href={mobileStoreLinks.android}
          source={require('../../../assets/store-badges/google-play-pt-br.svg')}
          width={badgeHeight * (238.96 / 70.87)}
        />
      </View>
    </View>
  );
}

function StoreBadge({
  accessibilityLabel,
  href,
  source,
  width,
}: {
  readonly accessibilityLabel: string;
  readonly href: string;
  readonly source: ImageSourcePropType;
  readonly width: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <a
      aria-label={accessibilityLabel}
      href={href}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      rel="noopener noreferrer"
      style={{
        ...linkStyle,
        borderColor: focused ? colors.border.focus : 'transparent',
      }}
      target="_blank"
    >
      <Image
        accessible={false}
        resizeMode="contain"
        source={source}
        style={{ height: badgeHeight, width }}
      />
    </a>
  );
}

const styles = StyleSheet.create({
  section: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: 460,
    width: '100%',
  },
  heading: {
    textAlign: 'center',
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
  },
});

const linkStyle: CSSProperties = {
  alignItems: 'center',
  borderRadius: radii.sm,
  borderStyle: 'solid',
  borderWidth: 2,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  minHeight: layout.minimumTouchTarget,
  padding: 2,
  textDecoration: 'none',
};
