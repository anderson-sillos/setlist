import type { EntityId, SongListOptions } from '@/domain';

export const queryKeys = {
  bands: {
    all: ['bands'] as const,
    byId: (bandId: EntityId) => ['bands', bandId] as const,
    contextByBand: (bandId: EntityId) => ['bands', bandId, 'context'] as const,
    context: (userId: EntityId, bandId: EntityId) =>
      ['bands', bandId, 'context', userId] as const,
    invitations: (bandId: EntityId) =>
      ['bands', bandId, 'invitations'] as const,
    members: (bandId: EntityId) => ['bands', bandId, 'members'] as const,
    termAcceptance: (bandId: EntityId, userId: EntityId, termVersion: string) =>
      ['bands', bandId, 'term-acceptance', userId, termVersion] as const,
    user: (userId: EntityId) => ['bands', 'user', userId] as const,
    userPrefix: () => ['bands', 'user'] as const,
    userSummaries: (userId: EntityId) =>
      ['bands', 'user', userId, 'summaries'] as const,
  },
  repertoireCollections: {
    byBand: (bandId: EntityId) =>
      ['bands', bandId, 'repertoire-collections'] as const,
    membershipsByBand: (bandId: EntityId) =>
      ['bands', bandId, 'repertoire-collections', 'song-links'] as const,
    recordsByBand: (bandId: EntityId) =>
      ['bands', bandId, 'repertoire-collections', 'items'] as const,
  },
  shows: {
    byBand: (bandId: EntityId) => ['bands', bandId, 'shows'] as const,
    byId: (bandId: EntityId, showId: EntityId) =>
      ['bands', bandId, 'shows', showId] as const,
    summariesByBand: (bandId: EntityId) =>
      ['bands', bandId, 'show-summaries'] as const,
  },
  songs: {
    documentsByBand: (bandId: EntityId, options: SongListOptions = {}) =>
      [
        'bands',
        bandId,
        'songs',
        { includeArchived: Boolean(options.includeArchived) },
      ] as const,
    documentById: (bandId: EntityId, songId: EntityId) =>
      ['bands', bandId, 'songs', songId] as const,
    summariesByBand: (bandId: EntityId, options: SongListOptions = {}) =>
      [
        'bands',
        bandId,
        'song-summaries',
        { includeArchived: Boolean(options.includeArchived) },
      ] as const,
    summariesPrefixByBand: (bandId: EntityId) =>
      ['bands', bandId, 'song-summaries'] as const,
    summariesForUser: (userId: EntityId) =>
      ['song-summaries', 'user', userId] as const,
    summariesForUserPrefix: () => ['song-summaries', 'user'] as const,
  },
};
