import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { useShows, useSongs } from '@/data/queries';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getShowDurationMs } from '@/features/navigation/display';
import { getBandSectionHref, getStageHref } from '@/features/navigation/routes';
import type { BandSectionScreenProps } from '@/features/navigation/screenTypes';
import { ShowListRow } from '@/features/shows/ShowListRow';
import { spacing } from '@/theme/tokens';

export function StageHubScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const showsQuery = useShows(bandId);
  const songsQuery = useSongs(bandId, true);
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const shows = useMemo(
    () =>
      [...(showsQuery.data ?? [])]
        .filter((show) => show.status !== 'cancelled')
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    [showsQuery.data],
  );

  return (
    <BandAreaLayout
      activeSection="stage"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'stage') as string}
      scrollable={false}
      title="Modo palco"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {showsQuery.isPending || songsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {showsQuery.isError || songsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showsQuery.refetch();
            void songsQuery.refetch();
          }}
        />
      ) : null}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={shows}
        keyExtractor={({ id }) => id}
        ListEmptyComponent={
          !showsQuery.isPending &&
          !songsQuery.isPending &&
          !showsQuery.isError &&
          !songsQuery.isError ? (
            <ListEmptyState
              message="Ainda não há show disponível para abrir no palco."
              title="Palco aguardando o bis"
            />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.stageIntro}>
            <AppText variant="heading">Escolha um show</AppText>
            <AppText tone="muted">
              Esta é a entrada para a prévia atual. A experiência completa do
              modo palco será refinada em uma etapa futura.
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <ShowListRow
            accessibilityLabel={`Abrir ${item.name} no modo palco`}
            durationMs={getShowDurationMs(item, songsById)}
            href={getStageHref(bandId, item.id)}
            show={item}
          />
        )}
        showsVerticalScrollIndicator={false}
        testID="stage-shows-list"
      />
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  stageIntro: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
