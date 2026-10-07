#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { checkTag } from './release-version.mjs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function buildRecord(path, release, platform) {
  if (!path) return null;
  const raw = readJson(path);
  const build = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
  if (
    build.status !== 'FINISHED' ||
    build.platform !== platform ||
    build.appVersion !== release.version ||
    build.gitCommitHash !== release.commit ||
    !build.id ||
    !build.appBuildVersion ||
    !build.artifacts?.applicationArchiveUrl
  ) {
    throw new Error(
      `Build ${platform} incompleto ou diferente da versão/commit do release.`,
    );
  }
  const profiles =
    platform === 'IOS'
      ? ['production']
      : ['production-android', 'production-android-validation'];
  if (!profiles.includes(build.buildProfile))
    throw new Error(`Perfil ${platform} não autorizado para produção.`);
  const artifactUrl = build.artifacts.applicationArchiveUrl;
  const artifact = new URL(artifactUrl);
  if (artifact.protocol !== 'https:' || artifact.hostname !== 'expo.dev')
    throw new Error('Artefato deve ser um endereço HTTPS do EAS.');
  return {
    id: build.id,
    version: build.appVersion,
    build: String(build.appBuildVersion),
    commit: build.gitCommitHash,
    profile: build.buildProfile,
    distribution: build.distribution,
    artifactUrl,
    validation: 'pending',
  };
}

function validateManifest(manifest, release, ready) {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.version !== release.version ||
    manifest.commit !== release.commit
  ) {
    throw new Error('Manifesto não corresponde à versão e ao commit da tag.');
  }
  // A stable tag may promote an already validated candidate of the same commit.
  if (
    manifest.tag !== release.tag &&
    manifest.tag !== `v${release.version}` &&
    !new RegExp(
      `^v${release.version.replaceAll('.', '\\.')}\\-rc\\.[1-9]\\d*$`,
    ).test(manifest.tag)
  ) {
    throw new Error('Tag do manifesto não corresponde à entrega.');
  }
  for (const platform of ['android', 'ios']) {
    const build = manifest.platforms?.[platform];
    if (
      build &&
      (build.version !== release.version || build.commit !== release.commit)
    )
      throw new Error(`Registro ${platform} divergente.`);
    if (
      ready &&
      (!build ||
        build.validation !== 'passed' ||
        !build.id ||
        !build.build ||
        !build.artifactUrl)
    )
      throw new Error(`A validação ${platform} ainda não foi concluída.`);
    if (
      ready &&
      platform === 'android' &&
      (build.profile !== 'production-android' ||
        !build.artifactUrl.endsWith('.aab'))
    )
      throw new Error(
        'A distribuição Google Play exige o AAB validado do perfil production-android.',
      );
    if (
      ready &&
      platform === 'ios' &&
      (build.profile !== 'production' ||
        build.distribution !== 'STORE' ||
        !build.artifactUrl.endsWith('.ipa'))
    )
      throw new Error(
        'A distribuição iOS exige o IPA validado do perfil production.',
      );
  }
  const web = manifest.platforms?.web;
  if (
    ready &&
    (!web ||
      web.version !== release.version ||
      web.commit !== release.commit ||
      web.validation !== 'passed')
  )
    throw new Error('A validação Web ainda não foi concluída.');
}

try {
  const { values } = parseArgs({
    options: {
      tag: { type: 'string' },
      root: { type: 'string', default: process.cwd() },
      android: { type: 'string' },
      ios: { type: 'string' },
      output: {
        type: 'string',
        default: 'release-output/release-manifest.json',
      },
      manifest: { type: 'string' },
      ready: { type: 'boolean', default: false },
    },
  });
  if (!values.tag) throw new Error('Informe --tag.');
  const release = checkTag(values.root, values.tag);
  const manifest = values.manifest
    ? readJson(values.manifest)
    : {
        schemaVersion: 1,
        ...release,
        createdAt: new Date().toISOString(),
        platforms: {
          android: buildRecord(values.android, release, 'ANDROID'),
          ios: buildRecord(values.ios, release, 'IOS'),
          web: {
            version: release.version,
            commit: release.commit,
            url: 'https://setlistbr.app.br',
            validation: 'pending',
          },
        },
        migrations: [],
      };
  validateManifest(manifest, release, values.ready);
  if (!values.manifest) {
    mkdirSync(dirname(resolve(values.output)), { recursive: true });
    writeFileSync(
      resolve(values.output),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  console.log(
    JSON.stringify({
      tag: release.tag,
      version: release.version,
      commit: release.commit,
      ready: values.ready,
    }),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
