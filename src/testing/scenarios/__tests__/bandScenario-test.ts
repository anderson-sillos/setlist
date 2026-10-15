import { createBandScenario } from '@/testing/scenarios';

describe('createBandScenario', () => {
  it('returns an isolated band, membership, and empty repositories by default', async () => {
    const first = createBandScenario({
      bandId: 'band-one',
      role: 'owner',
      userId: 'user-one',
    });
    const second = createBandScenario({
      bandId: 'band-two',
      role: 'editor',
      userId: 'user-two',
    });

    expect(first.band.id).toBe('band-one');
    expect(first.membership).toMatchObject({
      bandId: first.band.id,
      id: 'membership-band-one-user-one',
      role: 'owner',
      userId: first.currentUserId,
    });
    expect(first.band.createdAt).toBe('2026-01-01T12:00:00.000Z');
    expect(first.repositories).not.toBe(second.repositories);
    await expect(
      first.repositories.songs.listByBandId(first.band.id),
    ).resolves.toEqual([]);
    await expect(
      first.repositories.shows.listByBandId(first.band.id),
    ).resolves.toEqual([]);
    await expect(
      first.repositories.repertoireCollections.listByBandId(first.band.id),
    ).resolves.toEqual([]);
  });
});
