import type {
  AppRepositories,
  Band,
  BandMember,
  BandRepository,
  EntityId,
  Show,
  ShowRepository,
  Song,
  SongListOptions,
  SongRepository,
  UserBand,
} from '@/domain';

export interface InMemoryRepositoryData {
  readonly bands: readonly Band[];
  readonly bandMembers: readonly BandMember[];
  readonly songs: readonly Song[];
  readonly shows: readonly Show[];
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

export function createInMemoryRepositories(
  data: InMemoryRepositoryData,
): AppRepositories {
  return {
    bands: new InMemoryBandRepository(data.bands, data.bandMembers),
    songs: new InMemorySongRepository(data.songs),
    shows: new InMemoryShowRepository(data.shows),
  };
}
