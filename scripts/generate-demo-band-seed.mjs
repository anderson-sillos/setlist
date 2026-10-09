import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { buildDemoBandData } from './demo-band-data.mjs';

const target = new URL('../supabase/seeds/banda-demo.sql', import.meta.url);
const template = await readFile(
  new URL('./demo-band-seed.template.sql', import.meta.url),
  'utf8',
);
const data = buildDemoBandData();
// Uma entidade por linha mantém o artefato compacto; o catálogo é a fonte editável.
const payload = `{
  "version": ${data.version},
  "band": ${JSON.stringify(data.band)},
  "songs": [
${data.songs.map((song) => `    ${JSON.stringify(song)}`).join(',\n')}
  ],
  "collections": [
${data.collections.map((collection) => `    ${JSON.stringify(collection)}`).join(',\n')}
  ],
  "shows": [
${data.shows.map((show) => `    ${JSON.stringify(show)}`).join(',\n')}
  ]
}`;
const sql = template.replace('__DEMO_PAYLOAD__', payload);
if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8');
  if (current !== sql)
    throw new Error(
      'Seed desatualizado. Execute node scripts/generate-demo-band-seed.mjs.',
    );
  console.log('Seed SQL corresponde ao catálogo e ao gerador.');
} else {
  await writeFile(target, sql, 'utf8');
  console.log(`Seed gerado: ${fileURLToPath(target)}`);
  console.log(
    `${data.songs.length} músicas, ${data.collections.length} coleções, ${data.shows.length} shows.`,
  );
}
