#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const htmlPaths = process.argv.slice(2).map((path) => resolve(path));

if (!htmlPaths.length) {
  throw new Error('Informe um ou mais arquivos HTML publicados pelo Pages.');
}

for (const htmlPath of htmlPaths) {
  const html = await readFile(htmlPath, 'utf8');
  const headTag = html.match(/<head(?:\s[^>]*)?>/iu)?.[0];

  if (!headTag) {
    throw new Error(`Não foi possível localizar o <head> em ${htmlPath}.`);
  }

  if (html.includes('data-setlist-fallback-base')) {
    console.log(`Base do HTML já configurada em ${htmlPath}.`);
    continue;
  }

  const bootstrap = `<script data-setlist-fallback-base>(function(){var path=window.location.pathname;var isGitHubPages=window.location.hostname.endsWith('.github.io');var base=isGitHubPages?'/setlist/app/':(path==='/app'||path.startsWith('/app/'))?'/app/':'/';document.write('<base href="'+base+'">')})();</script>`;
  const output = html.replace(headTag, `${headTag}${bootstrap}`);

  await writeFile(htmlPath, output, 'utf8');
  console.log(`Base dinâmica adicionada ao HTML: ${htmlPath}.`);
}
