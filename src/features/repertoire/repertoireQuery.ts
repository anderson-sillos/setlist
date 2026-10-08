import type { EntityId, Song } from '@/domain';
import type { ChoiceOption } from '@/components/ui/ListControls';
import { normalizeForSearch } from '@/utils/text';

export type RepertoireFilter = 'all' | 'archived' | 'pending' | 'synchronized';
export type RepertoireSort = 'artist' | 'duration' | 'title' | 'updated';

export const repertoireFilters: readonly ChoiceOption<RepertoireFilter>[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Sincronizadas', value: 'synchronized' },
  { label: 'Arquivadas', value: 'archived' },
];

export const repertoireSorts: readonly ChoiceOption<RepertoireSort>[] = [
  { label: 'Título', value: 'title' },
  { label: 'Artista/Banda', value: 'artist' },
  { label: 'Atualizadas recentemente', value: 'updated' },
  { label: 'Maior duração', value: 'duration' },
];

export function filterAndSortRepertoireSongs(
  songs: readonly Song[],
  search: string,
  filter: RepertoireFilter,
  sort: RepertoireSort,
  collectionSongIds?: ReadonlySet<EntityId> | null,
): readonly Song[] {
  const normalizedSearch = normalizeForSearch(search);
  const result = songs.filter((song) => {
    const matchesSearch = normalizeForSearch(
      `${song.title} ${song.originalArtist ?? ''}`,
    ).includes(normalizedSearch);
    const matchesFilter =
      filter === 'archived'
        ? song.archivedAt !== null
        : song.archivedAt === null &&
          (filter === 'all' ||
            (filter === 'synchronized'
              ? song.lyricStatus === 'synchronized'
              : song.lyricStatus !== 'synchronized'));
    const matchesCollection =
      collectionSongIds === undefined ||
      collectionSongIds === null ||
      collectionSongIds.has(song.id);

    return matchesSearch && matchesFilter && matchesCollection;
  });

  return [...result].sort((left, right) => {
    if (sort === 'artist') {
      return (left.originalArtist ?? '').localeCompare(
        right.originalArtist ?? '',
        'pt-BR',
      );
    }
    if (sort === 'updated') {
      return right.updatedAt.localeCompare(left.updatedAt);
    }
    if (sort === 'duration') {
      return (
        (right.estimatedDurationMs ?? -1) - (left.estimatedDurationMs ?? -1)
      );
    }
    return left.title.localeCompare(right.title, 'pt-BR');
  });
}
