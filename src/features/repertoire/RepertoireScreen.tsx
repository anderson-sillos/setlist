import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ContentFade } from '@/components/ui/ContentFade';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  getListRefreshControl,
  WebRefreshButton,
} from '@/components/ui/ScreenDataRefresh';
import { ListControlsOverlay } from '@/components/ui/ListControlsOverlay';
import {
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import { StatusPill } from '@/components/ui/StatusPill';
import { useSongs, useUserBands } from '@/data/queries';
import type { EntityId, Song } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getSongCreateHref,
  getSongHref,
} from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useScrollDirectionVisibility } from '@/hooks/useScrollDirectionVisibility';
import {
  getContentHorizontalPadding,
  getNavigationPresentation,
} from '@/theme/responsive';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatSongDuration } from '@/utils/duration';
import { normalizeForSearch } from '@/utils/text';
import { blurWebFocus } from '@/utils/focus';
import {
  lyricStatusIcons,
  lyricStatusLabels,
  lyricStatusTones,
} from './songPresentation';

type RepertoireFilter = 'all' | 'archived' | 'pending' | 'synchronized';
type RepertoireSort = 'artist' | 'duration' | 'title' | 'updated';

const repertoireFilters = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Sincronizadas', value: 'synchronized' },
  { label: 'Arquivadas', value: 'archived' },
] as const;

const repertoireSorts = [
  { label: 'Título', value: 'title' },
  { label: 'Artista/Banda', value: 'artist' },
  { label: 'Atualizadas recentemente', value: 'updated' },
  { label: 'Maior duração', value: 'duration' },
] as const;

function SongRow({ bandId, song }: { bandId: EntityId; song: Song }) {
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.rowFrame}>
      <Link href={getSongHref(bandId, song.id)} onPress={blurWebFocus} asChild>
        <Pressable
          accessibilityLabel={`Abrir música ${song.title}. Status da letra: ${lyricStatusLabels[song.lyricStatus]}`}
          accessibilityRole="link"
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={StyleSheet.flatten([
            styles.listRow,
            pressed && styles.pressed,
          ])}
        >
          <View style={styles.rowLayout}>
            <View style={styles.rowPrimaryContent}>
              <View style={styles.rowLeadingIcon}>
                <AppIcon color={colors.text.secondary} name="music" size={40} />
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowTitleLine}>
                  <AppText style={styles.rowTitle} variant="heading">
                    {song.title}
                  </AppText>
                  <StatusPill
                    accessible={false}
                    accessibilityLabel={`Status da letra: ${lyricStatusLabels[song.lyricStatus]}`}
                    icon={lyricStatusIcons[song.lyricStatus]}
                    tone={lyricStatusTones[song.lyricStatus]}
                  />
                </View>
                <View style={styles.rowMetaLine}>
                  <AppText
                    numberOfLines={1}
                    style={styles.rowArtist}
                    tone="muted"
                  >
                    {song.originalArtist ?? 'Artista/Banda não informado'}
                  </AppText>
                  <View
                    accessibilityLabel={`Duração ${
                      song.estimatedDurationMs === null
                        ? 'não informada'
                        : formatSongDuration(song.estimatedDurationMs)
                    }`}
                    style={styles.durationMeta}
                  >
                    <AppIcon
                      color={colors.text.secondary}
                      name="duration"
                      size={12}
                    />
                    <AppText style={styles.durationValue} tone="accent">
                      {song.estimatedDurationMs === null
                        ? '—'
                        : formatSongDuration(song.estimatedDurationMs)}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.rowNavigation}>
              <AppIcon color={colors.text.secondary} name="forward" size={20} />
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

export function RepertoireScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const window = useWindowDimensions();
  const usesBottomNavigation =
    getNavigationPresentation(
      viewportWidth ?? window.width,
      viewportHeight ?? window.height,
    ) === 'bottom-tabs';
  const horizontalPadding = getContentHorizontalPadding(
    viewportWidth ?? window.width,
  );
  const router = useRouter();
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    songsQuery,
    userBandsQuery,
  ]);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'repertoire', {
      filter: 'all' as RepertoireFilter,
      search: '',
      sort: 'title' as RepertoireSort,
    });
  const {
    updateVisibility: updateControlsVisibility,
    visible: controlsVisible,
  } = useScrollDirectionVisibility(initialScrollOffset);
  const [controlsOverlayHeight, setControlsOverlayHeight] = useState(
    spacing.sm * 3 + layout.minimumTouchTarget * 2 + 1,
  );
  const normalizedSearch = normalizeForSearch(state.search);
  const songs = useMemo(() => {
    const result = (songsQuery.data ?? []).filter((song) => {
      const matchesSearch = normalizeForSearch(
        `${song.title} ${song.originalArtist ?? ''}`,
      ).includes(normalizedSearch);
      const matchesFilter =
        state.filter === 'archived'
          ? song.archivedAt !== null
          : song.archivedAt === null &&
            (state.filter === 'all' ||
              (state.filter === 'synchronized'
                ? song.lyricStatus === 'synchronized'
                : song.lyricStatus !== 'synchronized'));

      return matchesSearch && matchesFilter;
    });

    return [...result].sort((left, right) => {
      if (state.sort === 'artist') {
        return (left.originalArtist ?? '').localeCompare(
          right.originalArtist ?? '',
          'pt-BR',
        );
      }
      if (state.sort === 'updated') {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      if (state.sort === 'duration') {
        return (
          (right.estimatedDurationMs ?? -1) - (left.estimatedDurationMs ?? -1)
        );
      }
      return left.title.localeCompare(right.title, 'pt-BR');
    });
  }, [normalizedSearch, songsQuery.data, state]);
  const hasQuery = state.search.length > 0 || state.filter !== 'all';
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canCreate =
    membership?.role === 'owner' || membership?.role === 'editor';
  const hasRegisteredSongs = (songsQuery.data?.length ?? 0) > 0;
  const isFirstSongEmptyState = !hasQuery && !hasRegisteredSongs;
  const clearFilters = () => {
    update('search', '');
    update('filter', 'all');
    update('sort', 'title');
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'repertoire') as string}
      headerAction={
        canCreate
          ? {
              accessibilityLabel: 'Adicionar música ao repertório',
              icon: 'musicAdd',
              label: 'Adicionar música',
              onPress: () => router.push(getSongCreateHref(bandId)),
            }
          : undefined
      }
      scrollable={false}
      title="Repertório"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {songsQuery.isPending || userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {songsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      <ContentFade
        loading={songsQuery.isPending || userBandsQuery.isPending}
        style={styles.listArea}
      >
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            usesBottomNavigation && styles.listContentWithBottomNavigation,
          ]}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          data={songs}
          keyExtractor={({ id }) => id}
          ListEmptyComponent={
            !songsQuery.isPending &&
            !songsQuery.isError &&
            !userBandsQuery.isPending &&
            !userBandsQuery.isError ? (
              <ListEmptyState
                actionIcon={
                  !hasQuery && isFirstSongEmptyState && canCreate
                    ? 'musicAdd'
                    : undefined
                }
                actionLabel={
                  hasQuery
                    ? 'Limpar filtros'
                    : isFirstSongEmptyState && canCreate
                      ? 'Adicionar música'
                      : undefined
                }
                message={
                  hasQuery
                    ? 'Nem o roadie encontrou essa. Tente outra busca.'
                    : isFirstSongEmptyState
                      ? canCreate
                        ? 'Cadastre a primeira música da banda para começar o repertório e preparar os shows.'
                        : 'Peça a um proprietário ou editor da banda para cadastrar a primeira música do repertório.'
                      : 'O palco está silencioso por aqui.'
                }
                onAction={
                  hasQuery
                    ? clearFilters
                    : isFirstSongEmptyState && canCreate
                      ? () => router.push(getSongCreateHref(bandId))
                      : undefined
                }
                title={
                  hasQuery
                    ? 'Nenhuma música encontrada'
                    : isFirstSongEmptyState
                      ? 'Comece pelo repertório'
                      : 'Repertório vazio'
                }
              />
            ) : null
          }
          ListHeaderComponent={
            <View style={{ height: controlsOverlayHeight }} />
          }
          onScroll={(event) => {
            updateControlsVisibility(event.nativeEvent.contentOffset.y);
            rememberListScrollOffset(event, rememberScrollOffset);
          }}
          refreshControl={getListRefreshControl({
            onRefresh,
            progressViewOffset: controlsOverlayHeight,
            refreshing,
          })}
          renderItem={({ item }) => <SongRow bandId={bandId} song={item} />}
          scrollEventThrottle={120}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          testID="repertoire-list"
        />
        <ListControlsOverlay
          horizontalPadding={horizontalPadding}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            setControlsOverlayHeight((current) =>
              current === nextHeight ? current : nextHeight,
            );
          }}
        >
          <ListControls>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchField
                  accessibilityLabel="Buscar música por título ou artista"
                  onChangeText={(value) => update('search', value)}
                  placeholder="Buscar música ou artista/banda"
                  value={state.search}
                />
              </View>
              <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
            </View>
            {controlsVisible ? (
              <View style={styles.controlToolbarEnd}>
                <OptionMenu
                  active={state.filter !== 'all'}
                  accessibilityLabel="Alterar filtros do repertório"
                  compact
                  icon="filter"
                  label="Filtrar"
                  onChange={(value) => update('filter', value)}
                  options={repertoireFilters}
                  value={state.filter}
                />
                <OptionMenu
                  active={state.sort !== 'title'}
                  accessibilityLabel="Alterar ordenação do repertório"
                  compact
                  icon="sort"
                  label="Ordenar"
                  onChange={(value) => update('sort', value)}
                  options={repertoireSorts}
                  value={state.sort}
                />
              </View>
            ) : null}
          </ListControls>
        </ListControlsOverlay>
      </ContentFade>
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  listArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  searchField: {
    flex: 1,
    minWidth: 0,
  },
  controlToolbarEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  listContentWithBottomNavigation: {
    paddingBottom: spacing.xxxl + layout.minimumTouchTarget,
  },
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  listRow: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 84,
    padding: spacing.md,
  },
  rowLayout: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
  },
  rowPrimaryContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  rowLeadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 48,
  },
  rowContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowTitle: {
    flexShrink: 1,
  },
  rowMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  rowArtist: {
    flex: 1,
    minWidth: 0,
  },
  rowNavigation: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 20,
  },
  durationValue: {
    fontVariant: ['tabular-nums'],
  },
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
});
