import { getSupabaseClient } from '@/data/supabase/client';
import { isDemoBandId } from '@/data/demo';
import type {
  Band,
  BandMember,
  BandRepository,
  BandRole,
  EntityId,
  UserBand,
} from '@/domain';

type BandMemberRow = {
  readonly band_id: string;
  readonly id: string;
  readonly joined_at: string;
  readonly role: BandRole;
  readonly user_id: string;
};

type ProfileRow = {
  readonly avatar_url: string | null;
  readonly display_name: string | null;
  readonly email: string | null;
  readonly id: string;
};

const bandRoles: readonly BandRole[] = ['owner', 'editor', 'member'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Resposta inválida do Supabase: ${key}.`);
  }

  return value;
}

function readNullableString(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const value = row[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`Resposta inválida do Supabase: ${key}.`);
  }

  return value;
}

function readRole(row: Record<string, unknown>): BandRole {
  const value = row.role;

  if (typeof value !== 'string' || !bandRoles.includes(value as BandRole)) {
    throw new Error('Resposta inválida do Supabase: role.');
  }

  return value as BandRole;
}

function parseBand(value: unknown): Band {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: banda.');
  }

  return {
    createdAt: readString(value, 'created_at'),
    id: readString(value, 'id'),
    name: readString(value, 'name'),
    updatedAt: readString(value, 'updated_at'),
  };
}

function parseMembership(value: unknown): BandMemberRow {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: participação.');
  }

  return {
    band_id: readString(value, 'band_id'),
    id: readString(value, 'id'),
    joined_at: readString(value, 'joined_at'),
    role: readRole(value),
    user_id: readString(value, 'user_id'),
  };
}

function parseProfile(value: unknown): ProfileRow {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: perfil.');
  }

  return {
    avatar_url: readNullableString(value, 'avatar_url'),
    display_name: readNullableString(value, 'display_name'),
    email: readNullableString(value, 'email'),
    id: readString(value, 'id'),
  };
}

async function loadProfiles(
  userIds: readonly EntityId[],
): Promise<ReadonlyMap<EntityId, ProfileRow>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .in('id', userIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((profile) => {
      const parsedProfile = parseProfile(profile);

      return [parsedProfile.id, parsedProfile] as const;
    }),
  );
}

function toBandMember(
  membership: BandMemberRow,
  profiles: ReadonlyMap<EntityId, ProfileRow>,
): BandMember {
  const profile = profiles.get(membership.user_id);

  return {
    bandId: membership.band_id,
    avatarUrl: profile?.avatar_url ?? null,
    displayName: profile?.display_name ?? profile?.email ?? 'Usuário removido',
    id: membership.id,
    joinedAt: membership.joined_at,
    role: membership.role,
    userId: membership.user_id,
  };
}

export class SupabaseBandRepository implements BandRepository {
  constructor(
    private readonly demoRepository?: BandRepository,
    private readonly demoUserId?: EntityId,
  ) {}

  async listForUser(userId: EntityId): Promise<readonly UserBand[]> {
    const { data: membershipData, error: membershipError } =
      await getSupabaseClient()
        .from('band_members')
        .select('id, band_id, user_id, role, joined_at')
        .eq('user_id', userId);

    if (membershipError) {
      throw membershipError;
    }

    const memberships = (membershipData ?? []).map(parseMembership);
    const bandIds = memberships.map(({ band_id }) => band_id);

    if (bandIds.length === 0) {
      return this.demoRepository && this.demoUserId
        ? this.demoRepository.listForUser(this.demoUserId)
        : [];
    }

    const { data: bandData, error: bandError } = await getSupabaseClient()
      .from('bands')
      .select('id, name, created_at, updated_at')
      .in('id', bandIds);

    if (bandError) {
      throw bandError;
    }

    const bandsById = new Map(
      (bandData ?? []).map((band) => {
        const parsedBand = parseBand(band);

        return [parsedBand.id, parsedBand] as const;
      }),
    );
    const profiles = await loadProfiles([userId]);

    const remoteBands = memberships.flatMap((membership) => {
      const band = bandsById.get(membership.band_id);

      return band
        ? [
            {
              band,
              membership: toBandMember(membership, profiles),
            },
          ]
        : [];
    });

    if (!this.demoRepository || !this.demoUserId) {
      return remoteBands;
    }

    const demoBands = await this.demoRepository.listForUser(this.demoUserId);
    const remoteBandIds = new Set(remoteBands.map(({ band }) => band.id));

    return [
      ...remoteBands,
      ...demoBands.filter(({ band }) => !remoteBandIds.has(band.id)),
    ];
  }

  async findById(bandId: EntityId): Promise<Band | null> {
    if (isDemoBandId(bandId)) {
      return this.demoRepository?.findById(bandId) ?? null;
    }

    const { data, error } = await getSupabaseClient()
      .from('bands')
      .select('id, name, created_at, updated_at')
      .eq('id', bandId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return parseBand(data);
    }

    return this.demoRepository?.findById(bandId) ?? null;
  }

  async listMembers(bandId: EntityId): Promise<readonly BandMember[]> {
    if (isDemoBandId(bandId)) {
      return this.demoRepository?.listMembers(bandId) ?? [];
    }

    const { data, error } = await getSupabaseClient()
      .from('band_members')
      .select('id, band_id, user_id, role, joined_at')
      .eq('band_id', bandId);

    if (error) {
      throw error;
    }

    const memberships = (data ?? []).map(parseMembership);
    const profiles = await loadProfiles(
      memberships.map(({ user_id }) => user_id),
    );

    if (memberships.length > 0 || !this.demoRepository) {
      return memberships.map((membership) =>
        toBandMember(membership, profiles),
      );
    }

    return this.demoRepository.listMembers(bandId);
  }
}

export function createSupabaseBandRepository(
  demoRepository?: BandRepository,
  demoUserId?: EntityId,
): BandRepository {
  return new SupabaseBandRepository(demoRepository, demoUserId);
}
