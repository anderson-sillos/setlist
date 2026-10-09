import type {
  Band,
  BandMember,
  EntityId,
  IsoDateTime,
  RepertoireCollection,
  RepertoireCollectionSong,
  Show,
  Song,
  UserBand,
} from '@/domain/entities';

export interface BandRepository {
  listForUser(userId: EntityId): Promise<readonly UserBand[]>;
  findById(bandId: EntityId): Promise<Band | null>;
  listMembers(bandId: EntityId): Promise<readonly BandMember[]>;
}

export interface SongListOptions {
  readonly includeArchived?: boolean;
}

export interface SongRepository {
  listByBandId(
    bandId: EntityId,
    options?: SongListOptions,
  ): Promise<readonly Song[]>;
  findById(bandId: EntityId, songId: EntityId): Promise<Song | null>;
}

export interface ShowRepository {
  listByBandId(bandId: EntityId): Promise<readonly Show[]>;
  findById(bandId: EntityId, showId: EntityId): Promise<Show | null>;
}

export interface SaveRepertoireCollectionInput {
  readonly bandId: EntityId;
  readonly collectionId?: EntityId;
  readonly name: string;
  readonly orderedSongIds: readonly EntityId[];
  readonly expectedUpdatedAt?: IsoDateTime | null;
}

export interface AppendRepertoireCollectionSongsInput {
  readonly bandId: EntityId;
  readonly collectionId: EntityId;
  readonly songIds: readonly EntityId[];
}

export interface SetSongRepertoireCollectionsInput {
  readonly bandId: EntityId;
  readonly songId: EntityId;
  readonly collectionIds: readonly EntityId[];
  readonly expectedRevisions: Readonly<Record<EntityId, IsoDateTime>>;
}

export interface DeleteRepertoireCollectionInput {
  readonly bandId: EntityId;
  readonly collectionId: EntityId;
  readonly expectedUpdatedAt: IsoDateTime;
}

export interface RepertoireCollectionRepository {
  listByBandId(bandId: EntityId): Promise<readonly RepertoireCollection[]>;
  listSongsByBandId(
    bandId: EntityId,
  ): Promise<readonly RepertoireCollectionSong[]>;
  findById(
    bandId: EntityId,
    collectionId: EntityId,
  ): Promise<RepertoireCollection | null>;
  save(input: SaveRepertoireCollectionInput): Promise<RepertoireCollection>;
  appendSongs(
    input: AppendRepertoireCollectionSongsInput,
  ): Promise<RepertoireCollection>;
  setSongCollections(input: SetSongRepertoireCollectionsInput): Promise<void>;
  delete(input: DeleteRepertoireCollectionInput): Promise<void>;
}

export interface AppRepositories {
  readonly bands: BandRepository;
  readonly repertoireCollections: RepertoireCollectionRepository;
  readonly songs: SongRepository;
  readonly shows: ShowRepository;
}
