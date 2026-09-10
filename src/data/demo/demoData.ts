import {
  createInMemoryRepositories,
  type InMemoryRepositoryData,
} from '@/data/in-memory';
import type { AppRepositories } from '@/domain';

const createdAt = '2026-08-10T14:00:00.000Z';
const updatedAt = '2026-09-05T18:30:00.000Z';

export const demoIds = {
  calendarShow: 'show-demo-ensaio-aberto',
  currentUser: 'user-demo-ana',
  primaryBand: 'band-demo-horizonte',
  secondaryBand: 'band-demo-aurora',
  readyShow: 'show-demo-festival',
  stageSong: 'song-demo-luzes',
} as const;

export const demoRepositoryData = {
  bands: [
    {
      id: demoIds.primaryBand,
      name: 'Banda Horizonte',
      createdAt,
      updatedAt,
    },
    {
      id: demoIds.secondaryBand,
      name: 'Trio Aurora',
      createdAt: '2026-08-15T12:00:00.000Z',
      updatedAt: '2026-09-03T20:00:00.000Z',
    },
  ],
  bandMembers: [
    {
      id: 'member-demo-ana-horizonte',
      bandId: demoIds.primaryBand,
      userId: demoIds.currentUser,
      displayName: 'Ana Martins',
      role: 'owner',
      joinedAt: createdAt,
    },
    {
      id: 'member-demo-bruno-horizonte',
      bandId: demoIds.primaryBand,
      userId: 'user-demo-bruno',
      displayName: 'Bruno Lima',
      role: 'editor',
      joinedAt: '2026-08-11T10:00:00.000Z',
    },
    {
      id: 'member-demo-carla-horizonte',
      bandId: demoIds.primaryBand,
      userId: 'user-demo-carla',
      displayName: 'Carla Nunes',
      role: 'member',
      joinedAt: '2026-08-12T11:00:00.000Z',
    },
    {
      id: 'member-demo-diego-aurora',
      bandId: demoIds.secondaryBand,
      userId: 'user-demo-diego',
      displayName: 'Diego Rocha',
      role: 'owner',
      joinedAt: '2026-08-15T12:00:00.000Z',
    },
    {
      id: 'member-demo-ana-aurora',
      bandId: demoIds.secondaryBand,
      userId: demoIds.currentUser,
      displayName: 'Ana Martins',
      role: 'member',
      joinedAt: '2026-08-16T16:00:00.000Z',
    },
  ],
  songs: [
    {
      id: demoIds.stageSong,
      bandId: demoIds.primaryBand,
      title: 'Luzes da Cidade',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'G',
      bpm: 118,
      estimatedDurationMs: 218_000,
      youtubeReference: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-luzes-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-luzes-1',
                text: 'A rua acende devagar',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-luzes-2',
                text: 'Nosso caminho ganha cor',
                startTimeMs: null,
              },
            ],
          },
          {
            id: 'lyric-block-luzes-refrao',
            name: 'Refrão',
            lines: [
              {
                id: 'lyric-line-luzes-3',
                text: 'Levanta a voz, deixa chegar',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-luzes-4',
                text: 'A noite inteira ao nosso redor',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: 'Abrir com guitarra limpa e dinâmica crescente.',
      archivedAt: null,
      createdAt,
      updatedAt,
    },
    {
      id: 'song-demo-pontes',
      bandId: demoIds.primaryBand,
      title: 'Entre Pontes',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'D',
      bpm: 104,
      estimatedDurationMs: 204_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-pontes-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-pontes-1',
                text: 'Eu vejo o rio mudar',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-pontes-2',
                text: 'E cada ponte responder',
                startTimeMs: 12_000,
              },
            ],
          },
          {
            id: 'lyric-block-pontes-refrao',
            name: 'Refrão',
            lines: [
              {
                id: 'lyric-line-pontes-3',
                text: 'Se o horizonte chamar',
                startTimeMs: 42_000,
              },
              {
                id: 'lyric-line-pontes-4',
                text: 'A gente aprende a atravessar',
                startTimeMs: 54_000,
              },
            ],
          },
        ],
      },
      lyricStatus: 'synchronized',
      notes: 'Segurar o último acorde antes do refrão.',
      archivedAt: null,
      createdAt,
      updatedAt: '2026-09-04T19:00:00.000Z',
    },
    {
      id: 'song-demo-chuva',
      bandId: demoIds.primaryBand,
      title: 'Depois da Chuva',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'A',
      bpm: 92,
      estimatedDurationMs: 232_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-chuva-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-chuva-1',
                text: 'Depois da chuva vem o som',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-chuva-2',
                text: 'De cada passo pelo chão',
                startTimeMs: 15_000,
              },
              {
                id: 'lyric-line-chuva-3',
                text: 'Ainda falta marcar esta canção',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'incomplete',
      notes: 'Sincronização da última linha ainda pendente.',
      archivedAt: null,
      createdAt,
      updatedAt: '2026-09-05T18:30:00.000Z',
    },
    {
      id: 'song-demo-instrumental',
      bandId: demoIds.primaryBand,
      title: 'Instrumental de Abertura',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'Em',
      bpm: 126,
      estimatedDurationMs: 95_000,
      youtubeReference: null,
      lyrics: { blocks: [] },
      lyricStatus: 'missing',
      notes: 'Entrada de todos após oito compassos.',
      archivedAt: null,
      createdAt,
      updatedAt: '2026-09-01T20:00:00.000Z',
    },
    {
      id: 'song-demo-rota-antiga',
      bandId: demoIds.primaryBand,
      title: 'Rota Antiga',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'C',
      bpm: 88,
      estimatedDurationMs: 190_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-rota-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-rota-1',
                text: 'A velha rota ficou para trás',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: 'Mantida somente nos shows que já a utilizavam.',
      archivedAt: '2026-09-02T15:00:00.000Z',
      createdAt,
      updatedAt: '2026-09-02T15:00:00.000Z',
    },
    {
      id: 'song-demo-mare',
      bandId: demoIds.secondaryBand,
      title: 'Maré Serena',
      originalArtist: 'Trio Aurora',
      musicalKey: 'F',
      bpm: 76,
      estimatedDurationMs: 245_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-mare-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-mare-1',
                text: 'A maré repousa devagar',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-mare-2',
                text: 'E o violão começa a respirar',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: null,
      archivedAt: null,
      createdAt: '2026-08-16T16:00:00.000Z',
      updatedAt: '2026-09-03T20:00:00.000Z',
    },
  ],
  shows: [
    {
      id: demoIds.calendarShow,
      bandId: demoIds.primaryBand,
      name: 'Ensaio Aberto',
      startsAt: '2026-09-19T16:00:00-03:00',
      venue: 'Estúdio Central',
      notes: 'Revisar as entradas antes de abrir as portas.',
      status: 'draft',
      blocks: [
        {
          id: 'show-block-ensaio-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-ensaio-luzes',
              type: 'song',
              songId: demoIds.stageSong,
              notes: null,
            },
            {
              id: 'show-item-ensaio-pontes',
              type: 'song',
              songId: 'song-demo-pontes',
              notes: 'Testar a passagem direta para o refrão.',
            },
          ],
        },
      ],
      createdAt: '2026-09-06T14:00:00.000Z',
      updatedAt: '2026-09-08T20:00:00.000Z',
    },
    {
      id: 'show-demo-bairro',
      bandId: demoIds.primaryBand,
      name: 'Show do Bairro',
      startsAt: '2026-09-19T21:30:00-03:00',
      venue: 'Centro Comunitário',
      notes: 'Montagem a partir das 18h.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-bairro-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-bairro-instrumental',
              type: 'song',
              songId: 'song-demo-instrumental',
              notes: null,
            },
            {
              id: 'show-item-bairro-separator',
              type: 'separator',
            },
            {
              id: 'show-item-bairro-chuva',
              type: 'song',
              songId: 'song-demo-chuva',
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2026-09-06T15:00:00.000Z',
      updatedAt: '2026-09-08T21:00:00.000Z',
    },
    {
      id: demoIds.readyShow,
      bandId: demoIds.primaryBand,
      name: 'Festival da Praça',
      startsAt: '2027-02-20T21:00:00-03:00',
      venue: 'Praça Central',
      notes: 'Passagem de som às 17h. Show com dois blocos e bis.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-festival-abertura',
          name: 'Abertura',
          items: [
            {
              id: 'show-item-festival-instrumental',
              type: 'song',
              songId: 'song-demo-instrumental',
              notes: 'Começar com luz baixa.',
            },
            {
              id: 'show-item-festival-apresentacao',
              type: 'planning',
              description: 'Entrada e apresentação da banda',
              estimatedDurationMs: 90_000,
            },
            {
              id: 'show-item-festival-luzes',
              type: 'song',
              songId: demoIds.stageSong,
              notes: null,
            },
          ],
        },
        {
          id: 'show-block-festival-segundo',
          name: 'Segundo Set',
          items: [
            {
              id: 'show-item-festival-pontes',
              type: 'song',
              songId: 'song-demo-pontes',
              notes: 'Emendar diretamente da fala do vocalista.',
            },
            {
              id: 'show-item-festival-afinacao',
              type: 'planning',
              description: 'Troca de violão e afinação',
              estimatedDurationMs: 120_000,
            },
            {
              id: 'show-item-festival-interacao',
              type: 'planning',
              description: 'Interação com o público',
              estimatedDurationMs: null,
            },
            {
              id: 'show-item-festival-separator',
              type: 'separator',
            },
            {
              id: 'show-item-festival-chuva',
              type: 'song',
              songId: 'song-demo-chuva',
              notes: null,
            },
          ],
        },
        {
          id: 'show-block-festival-bis',
          name: 'Bis',
          items: [
            {
              id: 'show-item-festival-luzes-bis',
              type: 'song',
              songId: demoIds.stageSong,
              notes: 'Usar a versão curta no bis.',
            },
          ],
        },
      ],
      createdAt: '2026-08-20T13:00:00.000Z',
      updatedAt: '2026-09-05T19:00:00.000Z',
    },
    {
      id: 'show-demo-clube',
      bandId: demoIds.primaryBand,
      name: 'Noite no Clube',
      startsAt: '2027-03-14T20:30:00-03:00',
      venue: 'Clube das Artes',
      notes: 'Repertório ainda em preparação.',
      status: 'draft',
      blocks: [
        {
          id: 'show-block-clube-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-clube-pontes',
              type: 'song',
              songId: 'song-demo-pontes',
              notes: null,
            },
            {
              id: 'show-item-clube-luzes',
              type: 'song',
              songId: demoIds.stageSong,
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2026-09-04T18:00:00.000Z',
      updatedAt: '2026-09-05T18:00:00.000Z',
    },
    {
      id: 'show-demo-arquivo',
      bandId: demoIds.primaryBand,
      name: 'Encontro de Inverno',
      startsAt: '2026-07-18T19:00:00-03:00',
      venue: 'Centro Cultural',
      notes: 'Evento cancelado, mantido apenas para consulta.',
      status: 'cancelled',
      blocks: [
        {
          id: 'show-block-arquivo-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-arquivo-rota',
              type: 'song',
              songId: 'song-demo-rota-antiga',
              notes: 'Registro histórico da setlist.',
            },
          ],
        },
      ],
      createdAt: '2026-06-10T11:00:00.000Z',
      updatedAt: '2026-07-01T09:00:00.000Z',
    },
    {
      id: 'show-demo-aurora',
      bandId: demoIds.secondaryBand,
      name: 'Fim de Tarde Acústico',
      startsAt: '2027-02-28T17:30:00-03:00',
      venue: 'Jardim do Museu',
      notes: null,
      status: 'ready',
      blocks: [
        {
          id: 'show-block-aurora-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-aurora-mare',
              type: 'song',
              songId: 'song-demo-mare',
              notes: 'Início somente com voz e violão.',
            },
          ],
        },
      ],
      createdAt: '2026-08-25T10:00:00.000Z',
      updatedAt: '2026-09-03T20:00:00.000Z',
    },
  ],
} as const satisfies InMemoryRepositoryData;

export function createDemoRepositories(): AppRepositories {
  return createInMemoryRepositories(demoRepositoryData);
}
