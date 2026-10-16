import { randomUUID } from 'expo-crypto';
import type {
  AppendRepertoireCollectionSongsInput,
  AppRepositories,
  Band,
  BandContext,
  BandMember,
  BandRepository,
  DeleteRepertoireCollectionInput,
  EntityId,
  RepertoireCollection,
  RepertoireCollectionRepository,
  RepertoireCollectionSong,
  SaveRepertoireCollectionInput,
  SetSongRepertoireCollectionsInput,
  Show,
  ShowRepository,
  ShowSummary,
  Song,
  SongListOptions,
  SongRepository,
  SongSummary,
  UserBandSummary,
  UserBand,
} from '@/domain';
import { getShowDurationMs } from '@/domain';

export interface InMemoryRepositoryData {
  readonly bands: readonly Band[];
  readonly bandMembers: readonly BandMember[];
  readonly repertoireCollections?: readonly RepertoireCollection[];
  readonly repertoireCollectionSongs?: readonly RepertoireCollectionSong[];
  readonly songs: readonly Song[];
  readonly shows: readonly Show[];
}

export interface InMemoryRepositoryOptions {
  readonly createId?: () => EntityId;
  readonly now?: () => string;
}

export class InMemoryBandRepository implements BandRepository {
  private readonly bands: readonly Band[];
  private readonly bandMembers: readonly BandMember[];
  private readonly shows: readonly Show[];
  private readonly songs: readonly Song[];

  constructor(
    bands: readonly Band[],
    bandMembers: readonly BandMember[],
    shows: readonly Show[] = [],
    songs: readonly Song[] = [],
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.bands = [...bands];
    this.bandMembers = [...bandMembers];
    this.shows = [...shows];
    this.songs = [...songs];
  }

  async getContext(
    userId: EntityId,
    bandId: EntityId,
  ): Promise<BandContext | null> {
    const membership = this.bandMembers.find(
      (candidate) => candidate.userId === userId && candidate.bandId === bandId,
    );
    const band = this.bands.find((candidate) => candidate.id === bandId);

    if (!membership || !band) {
      return null;
    }

    return {
      bandId,
      bandName: band.name,
      hasActiveSongs: this.songs.some(
        (song) => song.bandId === bandId && song.archivedAt === null,
      ),
      role: membership.role,
    };
  }

  async listUserSummaries(
    userId: EntityId,
  ): Promise<readonly UserBandSummary[]> {
    const now = Date.parse(this.now());
    const summaries = this.bands.flatMap((band) => {
      const membership = this.bandMembers.find(
        (candidate) =>
          candidate.userId === userId && candidate.bandId === band.id,
      );

      if (!membership) {
        return [];
      }

      const nextShowStartsAt = this.shows
        .filter(
          (show) =>
            show.bandId === band.id &&
            show.status !== 'cancelled' &&
            Date.parse(show.startsAt) >= now,
        )
        .sort((left, right) =>
          left.startsAt.localeCompare(right.startsAt),
        )[0]?.startsAt;

      return [
        {
          bandId: band.id,
          bandName: band.name,
          nextShowStartsAt: nextShowStartsAt ?? null,
          role: membership.role,
        },
      ];
    });

    return summaries.sort((left, right) =>
      left.bandName.localeCompare(right.bandName, 'pt-BR'),
    );
  }

  async listForUser(userId: EntityId): Promise<readonly UserBand[]> {
    const membershipsByBandId = new Map(
      this.bandMembers
        .filter((membership) => membership.userId === userId)
        .map((membership) => [membership.bandId, membership]),
    );

    return this.bands.flatMap((band) => {
      const membership = membershipsByBandId.get(band.id);

      return membership ? [{ band, membership }] : [];
    });
  }

  async findById(bandId: EntityId): Promise<Band | null> {
    return this.bands.find((band) => band.id === bandId) ?? null;
  }

  async listMembers(bandId: EntityId): Promise<readonly BandMember[]> {
    return this.bandMembers.filter((member) => member.bandId === bandId);
  }
}

export class InMemorySongRepository implements SongRepository {
  private readonly songs: readonly Song[];

  constructor(songs: readonly Song[]) {
    this.songs = [...songs];
  }

  async listSummariesByBandId(
    bandId: EntityId,
    options: SongListOptions = {},
  ): Promise<readonly SongSummary[]> {
    return this.songs
      .filter(
        (song) =>
          song.bandId === bandId &&
          (options.includeArchived === true || song.archivedAt === null),
      )
      .map(
        ({
          archivedAt,
          bandId: songBandId,
          bpm,
          createdAt,
          estimatedDurationMs,
          id,
          lyricStatus,
          musicalKey,
          originalArtist,
          title,
          updatedAt,
        }) => ({
          archivedAt,
          bandId: songBandId,
          bpm,
          createdAt,
          estimatedDurationMs,
          id,
          lyricStatus,
          musicalKey,
          originalArtist,
          title,
          updatedAt,
        }),
      );
  }

  async listDocumentsByIds(
    bandId: EntityId,
    songIds: readonly EntityId[],
  ): Promise<readonly Song[]> {
    const requestedIds = new Set(songIds);

    return this.songs.filter(
      (song) => song.bandId === bandId && requestedIds.has(song.id),
    );
  }

  async listByBandId(
    bandId: EntityId,
    options: SongListOptions = {},
  ): Promise<readonly Song[]> {
    return this.songs.filter(
      (song) =>
        song.bandId === bandId &&
        (options.includeArchived === true || song.archivedAt === null),
    );
  }

  async findById(bandId: EntityId, songId: EntityId): Promise<Song | null> {
    return (
      this.songs.find((song) => song.bandId === bandId && song.id === songId) ??
      null
    );
  }
}

export class InMemoryShowRepository implements ShowRepository {
  private readonly shows: readonly Show[];
  private readonly songsById: ReadonlyMap<EntityId, Song>;

  constructor(shows: readonly Show[], songs: readonly Song[] = []) {
    this.shows = [...shows];
    this.songsById = new Map(songs.map((song) => [song.id, song]));
  }

  async listSummariesByBandId(
    bandId: EntityId,
  ): Promise<readonly ShowSummary[]> {
    return this.shows
      .filter((show) => show.bandId === bandId)
      .map((show) => ({
        bandId: show.bandId,
        estimatedDurationMs: getShowDurationMs(show, this.songsById),
        id: show.id,
        name: show.name,
        startsAt: show.startsAt,
        status: show.status,
        venue: show.venue,
      }))
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  }

  async listByBandId(bandId: EntityId): Promise<readonly Show[]> {
    return this.shows.filter((show) => show.bandId === bandId);
  }

  async findById(bandId: EntityId, showId: EntityId): Promise<Show | null> {
    return (
      this.shows.find((show) => show.bandId === bandId && show.id === showId) ??
      null
    );
  }
}

export class InMemoryRepertoireCollectionRepository implements RepertoireCollectionRepository {
  private collections: RepertoireCollection[];
  private collectionSongs: RepertoireCollectionSong[];
  private previousTimestampMs = 0;

  constructor(
    collections: readonly RepertoireCollection[],
    collectionSongs: readonly RepertoireCollectionSong[],
    private readonly createId: () => EntityId = randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.collections = [...collections];
    this.collectionSongs = [...collectionSongs];
  }

  async listByBandId(
    bandId: EntityId,
  ): Promise<readonly RepertoireCollection[]> {
    return this.collections
      .filter((collection) => collection.bandId === bandId)
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }

  async listSongsByBandId(
    bandId: EntityId,
  ): Promise<readonly RepertoireCollectionSong[]> {
    return this.collectionSongs
      .filter((membership) => membership.bandId === bandId)
      .sort(
        (left, right) =>
          left.collectionId.localeCompare(right.collectionId) ||
          left.position - right.position,
      );
  }

  async findById(
    bandId: EntityId,
    collectionId: EntityId,
  ): Promise<RepertoireCollection | null> {
    return (
      this.collections.find(
        (collection) =>
          collection.bandId === bandId && collection.id === collectionId,
      ) ?? null
    );
  }

  async save(
    input: SaveRepertoireCollectionInput,
  ): Promise<RepertoireCollection> {
    const timestamp = this.nextTimestamp();
    let collection: RepertoireCollection;

    if (input.collectionId) {
      const existing = this.collections.find(
        (candidate) =>
          candidate.bandId === input.bandId &&
          candidate.id === input.collectionId,
      );
      if (!existing) {
        throw new Error('Coleção ausente no cenário em memória.');
      }

      collection = { ...existing, name: input.name, updatedAt: timestamp };
      this.collections = this.collections.map((candidate) =>
        candidate.bandId === input.bandId && candidate.id === collection.id
          ? collection
          : candidate,
      );
    } else {
      collection = {
        bandId: input.bandId,
        createdAt: timestamp,
        id: this.createId(),
        name: input.name,
        updatedAt: timestamp,
      };
      this.collections = [...this.collections, collection];
    }

    this.replaceCollectionSongs(
      input.bandId,
      collection.id,
      input.orderedSongIds,
    );

    return collection;
  }

  async appendSongs(
    input: AppendRepertoireCollectionSongsInput,
  ): Promise<RepertoireCollection> {
    const collection = this.collections.find(
      (candidate) =>
        candidate.bandId === input.bandId &&
        candidate.id === input.collectionId,
    );
    if (!collection) {
      throw new Error('Coleção ausente no cenário em memória.');
    }

    const existing = this.collectionSongs
      .filter(
        (membership) =>
          membership.bandId === input.bandId &&
          membership.collectionId === input.collectionId,
      )
      .sort((left, right) => left.position - right.position);
    const knownIds = new Set(existing.map(({ songId }) => songId));
    const newIds = input.songIds.filter((songId) => {
      if (knownIds.has(songId)) {
        return false;
      }
      knownIds.add(songId);
      return true;
    });
    if (newIds.length === 0) {
      return collection;
    }

    const updated = { ...collection, updatedAt: this.nextTimestamp() };
    this.collections = this.collections.map((candidate) =>
      candidate.bandId === input.bandId && candidate.id === input.collectionId
        ? updated
        : candidate,
    );
    this.replaceCollectionSongs(input.bandId, input.collectionId, [
      ...existing.map(({ songId }) => songId),
      ...newIds,
    ]);

    return updated;
  }

  async setSongCollections(
    input: SetSongRepertoireCollectionsInput,
  ): Promise<void> {
    const desiredIds = new Set(input.collectionIds);
    const currentIds = new Set(
      this.collectionSongs
        .filter(
          (membership) =>
            membership.bandId === input.bandId &&
            membership.songId === input.songId,
        )
        .map(({ collectionId }) => collectionId),
    );
    const affectedIds = new Set([...currentIds, ...desiredIds]);

    this.collectionSongs = this.collectionSongs.filter(
      (membership) =>
        membership.bandId !== input.bandId ||
        membership.songId !== input.songId ||
        desiredIds.has(membership.collectionId),
    );

    for (const collectionId of desiredIds) {
      const alreadyLinked = this.collectionSongs.some(
        (membership) =>
          membership.bandId === input.bandId &&
          membership.collectionId === collectionId &&
          membership.songId === input.songId,
      );
      if (alreadyLinked) {
        continue;
      }

      const nextPosition =
        this.collectionSongs
          .filter(
            (membership) =>
              membership.bandId === input.bandId &&
              membership.collectionId === collectionId,
          )
          .reduce(
            (maximum, membership) => Math.max(maximum, membership.position),
            -1,
          ) + 1;
      this.collectionSongs.push({
        bandId: input.bandId,
        collectionId,
        position: nextPosition,
        songId: input.songId,
      });
    }

    const timestamp = this.nextTimestamp();
    this.collections = this.collections.map((collection) =>
      collection.bandId === input.bandId && affectedIds.has(collection.id)
        ? { ...collection, updatedAt: timestamp }
        : collection,
    );
  }

  async delete(input: DeleteRepertoireCollectionInput): Promise<void> {
    this.collections = this.collections.filter(
      (candidate) =>
        candidate.bandId !== input.bandId ||
        candidate.id !== input.collectionId,
    );
    this.collectionSongs = this.collectionSongs.filter(
      (membership) =>
        membership.bandId !== input.bandId ||
        membership.collectionId !== input.collectionId,
    );
  }

  private replaceCollectionSongs(
    bandId: EntityId,
    collectionId: EntityId,
    orderedSongIds: readonly EntityId[],
  ) {
    this.collectionSongs = this.collectionSongs.filter(
      (membership) =>
        membership.bandId !== bandId ||
        membership.collectionId !== collectionId,
    );
    this.collectionSongs = [
      ...this.collectionSongs,
      ...orderedSongIds.map((songId, position) => ({
        bandId,
        collectionId,
        position,
        songId,
      })),
    ];
  }

  private nextTimestamp() {
    const requestedTimestamp = Date.parse(this.now());
    const timestamp = Math.max(
      requestedTimestamp,
      this.previousTimestampMs + 1,
    );
    this.previousTimestampMs = timestamp;
    return new Date(timestamp).toISOString();
  }
}

export function createInMemoryRepositories(
  data: InMemoryRepositoryData,
  options: InMemoryRepositoryOptions = {},
): AppRepositories {
  return {
    bands: new InMemoryBandRepository(
      data.bands,
      data.bandMembers,
      data.shows,
      data.songs,
      options.now,
    ),
    repertoireCollections: new InMemoryRepertoireCollectionRepository(
      data.repertoireCollections ?? [],
      data.repertoireCollectionSongs ?? [],
      options.createId,
      options.now,
    ),
    songs: new InMemorySongRepository(data.songs),
    shows: new InMemoryShowRepository(data.shows, data.songs),
  };
}
