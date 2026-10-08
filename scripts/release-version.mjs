#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const versionPattern = '(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)';

export function parseReleaseTag(tag) {
  const match = new RegExp(`^v(${versionPattern})(-rc\\.[1-9]\\d*)?$`).exec(
    tag,
  );
  if (!match) throw new Error('Use uma tag vX.Y.Z ou vX.Y.Z-rc.N.');
  return { version: match[1], candidate: tag.includes('-rc.') };
}

export function readVersion(root = process.cwd()) {
  const files = ['app.json', 'package.json', 'package-lock.json'].map(
    (name) => ({
      name,
      path: resolve(root, name),
      data: JSON.parse(readFileSync(resolve(root, name), 'utf8')),
    }),
  );
  const version = files[0].data.expo.version;
  if (!new RegExp(`^${versionPattern}$`).test(version)) {
    throw new Error(
      'expo.version deve ter o formato X.Y.Z, sem sufixo de candidato.',
    );
  }
  const versions = [
    files[1].data.version,
    files[2].data.version,
    files[2].data.packages?.['']?.version,
  ];
  if (versions.some((value) => value !== version)) {
    throw new Error(
      'Versões divergentes. Execute npm run release:version -- X.Y.Z.',
    );
  }
  return version;
}

export function checkTag(root, tag) {
  const { version, candidate } = parseReleaseTag(tag);
  if (readVersion(root) !== version) {
    throw new Error('A versão do aplicativo não corresponde à tag do release.');
  }
  const git = (args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const commit = git(['rev-parse', '--verify', `${tag}^{commit}`]);
  if (git(['rev-parse', 'HEAD']) !== commit) {
    throw new Error('O checkout deve estar no commit exato da tag.');
  }
  return { version, candidate, commit, tag };
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      root: { type: 'string', default: process.cwd() },
      tag: { type: 'string' },
      set: { type: 'boolean', default: false },
    },
  });
  if (values.set) {
    const version = positionals[0];
    if (
      positionals.length !== 1 ||
      !new RegExp(`^${versionPattern}$`).test(version ?? '')
    ) {
      throw new Error('Use npm run release:version -- X.Y.Z.');
    }
    // Validate all inputs before writing any file. Dependencies are preserved.
    const files = ['app.json', 'package.json', 'package-lock.json'].map(
      (name) => ({
        path: resolve(values.root, name),
        data: JSON.parse(readFileSync(resolve(values.root, name), 'utf8')),
      }),
    );
    files[0].data.expo.version = version;
    files[1].data.version = version;
    files[2].data.version = version;
    files[2].data.packages[''].version = version;
    for (const { path, data } of files) {
      writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    }
  } else if (positionals.length) {
    throw new Error('Argumentos não reconhecidos.');
  }
  console.log(
    JSON.stringify(
      values.tag
        ? checkTag(values.root, values.tag)
        : { version: readVersion(values.root) },
    ),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
