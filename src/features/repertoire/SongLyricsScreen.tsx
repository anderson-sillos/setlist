import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import {
  getListRefreshControl,
  WebRefreshButton,
} from '@/components/ui/ScreenDataRefresh';
import { useSong } from '@/data/queries';
import type { EntityId } from '@/domain';
import { getSongHref } from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';
import { SongLyricsContent } from './SongLyricsContent';

interface SongLyricsScreenProps {
  readonly bandId: EntityId;
  readonly songId: EntityId;
}

export function SongLyricsScreen({ bandId, songId }: SongLyricsScreenProps) {
  const songQuery = useSong(bandId, songId);
  const { onRefresh, refreshing } = useScreenDataRefresh([songQuery]);
  const song = songQuery.data;

  return (
    <SafeAreaView style={styles.safeArea} testID="song-lyrics-screen">
      <View style={styles.header}>
        <Link
          dismissTo
          href={getSongHref(bandId, songId)}
          onPress={blurWebFocus}
          asChild
        >
          <Pressable
            accessibilityLabel="Voltar para detalhes da música"
            accessibilityRole="link"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.text.primary} name="back" />
          </Pressable>
        </Link>
        <View style={styles.headerCopy}>
          <AppText tone="accent" variant="eyebrow">
            Letra em tela cheia
          </AppText>
          <AppText
            accessibilityRole="header"
            style={styles.title}
            tone="inverse"
            variant="heading"
          >
            {song?.title ?? 'Carregando música…'}
          </AppText>
          {song?.originalArtist ? (
            <AppText tone="muted" variant="caption">
              {song.originalArtist}
            </AppText>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={getListRefreshControl({ onRefresh, refreshing })}
      >
        <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
        {songQuery.isPending ? <LoadingFeedback /> : null}
        {songQuery.isError ? (
          <ErrorFeedback
            onRetry={() => {
              void songQuery.refetch();
            }}
            title="Letra indisponível"
          />
        ) : null}
        {!songQuery.isPending && !songQuery.isError && !song ? (
          <UnavailableFeedback title="Música indisponível" />
        ) : null}
        {song ? (
          <View style={styles.lyrics}>
            <SongLyricsContent lyrics={song.lyrics} variant="fullscreen" />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.canvas,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text.primary,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  lyrics: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  pressed: {
    opacity: 0.7,
  },
});
