import { randomUUID } from 'expo-crypto';
import type {
  AppendRepertoireCollectionSongsInput,
  AppRepositories,
  Band,
  BandMember,
  BandRepository,
  DeleteRepertoireCollectionInput,
  EntityId,
  RepertoireCollection,
  RepertoireCollectionErrorCode,
  RepertoireCollectionRepository,
  RepertoireCollectionSong,
  SaveRepertoireCollectionInput,
  SetSongRepertoireCollectionsInput,
  Show,
  ShowRepository,
  Song,
  SongListOptions,
  SongRepository,
  UserBand,
} from '@/domain';
import { RepertoireCollectionError } from '@/domain';

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

  constructor(bands: readonly Band[], bandMembers: readonly BandMember[]) {
    this.bands = [...bands];
    this.bandMembers = [...bandMembers];
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

  constructor(shows: readonly Show[]) {
    this.shows = [...shows];
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
  private readonly songs: InMemoryRepositoryData['songs'];
  private previousTimestampMs = 0;

  constructor(
    collections: readonly RepertoireCollection[],
    collectionSongs: readonly RepertoireCollectionSong[],
    songs: InMemoryRepositoryData['songs'],
    private readonly createId: () => EntityId = randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.collections = [...collections];
    this.collectionSongs = [...collectionSongs];
    this.songs = [...songs];
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
    const name = this.normalizeName(input.name);
    this.assertUniqueName(input.bandId, name, input.collectionId);
    this.assertUniqueSongIds(input.orderedSongIds);
    this.assertSongsAvailable(input.bandId, input.orderedSongIds);

    const timestamp = this.nextTimestamp();
    let collection: RepertoireCollection;

    if (input.collectionId) {
      const existing = this.collections.find(
        (candidate) =>
          candidate.bandId === input.bandId &&
          candidate.id === input.collectionId,
      );
      if (!existing) {
        throw this.error('not_found');
      }
      if (
        !input.expectedUpdatedAt ||
        input.expectedUpdatedAt !== existing.updatedAt
      ) {
        throw this.error('stale_revision');
      }

      collection = {
        ...existing,
        name,
        updatedAt: timestamp,
      };
      this.collections = this.collections.map((candidate) =>
        candidate.id === collection.id && candidate.bandId === input.bandId
          ? collection
          : candidate,
      );
    } else {
      if (input.expectedUpdatedAt) {
        throw this.error('stale_revision');
      }
      collection = {
        bandId: input.bandId,
        createdAt: timestamp,
        id: this.createId(),
        name,
        updatedAt: timestamp,
      };
      this.collections = [...this.collections, collection];
    }

    this.collectionSongs = this.collectionSongs.filter(
      (membership) =>
        membership.collectionId !== collection.id ||
        membership.bandId !== input.bandId,
    );
    this.collectionSongs = [
      ...this.collectionSongs,
      ...input.orderedSongIds.map((songId, position) => ({
        bandId: input.bandId,
        collectionId: collection.id,
        songId,
        position,
      })),
    ];

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
      throw this.error('not_found');
    }
    this.assertUniqueSongIds(input.songIds);
    this.assertSongsAvailable(input.bandId, input.songIds);

    const existing = this.collectionSongs
      .filter(
        (membership) =>
          membership.bandId === input.bandId &&
          membership.collectionId === input.collectionId,
      )
      .sort((left, right) => left.position - right.position);
    const existingIds = new Set(existing.map(({ songId }) => songId));
    const newIds = input.songIds.filter((songId) => !existingIds.has(songId));

    if (newIds.length > 0) {
      const timestamp = this.nextTimestamp();
      const updatedCollection = { ...collection, updatedAt: timestamp };
      this.collections = this.collections.map((candidate) =>
        candidate.id === collection.id && candidate.bandId === input.bandId
          ? updatedCollection
          : candidate,
      );
      this.collectionSongs = this.collectionSongs.filter(
        (membership) =>
          membership.bandId !== input.bandId ||
          membership.collectionId !== input.collectionId,
      );
      this.collectionSongs = [
        ...this.collectionSongs,
        ...[...existing, ...newIds.map((songId) => ({ songId }))].map(
          (membership, position) => ({
            bandId: input.bandId,
            collectionId: input.collectionId,
            position,
            songId: membership.songId,
          }),
        ),
      ];
      return updatedCollection;
    }

    return collection;
  }

  async setSongCollections(
    input: SetSongRepertoireCollectionsInput,
  ): Promise<void> {
    this.assertSongsAvailable(input.bandId, [input.songId]);
    this.assertUniqueCollectionIds(input.collectionIds);

    const currentCollectionIds = this.collectionSongs
      .filter(
        (membership) =>
          membership.bandId === input.bandId &&
          membership.songId === input.songId,
      )
      .map(({ collectionId }) => collectionId);
    const affectedIds = [
      ...new Set([...currentCollectionIds, ...input.collectionIds]),
    ].sort();
    const collections = affectedIds.map((collectionId) =>
      this.collections.find(
        (candidate) =>
          candidate.bandId === input.bandId && candidate.id === collectionId,
      ),
    );

    if (collections.some((collection) => !collection)) {
      throw this.error('not_found');
    }
    if (
      Object.keys(input.expectedRevisions).length !== affectedIds.length ||
      collections.some(
        (collection) =>
          !collection ||
          input.expectedRevisions[collection.id] !== collection.updatedAt,
      )
    ) {
      throw this.error('stale_revision');
    }

    const desiredIds = new Set(input.collectionIds);
    this.collectionSongs = this.collectionSongs.filter(
      (membership) =>
        membership.bandId !== input.bandId ||
        membership.songId !== input.songId ||
        desiredIds.has(membership.collectionId),
    );

    for (const collectionId of input.collectionIds) {
      const existing = this.collectionSongs.some(
        (membership) =>
          membership.bandId === input.bandId &&
          membership.collectionId === collectionId &&
          membership.songId === input.songId,
      );
      if (existing) {
        continue;
      }
      const position = this.collectionSongs
        .filter(
          (membership) =>
            membership.bandId === input.bandId &&
            membership.collectionId === collectionId,
        )
        .reduce(
          (maximum, membership) => Math.max(maximum, membership.position),
          -1,
        );
      this.collectionSongs.push({
        bandId: input.bandId,
        collectionId,
        position: position + 1,
        songId: input.songId,
      });
    }

    const timestamp = this.nextTimestamp();
    const affectedSet = new Set(affectedIds);
    this.collections = this.collections.map((collection) =>
      collection.bandId === input.bandId && affectedSet.has(collection.id)
        ? { ...collection, updatedAt: timestamp }
        : collection,
    );
  }

  async delete(input: DeleteRepertoireCollectionInput): Promise<void> {
    const collection = this.collections.find(
      (candidate) =>
        candidate.bandId === input.bandId &&
        candidate.id === input.collectionId,
    );
    if (!collection) {
      throw this.error('not_found');
    }
    if (collection.updatedAt !== input.expectedUpdatedAt) {
      throw this.error('stale_revision');
    }

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

  private normalizeName(value: string) {
    const name = value.trim();
    if (Array.from(name).length < 1 || Array.from(name).length > 120) {
      throw this.error('invalid_name');
    }
    return name;
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

  private assertUniqueName(
    bandId: EntityId,
    name: string,
    exceptCollectionId?: EntityId,
  ) {
    const normalizedName = name.toLowerCase();
    if (
      this.collections.some(
        (collection) =>
          collection.bandId === bandId &&
          collection.id !== exceptCollectionId &&
          collection.name.trim().toLowerCase() === normalizedName,
      )
    ) {
      throw this.error('duplicate_name');
    }
  }

  private assertUniqueSongIds(songIds: readonly EntityId[]) {
    if (new Set(songIds).size !== songIds.length) {
      throw this.error('unavailable_song');
    }
  }

  private assertUniqueCollectionIds(collectionIds: readonly EntityId[]) {
    if (new Set(collectionIds).size !== collectionIds.length) {
      throw this.error('invalid_input');
    }
  }

  private assertSongsAvailable(bandId: EntityId, songIds: readonly EntityId[]) {
    if (
      songIds.some(
        (songId) =>
          !this.songs.some(
            (song) => song.bandId === bandId && song.id === songId,
          ),
      )
    ) {
      throw this.error('unavailable_song');
    }
  }

  private error(code: RepertoireCollectionErrorCode) {
    const messages: Record<RepertoireCollectionErrorCode, string> = {
      duplicate_name: 'Já existe uma coleção com esse nome nesta banda.',
      invalid_input: 'A seleção contém itens repetidos.',
      invalid_name: 'Informe um nome de até 120 caracteres.',
      not_found: 'A coleção não existe mais nesta banda.',
      permission_denied: 'Seu papel não permite alterar coleções desta banda.',
      request_failed: 'Não foi possível atualizar a coleção agora.',
      stale_revision:
        'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
      unavailable_song:
        'Uma ou mais músicas não estão disponíveis neste repertório.',
    };
    return new RepertoireCollectionError(code, messages[code]);
  }
}

export function createInMemoryRepositories(
  data: InMemoryRepositoryData,
  options: InMemoryRepositoryOptions = {},
): AppRepositories {
  return {
    bands: new InMemoryBandRepository(data.bands, data.bandMembers),
    repertoireCollections: new InMemoryRepertoireCollectionRepository(
      data.repertoireCollections ?? [],
      data.repertoireCollectionSongs ?? [],
      data.songs,
      options.createId,
      options.now,
    ),
    songs: new InMemorySongRepository(data.songs),
    shows: new InMemoryShowRepository(data.shows),
  };
}
