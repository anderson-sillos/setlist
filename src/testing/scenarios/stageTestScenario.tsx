import { useState, type PropsWithChildren } from 'react';

import {
  createLyricBlock,
  createLyricLine,
  createShow,
  createShowPlanningSetlistItem,
  createShowSeparatorSetlistItem,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

export const stageTestIds = {
  band: 'band-stage-test',
  cancelledShow: 'show-cancelled-stage-test',
  draftShow: 'show-draft-stage-test',
  readyShow: 'show-ready-stage-test',
  staticSong: 'song-static-stage-test',
  user: 'user-stage-test',
} as const;

export function createStageTestScenario() {
  const staticSong = createSong({
    bandId: stageTestIds.band,
    id: stageTestIds.staticSong,
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
  const instrumentalSong = createSong({
    bandId: stageTestIds.band,
    id: 'song-instrumental-stage-test',
    title: 'Instrumental de Abertura',
  });
  const unusedSong = createSong({
    bandId: stageTestIds.band,
    id: 'song-unused-stage-test',
    title: 'Faixa fora da setlist',
  });
  const draftShow = createShow({
    bandId: stageTestIds.band,
    blocks: [
      createShowSetlistBlock({
        items: [
          createShowSongSetlistItem({
            id: 'item-stage-draft-song',
            songId: staticSong.id,
          }),
          createShowPlanningSetlistItem({
            estimatedDurationMs: 420_000,
            id: 'item-stage-duration',
          }),
        ],
      }),
    ],
    id: stageTestIds.draftShow,
    name: 'Ensaio Aberto',
    startsAt: '2026-09-19T19:00:00.000Z',
    status: 'draft',
    venue: 'Estúdio Central',
  });
  const readyShow = createShow({
    bandId: stageTestIds.band,
    blocks: [
      createShowSetlistBlock({
        id: 'block-stage-opening',
        items: [
          createShowSongSetlistItem({
            id: 'item-stage-static-song',
            songId: staticSong.id,
          }),
          createShowPlanningSetlistItem({
            description: 'Entrada e apresentação da banda',
            id: 'item-stage-planning',
          }),
          createShowSeparatorSetlistItem({ id: 'item-stage-separator' }),
          createShowSongSetlistItem({
            id: 'item-stage-instrumental-song',
            songId: instrumentalSong.id,
          }),
        ],
        name: 'Abertura',
      }),
    ],
    id: stageTestIds.readyShow,
    name: 'Show do Bairro',
    startsAt: '2027-02-14T23:00:00.000Z',
    status: 'ready',
    venue: 'Praça Central',
  });
  const cancelledShow = createShow({
    bandId: stageTestIds.band,
    id: stageTestIds.cancelledShow,
    name: 'Encontro de Inverno',
    status: 'cancelled',
  });

  return createBandScenario({
    bandId: stageTestIds.band,
    role: 'owner',
    shows: [draftShow, readyShow, cancelledShow],
    songs: [staticSong, instrumentalSong, unusedSong],
    userId: stageTestIds.user,
  });
}

export function StageTestProviders({ children }: PropsWithChildren) {
  const [scenario] = useState(createStageTestScenario);

  return (
    <TestAppProviders
      currentUserId={scenario.currentUserId}
      repositories={scenario.repositories}
    >
      {children}
    </TestAppProviders>
  );
}
