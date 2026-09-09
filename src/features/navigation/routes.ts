import type { Href } from 'expo-router';

import type { EntityId } from '@/domain';

export type BandSection = 'shows' | 'repertoire' | 'band';

export function getBandSectionHref(
  bandId: EntityId,
  section: BandSection,
): Href {
  return `/bands/${encodeURIComponent(bandId)}/${section}` as Href;
}
