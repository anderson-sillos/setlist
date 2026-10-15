import type { AppRepositories, BandRole, EntityId, Show, Song } from '@/domain';
import { createInMemoryRepositories } from '@/data/in-memory';
import { createBand, createBandMember } from '@/testing/factories';

export interface BandScenario {
  readonly band: ReturnType<typeof createBand>;
  readonly currentUserId: EntityId;
  readonly membership: ReturnType<typeof createBandMember>;
  readonly repositories: AppRepositories;
}

export interface CreateBandScenarioInput {
  readonly bandId: EntityId;
  readonly userId: EntityId;
  readonly role: BandRole;
  readonly songs?: readonly Song[];
  readonly shows?: readonly Show[];
}

/** Creates an isolated band and membership with empty unrelated collections. */
export function createBandScenario({
  bandId,
  userId,
  role,
  songs = [],
  shows = [],
}: CreateBandScenarioInput): BandScenario {
  const band = createBand({ id: bandId });
  const membership = createBandMember({
    id: `membership-${bandId}-${userId}`,
    bandId,
    role,
    userId,
  });

  const repositories = createInMemoryRepositories({
    bands: [band],
    bandMembers: [membership],
    repertoireCollections: [],
    repertoireCollectionSongs: [],
    songs: [...songs],
    shows: [...shows],
  });

  return { band, currentUserId: userId, membership, repositories };
}
