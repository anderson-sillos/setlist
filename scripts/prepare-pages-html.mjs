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

  let output = html;

  if (!output.includes('data-setlist-entry-loader')) {
    const entryScript = output.match(
      /<script\b[^>]*\bsrc=["']\.\/_expo\/static\/js\/web\/entry-([^"']+\.js)["'][^>]*>\s*<\/script>/iu,
    );

    if (!entryScript) {
      throw new Error(
        `Não foi possível localizar o bundle web do Expo em ${htmlPath}.`,
      );
    }

    const entryBundle = `entry-${entryScript[1]}`;
    const entryLoader = `<script data-setlist-entry-loader>(function(){var path=window.location.pathname;var isGitHubPages=window.location.hostname.endsWith('.github.io');var base=isGitHubPages?'/setlist/app/':(path==='/app'||path.startsWith('/app/'))?'/app/':'/';document.write('<script src="'+base+'_expo/static/js/web/${entryBundle}" defer><\\/script>')})();</script>`;
    output = output.replace(entryScript[0], entryLoader);
  }

  if (!output.includes('data-setlist-fallback-base')) {
    const bootstrap = `<script data-setlist-fallback-base>(function(){var path=window.location.pathname;var isGitHubPages=window.location.hostname.endsWith('.github.io');var base=isGitHubPages?'/setlist/app/':(path==='/app'||path.startsWith('/app/'))?'/app/':'/';document.write('<base href="'+base+'">')})();</script>`;
    output = output.replace(headTag, `${headTag}${bootstrap}`);
  }

  if (output === html) {
    console.log(`HTML já preparado para o Pages: ${htmlPath}.`);
    continue;
  }

  await writeFile(htmlPath, output, 'utf8');
  console.log(`Base e bundle web preparados para o Pages: ${htmlPath}.`);
}
