import { createHash } from 'node:crypto';

import { artists, showCatalog } from './demo-band-catalog.mjs';

export function demoId(key) {
  const hash = createHash('sha256')
    .update(`setlist:banda-demo:v1:${key}`)
    .digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function makeLyrics(entry, artist, number, status, durationMs) {
  if (status === 'missing') {
    return {
      blocks:
        number % 12 === 0
          ? [
              {
                id: demoId(`lyric:${number}:instrumental`),
                name: 'Instrumental',
                lines: [],
              },
            ]
          : [],
    };
  }

  const [, first, second, third, fourth, hook] = entry;
  const chorus = [hook, artist.chorus[0], hook, artist.chorus[1]];
  const sections = [
    ['Verso 1', [first, second, third, fourth]],
    ['Pré-refrão', artist.preChorus],
    ['Refrão', chorus],
    ['Verso 2', [third, artist.bridge[0], fourth, artist.bridge[1]]],
    ['Ponte', [...artist.bridge, hook]],
    ['Refrão final', [...chorus, hook]],
    [number % 7 === 0 ? null : 'Final', [fourth, hook]],
  ];
  // Variações de estrutura: introdução vocal, solo sem texto e bloco sem nome.
  if (number % 3 === 0) sections.unshift(['Introdução', [hook, hook]]);
  if (number % 4 === 0) sections.splice(4, 0, ['Solo', []]);

  const textCount = sections.reduce(
    (total, [, lines]) => total + lines.length,
    0,
  );
  const endMs = (durationMs ?? 240_000) - 8_000;
  const textTime = (index) => Math.floor((index * endMs) / textCount);
  let textIndex = 0;
  return {
    blocks: sections.map(([name, texts], blockIndex) => {
      const lines = texts.map((text, lineIndex) => {
        const index = textIndex++;
        let startTimeMs = null;
        if (status === 'synchronized') startTimeMs = textTime(index);
        if (status === 'incomplete') {
          const variant = Math.floor((number - 1) / 6) % 3;
          if (variant === 0 && index < Math.floor(textCount / 2))
            startTimeMs = textTime(index);
          if (variant === 1) startTimeMs = textTime(index === 6 ? 4 : index);
          if (variant === 2 && index !== textCount - 1)
            startTimeMs = textTime(index);
        }
        return {
          id: demoId(`lyric:${number}:${blockIndex}:${lineIndex}`),
          text,
          startTimeMs,
          ...(name?.startsWith('Refrão') && lineIndex === 0
            ? { bold: true }
            : {}),
        };
      });
      if (blockIndex === 0 || name === 'Ponte') {
        lines.push({
          id: demoId(`lyric:${number}:${blockIndex}:blank`),
          text: '',
          startTimeMs: null,
        });
      }
      if (name === 'Ponte') {
        lines.push({
          id: demoId(`lyric:${number}:${blockIndex}:separator`),
          kind: 'separator',
          text: '',
          startTimeMs: null,
        });
      }
      return { id: demoId(`lyric:${number}:block:${blockIndex}`), name, lines };
    }),
  };
}

export function buildDemoBandData() {
  const keys = [
    'C',
    'Am',
    'D',
    'Dm',
    'E',
    'Em',
    'F',
    'F#m',
    'G',
    'Gm',
    'A',
    'Bb',
    'Bm',
    'Eb',
    'C#m',
  ];
  const songs = artists.flatMap((artist, artistIndex) =>
    artist.songs.map((entry, songIndex) => {
      const number = artistIndex * 6 + songIndex + 1;
      const lyricStatus =
        songIndex === 5
          ? 'missing'
          : songIndex < 2
            ? 'static'
            : songIndex === 2
              ? 'incomplete'
              : songIndex === 3
                ? 'synchronized'
                : artistIndex % 2 === 0
                  ? 'incomplete'
                  : 'synchronized';
      const durationMs =
        number % 13 === 0
          ? null
          : number === 7
            ? 47_000
            : number === 32
              ? 480_000
              : 150_000 + ((number * 37) % 240) * 1_000;
      const archived = songIndex === 5 && artistIndex % 2 === 0;
      // Exemplos com vídeo nos estados estático, incompleto e sincronizado.
      const hasReference = [1, 3, 4, 37, 51, 64].includes(number);
      const note = [
        `Estilo: ${artist.style}. ${number % 2 === 0 ? 'Começar com dinâmica suave; abrir o refrão em duas vozes.' : 'Entrada do baixo após quatro compassos; encerrar em conjunto.'}`,
        archived
          ? 'Arranjo arquivado, preservado no histórico de apresentações.'
          : '',
        lyricStatus === 'missing'
          ? artistIndex % 2 === 0
            ? 'Instrumental: tocar sem letra.'
            : 'Letra ainda não cadastrada; usar este exemplo para testar o cadastro.'
          : '',
        hasReference
          ? 'Referência técnica do YouTube usada no protótipo; não é uma gravação desta composição fictícia.'
          : '',
      ]
        .filter(Boolean)
        .join('\n');
      return {
        id: demoId(`song:${number}`),
        number,
        title: entry[0],
        originalArtist: number === 17 || number === 53 ? null : artist.name,
        musicalKey: number % 17 === 0 ? null : keys[(number - 1) % keys.length],
        bpm: number % 11 === 0 ? null : 64 + ((number * 7) % 118),
        estimatedDurationMs: durationMs,
        youtubeReference: hasReference
          ? 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
          : null,
        lyricStatus,
        lyrics: makeLyrics(entry, artist, number, lyricStatus, durationMs),
        notes:
          number % 10 === 0 && lyricStatus !== 'missing' && !hasReference
            ? null
            : note,
        archived,
      };
    }),
  );

  // Seis músicas ativas da última banda ficam sem coleção para exercitar esse filtro.
  const collectionPool = songs.filter(
    (song) => !song.archived && song.number < 67,
  );
  const collectionDefinitions = [
    ['Festa no Quintal', 16, (song) => (song.bpm ?? 0) >= 100],
    ['Ar Livre', 18, () => true],
    ['Acústico de Apartamento', 14, (song) => song.lyricStatus === 'static'],
    ['Dançante sem Vergonha', 20, (song) => (song.bpm ?? 0) >= 105],
    ['Festival do Boleto', 24, () => true],
    [
      'Underground de Garagem',
      16,
      (song) =>
        song.number <= 6 ||
        (song.number >= 31 && song.number <= 36) ||
        (song.number >= 43 && song.number <= 48),
    ],
    ['Domingo no Sofá', 12, (song) => (song.bpm ?? 90) <= 115],
    ['Forró da Tomada', 10, (song) => song.number >= 13 && song.number <= 30],
    ['Samba da Segunda-feira', 14, (song) => song.number >= 49],
    ['Bis: Só Mais Uma!', 8, (song) => song.lyricStatus !== 'missing'],
    [
      'Ensaio — Sincronização',
      12,
      (song) =>
        song.lyricStatus === 'incomplete' ||
        song.lyricStatus === 'synchronized',
    ],
    ['Clássicos que Ninguém Conhece', 20, () => true],
  ];
  const collections = collectionDefinitions.map(
    ([name, count, predicate], index) => {
      const matching = collectionPool.filter(predicate);
      const rotation = (index * 3) % matching.length;
      const ordered = [
        ...matching.slice(rotation),
        ...matching.slice(0, rotation),
      ];
      return {
        id: demoId(`collection:${index + 1}`),
        number: index + 1,
        name,
        songIds: ordered.slice(0, count).map((song) => song.id),
      };
    },
  );
  collections.push({
    id: demoId('collection:13'),
    number: 13,
    name: 'Ideias para o próximo ensaio',
    songIds: [],
  });

  const active = songs.filter((song) => !song.archived);
  const archived = songs.filter((song) => song.archived);
  const blockNames = [
    'Abertura — acordando o bairro',
    'Primeiro giro de refrões',
    'Respiro acústico',
    'Todo mundo no compasso',
    'Bis — prometemos que é a última',
  ];
  const planning = [
    'Apresentar a Banda Demo e convidar o público para cantar o próximo refrão.',
    'Trocar o violão, conferir a afinação e combinar a entrada com quatro compassos.',
    'Pausa para água. Manter o groove leve enquanto a próxima voz assume o microfone.',
    'Agradecer à equipe e à plateia; anunciar o bloco seguinte sem perder o ritmo.',
    'Improviso livre com participação da plateia; duração combinada durante o ensaio.',
  ];
  const shows = showCatalog.map(([name, venue, dayOffset, time], showIndex) => {
    const futureIndex = showIndex - 8;
    const status =
      showIndex < 8
        ? [3, 7].includes(showIndex)
          ? 'cancelled'
          : 'ready'
        : [8, 17].includes(futureIndex)
          ? 'cancelled'
          : [0, 3, 5, 7, 10, 12, 14, 21].includes(futureIndex)
            ? 'ready'
            : 'draft';
    const blockCount = 2 + (showIndex % 4);
    const showSongs = [8, 29].includes(showIndex)
      ? active.filter((song) => song.lyricStatus === 'synchronized')
      : active;
    const firstSong = showSongs[(showIndex * 7) % showSongs.length];
    let cursor = showIndex * 7;
    const blocks = Array.from({ length: blockCount }, (_, blockIndex) => {
      const key = `show:${showIndex + 1}:block:${blockIndex}`;
      const items = [
        {
          type: 'planning',
          description: planning[(showIndex + blockIndex) % planning.length],
          estimatedDurationMs:
            blockIndex === 0 ? 45_000 : blockIndex % 2 === 0 ? null : 90_000,
        },
      ];
      const songCount = 5 + ((showIndex + blockIndex) % 2);
      for (let itemIndex = 0; itemIndex < songCount; itemIndex++) {
        let song = showSongs[cursor++ % showSongs.length];
        if (showIndex < 8 && blockIndex === 0 && itemIndex === 2)
          song = archived[showIndex % archived.length];
        // Reprise intencional: a mesma música pode aparecer em dois blocos.
        if (
          showIndex % 5 === 0 &&
          blockIndex === blockCount - 1 &&
          itemIndex === songCount - 1
        )
          song = firstSong;
        items.push({
          type: 'song',
          songId: song.id,
          notes:
            itemIndex === 0
              ? 'Entrada conjunta após a contagem. Olhar para o baterista.'
              : itemIndex === songCount - 1
                ? 'Segurar o último acorde; esperar o sinal antes da próxima entrada.'
                : itemIndex % 3 === 0
                  ? 'Refrão em duas vozes. Reduzir a dinâmica na ponte.'
                  : null,
        });
        if (itemIndex === 2) items.push({ type: 'separator' });
      }
      items.push({
        type: 'planning',
        description:
          blockIndex === blockCount - 1
            ? 'Agradecimento final e saída em conjunto. Conferir instrumentos e cabos.'
            : 'Transição sem silêncio: teclado sustenta o acorde enquanto o próximo bloco começa.',
        estimatedDurationMs: showIndex % 4 === 0 ? null : 30_000,
      });
      return {
        id: demoId(key),
        name:
          blockIndex === blockCount - 1
            ? blockNames[4]
            : blockNames[blockIndex],
        items: items.map((item, index) => ({
          id: demoId(`${key}:item:${index}`),
          ...item,
        })),
      };
    });
    return {
      id: demoId(`show:${showIndex + 1}`),
      number: showIndex + 1,
      name,
      venue,
      dayOffset,
      time,
      status,
      notes:
        status === 'cancelled'
          ? 'Evento cancelado para demonstrar o filtro de status. Manter o setlist como referência para uma nova data.'
          : showIndex % 4 === 0
            ? null
            : `${dayOffset < 0 ? 'Apresentação passada de demonstração.' : 'Programação fictícia da Banda Demo.'}\nPassagem de som uma hora antes; levar extensão, água e a melhor disposição.`,
      blocks,
    };
  });
  return {
    version: 1,
    band: {
      id: demoId('band'),
      name: 'Banda Demo',
      ownerEmail: 'asillos@gmail.com',
    },
    songs,
    collections,
    shows,
  };
}
