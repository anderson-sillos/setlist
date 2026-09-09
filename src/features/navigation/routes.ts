import type { Href } from 'expo-router';

import type { EntityId } from '@/domain';

export type BandSection = 'shows' | 'repertoire' | 'band';

export function getBandSectionHref(
  bandId: EntityId,
  section: BandSection,
): Href {
  return `/bands/${encodeURIComponent(bandId)}/${section}` as Href;
}

export function getShowHref(bandId: EntityId, showId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/shows/${encodeURIComponent(showId)}` as Href;
}

export function getSongHref(bandId: EntityId, songId: EntityId): Href {
  return `/bands/${encodeURIComponent(bandId)}/repertoire/${encodeURIComponent(songId)}` as Href;
}
