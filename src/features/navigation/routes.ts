import type { Href } from 'expo-router';

import type { EntityId } from '@/domain';

export type BandSection = 'shows' | 'repertoire' | 'stage' | 'band';

export function getBandSectionHref(
  bandId: EntityId,
  section: BandSection,
): Href {
  return `/bands/${encodeURIComponent(bandId)}/${section}` as Href;
}

export function getShowHref(bandId: EntityId, showId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/shows/${encodeURIComponent(showId)}` as Href;
}

export function getShowEditHref(bandId: EntityId, showId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/shows/${encodeURIComponent(showId)}/edit` as Href;
}

export function getSongLyricsHref(bandId: EntityId, songId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/${encodeURIComponent(songId)}/lyrics` as Href;
}

export function getSongHref(bandId: EntityId, songId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/${encodeURIComponent(songId)}` as Href;
}

export function getRepertoireCollectionFilterHref(
  bandId: EntityId,
  collectionId: EntityId,
): Href {
  return `${getBandSectionHref(bandId, 'repertoire')}?collectionId=${encodeURIComponent(collectionId)}` as Href;
}

export function getRepertoireCollectionAddSongsHref(
  bandId: EntityId,
  collectionId: EntityId,
): Href {
  return `${getBandSectionHref(bandId, 'repertoire')}?addToCollectionId=${encodeURIComponent(collectionId)}` as Href;
}

export function getSongCreateHref(bandId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/new` as Href;
}

export function getSongEditHref(bandId: EntityId, songId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/${encodeURIComponent(songId)}/edit` as Href;
}

export function getRepertoireCollectionsHref(bandId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/collections` as Href;
}

export function getRepertoireCollectionHref(
  bandId: EntityId,
  collectionId: EntityId,
): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/collections/${encodeURIComponent(collectionId)}` as Href;
}

export function getRepertoireCollectionCreateHref(
  bandId: EntityId,
  initialSongIds: readonly EntityId[] = [],
  returnToRepertoire = false,
): Href {
  const route = `/bands/${encodeURIComponent(bandId)}/repertoire/collections/new`;
  const songQuery = initialSongIds
    .map((songId) => `songId=${encodeURIComponent(songId)}`)
    .join('&');
  const query = [songQuery, returnToRepertoire ? 'returnTo=repertoire' : '']
    .filter(Boolean)
    .join('&');
  return `${route}${query ? `?${query}` : ''}` as Href;
}

export function getRepertoireCollectionEditHref(
  bandId: EntityId,
  collectionId: EntityId,
): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/collections/${encodeURIComponent(collectionId)}/edit` as Href;
}

export function getStageHref(bandId: EntityId, showId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/shows/${encodeURIComponent(showId)}/stage` as Href;
}
