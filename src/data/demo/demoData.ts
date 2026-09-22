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

export function isDemoBandId(bandId: string): boolean {
  return bandId === demoIds.primaryBand || bandId === demoIds.secondaryBand;
}

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
      id: 'song-demo-mare-neon',
      bandId: demoIds.primaryBand,
      title: 'Maré de Neon',
      originalArtist: 'Coletivo Atlântico',
      musicalKey: 'Bm',
      bpm: 112,
      estimatedDurationMs: 252_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-mare-neon-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-mare-neon-1',
                text: 'A maré desenha a avenida',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-mare-neon-2',
                text: 'Neon aceso na despedida',
                startTimeMs: 14_000,
              },
            ],
          },
          {
            id: 'lyric-block-mare-neon-refrao',
            name: 'Refrão',
            lines: [
              {
                id: 'lyric-line-mare-neon-3',
                text: 'Deixa a cidade respirar',
                startTimeMs: 48_000,
              },
              {
                id: 'lyric-line-mare-neon-4',
                text: 'Que a noite ainda vai virar',
                startTimeMs: 61_000,
              },
            ],
          },
        ],
      },
      lyricStatus: 'synchronized',
      notes: 'Versão da Horizonte em tom abaixo da gravação de referência.',
      archivedAt: null,
      createdAt: '2026-08-18T13:00:00.000Z',
      updatedAt: '2026-09-06T17:30:00.000Z',
    },
    {
      id: 'song-demo-ultimo-trem',
      bandId: demoIds.primaryBand,
      title: 'Último Trem',
      originalArtist: 'Os Viajantes',
      musicalKey: 'E',
      bpm: 108,
      estimatedDurationMs: 227_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-ultimo-trem-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-ultimo-trem-1',
                text: 'A plataforma ficou para trás',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-ultimo-trem-2',
                text: 'No último trem cabem sinais',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: 'Começar com voz e teclado; bateria entra no segundo verso.',
      archivedAt: null,
      createdAt: '2026-08-19T14:00:00.000Z',
      updatedAt: '2026-09-04T16:45:00.000Z',
    },
    {
      id: 'song-demo-pulso-avenida',
      bandId: demoIds.primaryBand,
      title: 'Pulso da Avenida',
      originalArtist: 'Ritmo Central',
      musicalKey: 'Am',
      bpm: 124,
      estimatedDurationMs: 211_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-pulso-avenida-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-pulso-avenida-1',
                text: 'O pulso corre pela avenida',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-pulso-avenida-2',
                text: 'Cada janela inventa uma saída',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'incomplete',
      notes: 'Marcar a entrada da segunda linha durante o próximo ensaio.',
      archivedAt: null,
      createdAt: '2026-08-20T15:00:00.000Z',
      updatedAt: '2026-09-07T11:20:00.000Z',
    },
    {
      id: 'song-demo-ceu-outubro',
      bandId: demoIds.primaryBand,
      title: 'Céu de Outubro',
      originalArtist: 'Clara Monte',
      musicalKey: 'C',
      bpm: 84,
      estimatedDurationMs: 245_000,
      youtubeReference: null,
      lyrics: { blocks: [] },
      lyricStatus: 'missing',
      notes: 'Letra ainda será cadastrada pela equipe.',
      archivedAt: null,
      createdAt: '2026-08-21T16:00:00.000Z',
      updatedAt: '2026-09-02T09:15:00.000Z',
    },
    {
      id: 'song-demo-horizonte-azul',
      bandId: demoIds.primaryBand,
      title: 'Horizonte Azul',
      originalArtist: 'Banda Horizonte',
      musicalKey: 'D',
      bpm: 116,
      estimatedDurationMs: 238_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-horizonte-azul-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-horizonte-azul-1',
                text: 'Amanheceu no lado azul',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-horizonte-azul-2',
                text: 'A nossa estrada aponta ao sul',
                startTimeMs: 13_000,
              },
            ],
          },
        ],
      },
      lyricStatus: 'synchronized',
      notes: 'Final aberto para apresentar a banda.',
      archivedAt: null,
      createdAt: '2026-08-22T17:00:00.000Z',
      updatedAt: '2026-09-08T13:40:00.000Z',
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
    {
      id: 'song-demo-sol-inverno',
      bandId: demoIds.secondaryBand,
      title: 'Sol de Inverno',
      originalArtist: 'Marina Vale',
      musicalKey: 'G',
      bpm: 82,
      estimatedDurationMs: 221_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-sol-inverno-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-sol-inverno-1',
                text: 'O sol de inverno entrou pela janela',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-sol-inverno-2',
                text: 'E fez morada no som dela',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: 'Arranjo acústico com segunda voz no refrão.',
      archivedAt: null,
      createdAt: '2026-08-23T12:00:00.000Z',
      updatedAt: '2026-09-05T10:30:00.000Z',
    },
    {
      id: 'song-demo-vento-sul',
      bandId: demoIds.secondaryBand,
      title: 'Vento Sul',
      originalArtist: 'Quarteto das Nuvens',
      musicalKey: 'Dm',
      bpm: 96,
      estimatedDurationMs: 198_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-vento-sul-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-vento-sul-1',
                text: 'Vento sul cruzou o cais',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-vento-sul-2',
                text: 'Levou as nuvens para trás',
                startTimeMs: 16_000,
              },
            ],
          },
        ],
      },
      lyricStatus: 'synchronized',
      notes: 'Manter andamento leve, sem acelerar no final.',
      archivedAt: null,
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-09-06T09:30:00.000Z',
    },
    {
      id: 'song-demo-casa-acesa',
      bandId: demoIds.secondaryBand,
      title: 'Casa Acesa',
      originalArtist: 'Trio Aurora',
      musicalKey: 'A',
      bpm: 78,
      estimatedDurationMs: 234_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-casa-acesa-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-casa-acesa-1',
                text: 'Deixei a casa acesa para voltar',
                startTimeMs: null,
              },
              {
                id: 'lyric-line-casa-acesa-2',
                text: 'E uma canção guardada no lugar',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'static',
      notes: null,
      archivedAt: null,
      createdAt: '2026-08-25T12:00:00.000Z',
      updatedAt: '2026-09-07T14:10:00.000Z',
    },
    {
      id: 'song-demo-mapa-estrelas',
      bandId: demoIds.secondaryBand,
      title: 'Mapa de Estrelas',
      originalArtist: 'Lia Campos',
      musicalKey: 'F',
      bpm: 72,
      estimatedDurationMs: 260_000,
      youtubeReference: null,
      lyrics: {
        blocks: [
          {
            id: 'lyric-block-mapa-estrelas-verso',
            name: 'Verso',
            lines: [
              {
                id: 'lyric-line-mapa-estrelas-1',
                text: 'Tracei um mapa entre as estrelas',
                startTimeMs: 0,
              },
              {
                id: 'lyric-line-mapa-estrelas-2',
                text: 'Falta aprender como alcançá-las',
                startTimeMs: null,
              },
            ],
          },
        ],
      },
      lyricStatus: 'incomplete',
      notes: 'Sincronização do verso em revisão.',
      archivedAt: null,
      createdAt: '2026-08-26T12:00:00.000Z',
      updatedAt: '2026-09-08T15:25:00.000Z',
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
      id: 'show-demo-lago',
      bandId: demoIds.primaryBand,
      name: 'Festival do Lago',
      startsAt: '2026-10-03T20:00:00-03:00',
      venue: 'Parque Municipal',
      notes: 'Chegada da equipe às 16h para montagem e passagem de som.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-lago-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-lago-mare-neon',
              type: 'song',
              songId: 'song-demo-mare-neon',
              notes: 'Começar com a introdução estendida.',
            },
            {
              id: 'show-item-lago-troca',
              type: 'planning',
              description: 'Troca de guitarra e afinação',
              estimatedDurationMs: 90_000,
            },
            {
              id: 'show-item-lago-ultimo-trem',
              type: 'song',
              songId: 'song-demo-ultimo-trem',
              notes: null,
            },
            {
              id: 'show-item-lago-separator',
              type: 'separator',
            },
            {
              id: 'show-item-lago-horizonte-azul',
              type: 'song',
              songId: 'song-demo-horizonte-azul',
              notes: 'Encerrar apresentando os integrantes.',
            },
          ],
        },
      ],
      createdAt: '2026-09-01T13:00:00.000Z',
      updatedAt: '2026-09-08T18:20:00.000Z',
    },
    {
      id: 'show-demo-estacao',
      bandId: demoIds.primaryBand,
      name: 'Noite da Estação',
      startsAt: '2026-11-14T21:30:00-03:00',
      venue: 'Galpão da Estação',
      notes: 'Setlist curta para dividir a noite com outras bandas.',
      status: 'draft',
      blocks: [
        {
          id: 'show-block-estacao-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-estacao-pulso',
              type: 'song',
              songId: 'song-demo-pulso-avenida',
              notes: null,
            },
            {
              id: 'show-item-estacao-apresentacao',
              type: 'planning',
              description: 'Apresentação do evento e agradecimentos',
              estimatedDurationMs: 120_000,
            },
            {
              id: 'show-item-estacao-ceu',
              type: 'song',
              songId: 'song-demo-ceu-outubro',
              notes: 'Confirmar a letra antes do show.',
            },
          ],
        },
      ],
      createdAt: '2026-09-02T13:00:00.000Z',
      updatedAt: '2026-09-07T19:10:00.000Z',
    },
    {
      id: 'show-demo-orla',
      bandId: demoIds.primaryBand,
      name: 'Verão na Orla',
      startsAt: '2027-01-09T18:00:00-03:00',
      venue: 'Concha Acústica da Orla',
      notes: 'Evento ao ar livre; prever proteção para os equipamentos.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-orla-abertura',
          name: 'Abertura',
          items: [
            {
              id: 'show-item-orla-instrumental',
              type: 'song',
              songId: 'song-demo-instrumental',
              notes: null,
            },
            {
              id: 'show-item-orla-horizonte',
              type: 'song',
              songId: 'song-demo-horizonte-azul',
              notes: null,
            },
            {
              id: 'show-item-orla-mare-neon',
              type: 'song',
              songId: 'song-demo-mare-neon',
              notes: null,
            },
          ],
        },
        {
          id: 'show-block-orla-final',
          name: 'Final',
          items: [
            {
              id: 'show-item-orla-pausa',
              type: 'planning',
              description: 'Pausa para recado da produção',
              estimatedDurationMs: 60_000,
            },
            {
              id: 'show-item-orla-luzes',
              type: 'song',
              songId: demoIds.stageSong,
              notes: 'Finalizar sem bis.',
            },
          ],
        },
      ],
      createdAt: '2026-09-03T13:00:00.000Z',
      updatedAt: '2026-09-08T08:45:00.000Z',
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
      id: 'show-demo-teatro',
      bandId: demoIds.primaryBand,
      name: 'Sessão no Teatro',
      startsAt: '2027-04-24T20:30:00-03:00',
      venue: 'Teatro Municipal',
      notes: 'A ordem final depende da duração liberada pela produção.',
      status: 'draft',
      blocks: [
        {
          id: 'show-block-teatro-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-teatro-ultimo-trem',
              type: 'song',
              songId: 'song-demo-ultimo-trem',
              notes: null,
            },
            {
              id: 'show-item-teatro-pontes',
              type: 'song',
              songId: 'song-demo-pontes',
              notes: null,
            },
            {
              id: 'show-item-teatro-separator',
              type: 'separator',
            },
            {
              id: 'show-item-teatro-chuva',
              type: 'song',
              songId: 'song-demo-chuva',
              notes: null,
            },
            {
              id: 'show-item-teatro-ceu',
              type: 'song',
              songId: 'song-demo-ceu-outubro',
              notes: 'Confirmar se permanece no encerramento.',
            },
          ],
        },
      ],
      createdAt: '2026-09-05T13:00:00.000Z',
      updatedAt: '2026-09-08T10:35:00.000Z',
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
    {
      id: 'show-demo-aurora-cafe',
      bandId: demoIds.secondaryBand,
      name: 'Domingo no Café',
      startsAt: '2026-10-18T17:00:00-03:00',
      venue: 'Café do Mercado',
      notes: 'Formato acústico e volume reduzido.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-aurora-cafe-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-aurora-cafe-mare',
              type: 'song',
              songId: 'song-demo-mare',
              notes: null,
            },
            {
              id: 'show-item-aurora-cafe-sol',
              type: 'song',
              songId: 'song-demo-sol-inverno',
              notes: null,
            },
            {
              id: 'show-item-aurora-cafe-pausa',
              type: 'planning',
              description: 'Apresentação do trio',
              estimatedDurationMs: 60_000,
            },
            {
              id: 'show-item-aurora-cafe-vento',
              type: 'song',
              songId: 'song-demo-vento-sul',
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-06T12:15:00.000Z',
    },
    {
      id: 'show-demo-aurora-dezembro',
      bandId: demoIds.secondaryBand,
      name: 'Encontro de Dezembro',
      startsAt: '2026-12-05T20:30:00-03:00',
      venue: 'Casa das Artes',
      notes: 'Repertório em definição com a produção.',
      status: 'draft',
      blocks: [
        {
          id: 'show-block-aurora-dezembro-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-aurora-dezembro-casa',
              type: 'song',
              songId: 'song-demo-casa-acesa',
              notes: null,
            },
            {
              id: 'show-item-aurora-dezembro-mapa',
              type: 'song',
              songId: 'song-demo-mapa-estrelas',
              notes: 'Revisar a sincronização antes de confirmar.',
            },
            {
              id: 'show-item-aurora-dezembro-separator',
              type: 'separator',
            },
            {
              id: 'show-item-aurora-dezembro-mare',
              type: 'song',
              songId: 'song-demo-mare',
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-07T17:40:00.000Z',
    },
    {
      id: 'show-demo-aurora-serra',
      bandId: demoIds.secondaryBand,
      name: 'Manhã na Serra',
      startsAt: '2027-04-11T10:30:00-03:00',
      venue: 'Mirante da Serra',
      notes: 'Checar a previsão do tempo na semana do evento.',
      status: 'ready',
      blocks: [
        {
          id: 'show-block-aurora-serra-principal',
          name: 'Principal',
          items: [
            {
              id: 'show-item-aurora-serra-vento',
              type: 'song',
              songId: 'song-demo-vento-sul',
              notes: null,
            },
            {
              id: 'show-item-aurora-serra-sol',
              type: 'song',
              songId: 'song-demo-sol-inverno',
              notes: null,
            },
            {
              id: 'show-item-aurora-serra-intervalo',
              type: 'planning',
              description: 'Breve intervalo e troca de instrumentos',
              estimatedDurationMs: 90_000,
            },
            {
              id: 'show-item-aurora-serra-casa',
              type: 'song',
              songId: 'song-demo-casa-acesa',
              notes: null,
            },
            {
              id: 'show-item-aurora-serra-mapa',
              type: 'song',
              songId: 'song-demo-mapa-estrelas',
              notes: 'Encerrar com a dinâmica mais baixa.',
            },
          ],
        },
      ],
      createdAt: '2026-09-03T10:00:00.000Z',
      updatedAt: '2026-09-08T16:05:00.000Z',
    },
  ],
} as const satisfies InMemoryRepositoryData;

export function createDemoRepositories(): AppRepositories {
  return createInMemoryRepositories(demoRepositoryData);
}
