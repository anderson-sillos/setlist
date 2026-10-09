import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveLyricStatus } from '../../src/domain/lyricStatus.ts';
import { buildDemoBandData } from '../demo-band-data.mjs';

const data = buildDemoBandData();
const songsById = new Map(data.songs.map((song) => [song.id, song]));
const countBy = (items, field) =>
  Object.fromEntries(
    [...new Set(items.map((item) => item[field]))]
      .sort()
      .map((value) => [
        value,
        items.filter((item) => item[field] === value).length,
      ]),
  );

test('banda, catálogo e calendário atendem à escala solicitada', () => {
  assert.equal(data.band.name, 'Banda Demo');
  assert.equal(data.band.ownerEmail, 'asillos@gmail.com');
  assert.equal(data.songs.length, 72);
  assert.equal(data.songs.filter((song) => !song.archived).length, 66);
  assert.equal(
    new Set(data.songs.map((song) => song.originalArtist).filter(Boolean)).size,
    12,
  );
  assert.equal(data.shows.length, 30);
  assert.equal(data.shows.filter((show) => show.dayOffset < 0).length, 8);
  assert.equal(
    data.shows.filter((show) => show.dayOffset > 0 && show.dayOffset <= 88)
      .length,
    22,
  );
  assert.deepEqual(countBy(data.shows, 'status'), {
    cancelled: 4,
    draft: 12,
    ready: 14,
  });
});

test('documentos são interpretados pelo app nos quatro estados de letra', () => {
  assert.deepEqual(countBy(data.songs, 'lyricStatus'), {
    incomplete: 18,
    missing: 12,
    static: 24,
    synchronized: 18,
  });
  for (const song of data.songs) {
    assert.equal(deriveLyricStatus(song.lyrics), song.lyricStatus, song.title);
    const blockIds = song.lyrics.blocks.map((block) => block.id);
    const lines = song.lyrics.blocks.flatMap((block) => block.lines);
    assert.equal(new Set(blockIds).size, blockIds.length);
    assert.equal(new Set(lines.map((line) => line.id)).size, lines.length);
    const timed = lines.filter((line) => line.startTimeMs !== null);
    assert.ok(
      timed.every(
        (line) =>
          Number.isSafeInteger(line.startTimeMs) && line.startTimeMs >= 0,
      ),
    );
    if (song.estimatedDurationMs !== null)
      assert.ok(
        timed.every((line) => line.startTimeMs < song.estimatedDurationMs),
      );
  }
  const textLines = (song) =>
    song.lyrics.blocks
      .flatMap((block) => block.lines)
      .filter((line) => line.text.trim());
  assert.ok(
    data.songs.some(
      (song) =>
        song.lyricStatus === 'incomplete' &&
        textLines(song).every((line) => line.startTimeMs !== null),
    ),
    'há sincronização com tempos fora de ordem',
  );
  assert.ok(
    data.songs.some((song) =>
      song.lyrics.blocks.some((block) => block.lines.some((line) => line.bold)),
    ),
  );
  assert.ok(
    data.songs.some((song) =>
      song.lyrics.blocks.some((block) =>
        block.lines.some((line) => line.kind === 'separator'),
      ),
    ),
  );
  assert.ok(
    data.songs.some((song) =>
      song.lyrics.blocks.some((block) => block.name === null),
    ),
  );
});

test('coleções têm ordem própria, sobreposição, estado vazio e músicas sem coleção', () => {
  assert.equal(
    data.collections.filter((collection) => collection.songIds.length >= 8)
      .length,
    12,
  );
  assert.equal(
    data.collections.filter((collection) => collection.songIds.length === 0)
      .length,
    1,
  );
  assert.equal(
    new Set(
      data.collections.map((collection) =>
        collection.name.trim().toLowerCase(),
      ),
    ).size,
    data.collections.length,
  );
  const participating = data.collections.flatMap(
    (collection) => collection.songIds,
  );
  for (const collection of data.collections) {
    assert.equal(new Set(collection.songIds).size, collection.songIds.length);
    assert.ok(
      collection.songIds.every(
        (id) => songsById.has(id) && !songsById.get(id).archived,
      ),
    );
  }
  assert.ok(
    new Set(participating).size < participating.length,
    'a mesma música participa de várias coleções',
  );
  assert.ok(
    data.songs.some(
      (song) => !song.archived && !participating.includes(song.id),
    ),
  );
});

test('todos os setlists têm vínculos válidos, blocos, anotações e separadores', () => {
  for (const show of data.shows) {
    assert.ok(show.blocks.length >= 2 && show.blocks.length <= 5);
    const items = show.blocks.flatMap((block) => block.items);
    assert.ok(items.filter((item) => item.type === 'song').length >= 10);
    assert.ok(items.some((item) => item.type === 'planning'));
    assert.ok(items.some((item) => item.type === 'separator'));
    for (const item of items) {
      if (item.type === 'song') assert.ok(songsById.has(item.songId));
      if (item.type !== 'song') assert.equal(item.notes, undefined);
      if (item.type === 'planning') assert.ok(item.description.trim());
    }
  }
  const ids = [
    data.band.id,
    ...data.songs.map((song) => song.id),
    ...data.collections.map((collection) => collection.id),
    ...data.shows.flatMap((show) => [
      show.id,
      ...show.blocks.flatMap((block) => [
        block.id,
        ...block.items.map((item) => item.id),
      ]),
    ]),
  ];
  assert.equal(new Set(ids).size, ids.length, 'ids são globalmente únicos');
  assert.ok(
    data.shows.some(
      (show) =>
        show.status === 'ready' &&
        show.blocks
          .flatMap((block) => block.items)
          .filter((item) => item.type === 'song')
          .every(
            (item) => songsById.get(item.songId).lyricStatus === 'synchronized',
          ),
    ),
  );
  assert.ok(
    data.shows.some((show) => {
      const songIds = show.blocks
        .flatMap((block) => block.items)
        .filter((item) => item.type === 'song')
        .map((item) => item.songId);
      return new Set(songIds).size < songIds.length;
    }),
    'há reprise de uma música no mesmo show',
  );
});

test('catálogo mantém ids e conteúdo entre gerações', () => {
  assert.deepEqual(buildDemoBandData(), data);
});
