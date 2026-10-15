import type {
  Show,
  ShowPlanningSetlistItem,
  ShowSeparatorSetlistItem,
  ShowSetlistBlock,
  ShowSongSetlistItem,
} from '@/domain';

const DEFAULT_TIMESTAMP = '2026-01-01T12:00:00.000Z';

export function createShowSongSetlistItem(
  overrides: Partial<ShowSongSetlistItem> = {},
): ShowSongSetlistItem {
  return {
    id: 'setlist-song-test',
    type: 'song',
    songId: 'song-test',
    notes: null,
    ...overrides,
  };
}

export function createShowPlanningSetlistItem(
  overrides: Partial<ShowPlanningSetlistItem> = {},
): ShowPlanningSetlistItem {
  return {
    id: 'setlist-planning-test',
    type: 'planning',
    description: 'Intervalo',
    estimatedDurationMs: null,
    ...overrides,
  };
}

export function createShowSeparatorSetlistItem(
  overrides: Partial<ShowSeparatorSetlistItem> = {},
): ShowSeparatorSetlistItem {
  return {
    id: 'setlist-separator-test',
    type: 'separator',
    ...overrides,
  };
}

export function createShowSetlistBlock(
  overrides: Partial<ShowSetlistBlock> = {},
): ShowSetlistBlock {
  const { items, ...fields } = overrides;

  return {
    id: 'show-block-test',
    name: 'Parte principal',
    ...fields,
    items: items?.map((item) => ({ ...item })) ?? [],
  };
}

export function createShow(overrides: Partial<Show> = {}): Show {
  const { blocks, ...fields } = overrides;

  return {
    id: 'show-test',
    bandId: 'band-test',
    name: 'Show de teste',
    startsAt: DEFAULT_TIMESTAMP,
    venue: 'Casa de shows',
    notes: null,
    status: 'draft',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...fields,
    blocks: blocks?.map((block) => createShowSetlistBlock(block)) ?? [],
  };
}
