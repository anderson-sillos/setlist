import { useState, type PropsWithChildren } from 'react';

import {
  createLyricBlock,
  createLyricLine,
  createShow,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

export const navigationTestIds = {
  band: 'band-navigation-test',
  show: 'show-navigation-test',
  song: 'song-navigation-test',
  user: 'user-navigation-test',
} as const;

export function createNavigationScenario() {
  const song = createSong({
    bandId: navigationTestIds.band,
    id: navigationTestIds.song,
    lyricStatus: 'static',
    lyrics: {
      blocks: [
        createLyricBlock({
          lines: [createLyricLine({ text: 'A rua acende devagar' })],
        }),
      ],
    },
    title: 'Luzes da Cidade',
  });
  const show = createShow({
    bandId: navigationTestIds.band,
    blocks: [
      createShowSetlistBlock({
        items: [createShowSongSetlistItem({ songId: song.id })],
      }),
    ],
    id: navigationTestIds.show,
    name: 'Festival da Praça',
    startsAt: '2027-02-14T23:00:00.000Z',
    status: 'ready',
    venue: 'Praça Central',
  });

  return createBandScenario({
    bandId: navigationTestIds.band,
    role: 'owner',
    shows: [show],
    songs: [song],
    userId: navigationTestIds.user,
  });
}

export function NavigationTestProviders({ children }: PropsWithChildren) {
  const [scenario] = useState(createNavigationScenario);

  return (
    <TestAppProviders
      currentUserId={scenario.currentUserId}
      repositories={scenario.repositories}
    >
      {children}
    </TestAppProviders>
  );
}
