import type { Band, BandMember } from '@/domain';

const DEFAULT_TIMESTAMP = '2026-01-01T12:00:00.000Z';

export function createBand(overrides: Partial<Band> = {}): Band {
  return {
    id: 'band-test',
    name: 'Banda de teste',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createBandMember(
  overrides: Partial<BandMember> = {},
): BandMember {
  return {
    id: 'membership-test',
    bandId: 'band-test',
    userId: 'user-test',
    displayName: 'Integrante de teste',
    role: 'member',
    joinedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}
