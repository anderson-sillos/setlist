import type {
  Band,
  BandMember,
  EntityId,
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

export interface AppRepositories {
  readonly bands: BandRepository;
  readonly songs: SongRepository;
  readonly shows: ShowRepository;
}
