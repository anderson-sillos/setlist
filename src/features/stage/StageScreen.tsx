import { Link } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useShow, useSongs } from '@/data/queries';
import type { EntityId, Show, ShowSongSetlistItem, Song } from '@/domain';
import { getShowHref } from '@/features/navigation/routes';
import {
  formatElapsedTime,
  useManualTimer,
} from '@/features/stage/useManualTimer';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';

interface StageScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
  readonly viewportWidth?: number;
}

interface StageItem {
  readonly blockName: string;
  readonly item: ShowSongSetlistItem;
  readonly song: Song | null;
}

export function buildStageItems(
  show: Show,
  songs: readonly Song[],
): readonly StageItem[] {
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return show.blocks.flatMap((block) =>
    block.items.flatMap((item) =>
      item.type === 'song'
        ? [
            {
              blockName: block.name,
              item,
              song: songsById.get(item.songId) ?? null,
            },
          ]
        : [],
    ),
  );
}

export function StageScreen({
  bandId,
  showId,
  viewportWidth,
}: StageScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const timer = useManualTimer();
  const show = showQuery.data;
  const stageItems = show ? buildStageItems(show, songsQuery.data ?? []) : [];
  const staticItemIndex = stageItems.findIndex(
    ({ song }) => song?.lyricStatus === 'static',
  );
  const currentItem = stageItems[staticItemIndex >= 0 ? staticItemIndex : 0];
  const timerActionLabel =
    timer.status === 'running'
      ? 'Pausar'
      : timer.status === 'paused'
        ? 'Retomar'
        : 'Iniciar';

  return (
    <Screen testID="stage-screen">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText tone="accent" variant="eyebrow">
            Modo palco · demonstração local
          </AppText>
          <AppText accessibilityRole="header" variant="title">
            {show?.name ?? 'Carregando show…'}
          </AppText>
        </View>
        <Link href={getShowHref(bandId, showId)} asChild>
          <Pressable
            accessibilityLabel="Sair do modo palco"
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.exitButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="accent">Sair</AppText>
          </Pressable>
        </Link>
      </View>

      {showQuery.isPending || songsQuery.isPending ? (
        <LoadingFeedback variation={1} />
      ) : null}

      {showQuery.isError || songsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showQuery.refetch();
            void songsQuery.refetch();
          }}
          title="Modo palco indisponível"
        />
      ) : null}

      {show?.status === 'cancelled' ? (
        <UnavailableFeedback
          messageKey="show-cancelled"
          title="Show cancelado"
        />
      ) : null}

      {show && show.status !== 'cancelled' && currentItem ? (
        <View
          style={[
            styles.stageContent,
            layoutMode !== 'phone' && styles.stageContentWide,
          ]}
          testID={`stage-layout-${layoutMode}`}
        >
          <View style={styles.mainColumn}>
            <Card style={styles.timerCard} tone="dark">
              <AppText tone="inverse" variant="eyebrow">
                Cronômetro independente neste aparelho
              </AppText>
              <AppText
                accessibilityLabel={`Tempo decorrido ${formatElapsedTime(timer.elapsedMs)}`}
                style={styles.timer}
                testID="elapsed-time"
                tone="inverse"
              >
                {formatElapsedTime(timer.elapsedMs)}
              </AppText>
              <View style={styles.timerActions}>
                <AppButton
                  label={timerActionLabel}
                  onPress={
                    timer.status === 'running' ? timer.pause : timer.start
                  }
                  style={styles.timerButton}
                />
                <AppButton
                  label="Reiniciar"
                  onPress={timer.reset}
                  style={styles.timerButton}
                  variant="secondary"
                />
              </View>
            </Card>

            <Card style={styles.lyricCard} tone="dark">
              <AppText tone="inverse" variant="eyebrow">
                Letra estática · leitura manual
              </AppText>
              <AppText tone="inverse" variant="title">
                {currentItem.song?.title ?? 'Música indisponível'}
              </AppText>
              {currentItem.song?.lyrics.blocks.length ? (
                currentItem.song.lyrics.blocks.map((block) => (
                  <View key={block.id} style={styles.lyricBlock}>
                    {block.name ? (
                      <AppText tone="inverse" variant="caption">
                        {block.name}
                      </AppText>
                    ) : null}
                    {block.lines.map((line) => (
                      <AppText
                        key={line.id}
                        style={styles.lyricLine}
                        tone="inverse"
                      >
                        {line.text}
                      </AppText>
                    ))}
                  </View>
                ))
              ) : (
                <AppText tone="inverse">Sem letra cadastrada</AppText>
              )}
            </Card>
          </View>

          <Card style={styles.setlistCard}>
            <AppText tone="accent" variant="eyebrow">
              Setlist
            </AppText>
            {stageItems.map((stageItem, index) => {
              const isCurrent = stageItem.item.id === currentItem.item.id;

              return (
                <View
                  key={stageItem.item.id}
                  style={[
                    styles.setlistItem,
                    isCurrent && styles.setlistItemCurrent,
                  ]}
                >
                  <AppText style={styles.itemNumber} tone="muted">
                    {index + 1}.
                  </AppText>
                  <View style={styles.itemCopy}>
                    <AppText>
                      {stageItem.song?.title ?? 'Música indisponível'}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {stageItem.blockName}
                      {isCurrent ? ' · atual' : ''}
                    </AppText>
                    {stageItem.item.notes ? (
                      <AppText tone="accent" variant="caption">
                        {stageItem.item.notes}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220,
  },
  exitButton: {
    borderColor: colors.violet,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stageContent: {
    gap: spacing.lg,
  },
  stageContentWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  mainColumn: {
    flex: 1.6,
    gap: spacing.lg,
    minWidth: 0,
  },
  timerCard: {
    gap: spacing.md,
  },
  timer: {
    fontSize: 56,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 64,
  },
  timerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timerButton: {
    flex: 1,
    minWidth: 130,
  },
  lyricCard: {
    gap: spacing.xl,
  },
  lyricBlock: {
    gap: spacing.sm,
  },
  lyricLine: {
    fontSize: 22,
    lineHeight: 32,
  },
  setlistCard: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  setlistItem: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  setlistItemCurrent: {
    backgroundColor: colors.cyanSoft,
  },
  itemNumber: {
    width: 24,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
