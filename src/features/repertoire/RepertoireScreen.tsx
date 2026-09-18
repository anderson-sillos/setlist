import { Link } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import { StatusPill } from '@/components/ui/StatusPill';
import { useSongs } from '@/data/queries';
import type { EntityId, Song } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatSongDuration,
  lyricStatusLabels,
  normalizeForSearch,
} from '@/features/navigation/display';
import { getBandSectionHref, getSongHref } from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { colors, layout, radii, spacing } from '@/theme/tokens';

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
  return (
    <View style={styles.rowFrame}>
      <Link href={getSongHref(bandId, song.id)} asChild>
        <Pressable
          accessibilityLabel={`Abrir música ${song.title}`}
          accessibilityRole="link"
          style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
        >
          <View style={styles.rowLayout}>
            <View style={styles.rowContent}>
              <View style={styles.rowTitleLine}>
                <AppText style={styles.rowTitle} variant="heading">
                  {song.title}
                </AppText>
                <StatusPill
                  tone={
                    song.lyricStatus === 'synchronized'
                      ? 'ready'
                      : song.lyricStatus === 'missing'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {lyricStatusLabels[song.lyricStatus]}
                </StatusPill>
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
                  <AppIcon color={colors.violet} name="duration" size={12} />
                  <AppText style={styles.durationValue} tone="accent">
                    {song.estimatedDurationMs === null
                      ? '—'
                      : formatSongDuration(song.estimatedDurationMs)}
                  </AppText>
                </View>
              </View>
            </View>
            <View style={styles.rowNavigation}>
              <AppIcon color={colors.violet} name="forward" size={20} />
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
  const songsQuery = useSongs(bandId, true);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'repertoire', {
      filter: 'all' as RepertoireFilter,
      search: '',
      sort: 'title' as RepertoireSort,
    });
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
      fixedContent={
        <ListControls>
          <SearchField
            accessibilityLabel="Buscar música por título ou artista"
            onChangeText={(value) => update('search', value)}
            placeholder="Buscar música ou artista/banda"
            value={state.search}
          />
          <View style={styles.controlToolbarEnd}>
            <OptionMenu
              accessibilityLabel="Alterar filtros do repertório"
              compact
              label="Filtrar"
              onChange={(value) => update('filter', value)}
              options={repertoireFilters}
              value={state.filter}
            />
            <OptionMenu
              accessibilityLabel="Alterar ordenação do repertório"
              compact
              label="Ordenar"
              onChange={(value) => update('sort', value)}
              options={repertoireSorts}
              value={state.sort}
            />
          </View>
        </ListControls>
      }
      scrollable={false}
      title="Repertório"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {songsQuery.isPending ? <LoadingFeedback /> : null}
      {songsQuery.isError ? (
        <ErrorFeedback onRetry={() => void songsQuery.refetch()} />
      ) : null}
      <FlatList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        data={songs}
        keyExtractor={({ id }) => id}
        ListEmptyComponent={
          !songsQuery.isPending && !songsQuery.isError ? (
            <ListEmptyState
              actionLabel={hasQuery ? 'Limpar filtros' : undefined}
              message={
                hasQuery
                  ? 'Nem o roadie encontrou essa. Tente outra busca.'
                  : 'O palco está silencioso por aqui. Que tal adicionar a primeira música?'
              }
              onAction={hasQuery ? clearFilters : undefined}
              title={
                hasQuery ? 'Nenhuma música encontrada' : 'Repertório vazio'
              }
            />
          ) : null
        }
        onScroll={(event) =>
          rememberListScrollOffset(event, rememberScrollOffset)
        }
        renderItem={({ item }) => <SongRow bandId={bandId} song={item} />}
        scrollEventThrottle={120}
        showsVerticalScrollIndicator={false}
        testID="repertoire-list"
      />
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
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
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  listRow: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 82,
    padding: spacing.md,
  },
  rowLayout: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
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
