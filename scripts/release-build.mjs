#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { checkTag } from './release-version.mjs';

try {
  const { values } = parseArgs({
    options: {
      tag: { type: 'string' },
      platform: { type: 'string', default: 'all' },
      apk: { type: 'boolean', default: false },
    },
  });
  if (!values.tag) throw new Error('Informe --tag vX.Y.Z-rc.N.');
  if (!['all', 'android', 'ios'].includes(values.platform))
    throw new Error('Plataforma inválida.');
  const release = checkTag(process.cwd(), values.tag);
  const dirty = execFileSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  }).trim();
  if (dirty)
    throw new Error(
      'Gere builds em um checkout limpo da tag, sem arquivos pendentes.',
    );
  const platforms =
    values.platform === 'all' ? ['android', 'ios'] : [values.platform];
  mkdirSync('release-output', { recursive: true });

  for (const platform of platforms) {
    const profile =
      platform === 'ios'
        ? 'production'
        : values.apk
          ? 'production-android-validation'
          : 'production-android';
    const args = [
      'build',
      '--platform',
      platform,
      '--profile',
      profile,
      '--non-interactive',
      '--no-wait',
      '--freeze-credentials',
      '--json',
      '--message',
      `Setlist ${release.tag} - ${release.commit}`,
    ];
    const output = process.env.EAS_CLI
      ? execFileSync(process.env.EAS_CLI, args, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'inherit'],
        })
      : execFileSync(
          process.platform === 'win32' ? 'npx.cmd' : 'npx',
          ['--yes', 'eas-cli@23.2.0', ...args],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
        );
    const builds = JSON.parse(output);
    const records = (Array.isArray(builds) ? builds : [builds]).map(
      (build) => ({
        id: build.id,
        platform: build.platform,
        buildProfile: build.buildProfile,
        status: build.status,
        appVersion: build.appVersion,
        appBuildVersion: build.appBuildVersion,
        gitCommitHash: build.gitCommitHash,
      }),
    );
    if (
      records.length !== 1 ||
      records.some(
        (build) =>
          !build.id ||
          build.platform !== platform.toUpperCase() ||
          build.buildProfile !== profile ||
          build.gitCommitHash !== release.commit ||
          build.appVersion !== release.version,
      )
    ) {
      throw new Error(
        'O EAS retornou um build com código ou versão divergente. Confira antes de usar o artefato.',
      );
    }
    const path = resolve(
      'release-output',
      `${platform}${values.apk && platform === 'android' ? '-apk' : ''}-requested.json`,
    );
    writeFileSync(path, `${JSON.stringify(records, null, 2)}\n`);
    console.log(JSON.stringify({ tag: release.tag, records, savedTo: path }));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
