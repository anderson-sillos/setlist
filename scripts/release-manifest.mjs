#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

import { checkTag } from './release-version.mjs';

const BUILD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIVATE_FIELD_PATTERN =
  /(?:artifact|archive.?url|download|token|signature|authorization|access.?key|secret)/i;
const NATIVE_ARCHIVE_PATTERN = /\.(?:aab|apk|ipa)$/i;
const SIGNED_QUERY_PATTERN =
  /(?:^|[?&])(?:access_?token|token|signature|x-amz-[^=]*|awsaccesskeyid)=/i;
const EAS_ARTIFACT_PATH_PATTERN = /\/artifacts?(?:\/|$)/i;

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function getBuild(raw, platform) {
  const build = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
  if (Array.isArray(build))
    throw new Error(`Esperado exatamente um build ${platform} no arquivo EAS.`);
  return build;
}

function appIdentity(root) {
  const expo = readJson(resolve(root, 'app.json')).expo;
  const identity = {
    owner: expo.owner,
    slug: expo.slug,
    androidAppId: expo.android?.package,
    iosAppId: expo.ios?.bundleIdentifier,
  };
  if (!identity.owner || !identity.slug)
    throw new Error('A configuração Expo precisa declarar owner e slug.');
  return identity;
}

function buildDetailsUrl(identity, buildId) {
  if (!BUILD_ID_PATTERN.test(buildId))
    throw new Error('ID de build EAS inválido.');
  const owner = encodeURIComponent(identity.owner);
  const slug = encodeURIComponent(identity.slug);
  return `https://expo.dev/accounts/${owner}/projects/${slug}/builds/${buildId}`;
}

function validatePrivateArchive(build, platform) {
  const archiveUrl = build.artifacts?.applicationArchiveUrl;
  if (typeof archiveUrl !== 'string')
    throw new Error(`Build ${platform} não contém artefato de aplicação.`);
  let archive;
  try {
    archive = new URL(archiveUrl);
  } catch {
    throw new Error(`URL privada do artefato ${platform} inválida.`);
  }
  if (archive.protocol !== 'https:' || archive.hostname !== 'expo.dev')
    throw new Error(`Artefato privado ${platform} deve vir do EAS.`);

  const extension = archive.pathname.slice(archive.pathname.lastIndexOf('.'));
  if (platform === 'IOS') {
    if (
      build.buildProfile !== 'production' ||
      extension.toLowerCase() !== '.ipa'
    )
      throw new Error('A distribuição iOS exige IPA do perfil production.');
    if (build.distribution !== 'STORE')
      throw new Error('A distribuição iOS exige o canal STORE.');
    return;
  }

  if (build.buildProfile === 'production-android') {
    if (extension.toLowerCase() !== '.aab' || build.distribution !== 'STORE')
      throw new Error('O perfil production-android exige AAB do canal STORE.');
    return;
  }
  if (
    build.buildProfile === 'production-android-validation' &&
    extension.toLowerCase() === '.apk' &&
    build.distribution === 'INTERNAL'
  )
    return;

  throw new Error('Perfil ou formato Android não autorizado para a entrega.');
}

export function buildRecord(path, release, platform, identity) {
  if (!path) return null;
  const build = getBuild(readJson(path), platform);
  const expectedAppId =
    platform === 'IOS' ? identity.iosAppId : identity.androidAppId;
  if (
    build.status !== 'FINISHED' ||
    build.platform !== platform ||
    build.appVersion !== release.version ||
    build.gitCommitHash !== release.commit ||
    !BUILD_ID_PATTERN.test(build.id ?? '') ||
    !/^\d+$/.test(String(build.appBuildVersion ?? '')) ||
    build.appIdentifier !== expectedAppId ||
    build.app?.ownerAccount?.name !== identity.owner ||
    build.app?.slug !== identity.slug
  ) {
    throw new Error(
      `Build ${platform} incompleto ou diferente da versão/commit/app do release.`,
    );
  }
  validatePrivateArchive(build, platform);

  return {
    id: build.id,
    version: build.appVersion,
    build: String(build.appBuildVersion),
    commit: build.gitCommitHash,
    profile: build.buildProfile,
    distribution: build.distribution,
    buildDetailsUrl: buildDetailsUrl(identity, build.id),
    validation: 'pending',
  };
}

function assertNoPrivateFields(value, path = 'manifest') {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoPrivateFields(item, `${path}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_FIELD_PATTERN.test(key.replaceAll(/[-_]/g, '')))
      throw new Error(`Campo privado não permitido em ${path}.${key}.`);
    assertNoPrivateFields(child, `${path}.${key}`);
  }
}

export function assertPublicManifestSafe(manifest) {
  assertNoPrivateFields(manifest);
  const inspect = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspect(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value))
        inspect(child, `${path}.${key}`);
      return;
    }
    if (typeof value !== 'string') return;
    const urls = value.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
    if (/(?:token|signature|authorization)\s*[:=]\s*\S{8,}/i.test(value))
      throw new Error(`Possível credencial temporária em ${path}.`);
    for (const rawUrl of urls) {
      const candidate = rawUrl.replace(/[),.;]+$/, '');
      let url;
      try {
        url = new URL(candidate);
      } catch {
        throw new Error(`URL pública inválida em ${path}.`);
      }
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        NATIVE_ARCHIVE_PATTERN.test(url.pathname) ||
        (url.hostname === 'expo.dev' &&
          EAS_ARTIFACT_PATH_PATTERN.test(url.pathname))
      )
        throw new Error(`URL privada ou insegura não permitida em ${path}.`);
    }
  };
  inspect(manifest, 'manifest');
}

export function assertPublicReleaseMetadata(metadata, expectedTag) {
  if (metadata.tagName !== expectedTag || metadata.isDraft)
    throw new Error('A Release precisa estar publicada com a tag exata.');
  const candidate = /-rc\.[1-9]\d*$/.test(expectedTag);
  if (metadata.isPrerelease !== candidate)
    throw new Error('O tipo de Release não corresponde à tag informada.');

  const body = String(metadata.body ?? '');
  if (
    /(?:token|signature|authorization|access_?key)\s*[:=]\s*\S{8,}/i.test(body)
  )
    throw new Error(
      'As notas da Release podem conter uma credencial temporária.',
    );
  const urls = body.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const rawUrl of urls) {
    const value = rawUrl.replace(/[),.;]+$/, '');
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('As notas da Release contêm uma URL inválida.');
    }
    if (
      NATIVE_ARCHIVE_PATTERN.test(url.pathname) ||
      (url.hostname === 'expo.dev' &&
        EAS_ARTIFACT_PATH_PATTERN.test(url.pathname)) ||
      SIGNED_QUERY_PATTERN.test(url.search)
    )
      throw new Error(
        'As notas da Release contêm um link privado de artefato.',
      );
  }

  const assets = metadata.assets ?? [];
  if (!Array.isArray(assets))
    throw new Error('A lista de ativos da Release é inválida.');
  for (const asset of assets) {
    if (NATIVE_ARCHIVE_PATTERN.test(String(asset.name ?? '')))
      throw new Error(
        'A Release não pode publicar AAB, IPA ou APK diretamente.',
      );
  }
  if (assets.length !== 1 || assets[0]?.name !== 'release-manifest.json')
    throw new Error('A Release deve publicar somente release-manifest.json.');
}

export function verifyPublicManifestCopies(
  paths,
  release,
  identity,
  ready = false,
  expectedContents,
) {
  if (!Array.isArray(paths) || paths.length !== 2)
    throw new Error('Informe os dois caminhos do manifesto público.');
  const contents = paths.map((path) => readFileSync(path, 'utf8'));
  if (contents[0] !== contents[1])
    throw new Error('Os manifestos públicos Web e /app são diferentes.');
  if (
    expectedContents !== undefined &&
    contents.some((contents) => contents !== expectedContents)
  )
    throw new Error(
      'Os manifestos públicos não correspondem ao registro validado.',
    );
  const manifest = JSON.parse(contents[0]);
  validateManifest(manifest, release, identity, ready);
  assertPublicManifestSafe(manifest);
  return manifest;
}

export function validateManifest(manifest, release, identity, ready = false) {
  assertPublicManifestSafe(manifest);
  if (
    manifest.schemaVersion !== 2 ||
    manifest.version !== release.version ||
    manifest.commit !== release.commit
  ) {
    throw new Error(
      'Manifesto seguro não corresponde à versão e ao commit da tag.',
    );
  }
  if (
    manifest.tag !== release.tag &&
    manifest.tag !== `v${release.version}` &&
    !new RegExp(
      `^v${release.version.replaceAll('.', '\\.')}\\-rc\\.[1-9]\\d*$`,
    ).test(manifest.tag)
  ) {
    throw new Error('Tag do manifesto não corresponde à entrega.');
  }

  for (const [platform, easPlatform, profile, extension] of [
    ['android', 'ANDROID', 'production-android', '.aab'],
    ['ios', 'IOS', 'production', '.ipa'],
  ]) {
    const build = manifest.platforms?.[platform];
    if (!build) {
      if (ready) throw new Error(`Build ${platform} ausente no manifesto.`);
      continue;
    }
    if (
      build.version !== release.version ||
      build.commit !== release.commit ||
      !BUILD_ID_PATTERN.test(build.id ?? '') ||
      !/^\d+$/.test(String(build.build ?? '')) ||
      !['pending', 'passed'].includes(build.validation) ||
      build.buildDetailsUrl !== buildDetailsUrl(identity, build.id)
    )
      throw new Error(`Registro ${platform} divergente ou inseguro.`);
    if (ready && build.validation !== 'passed')
      throw new Error(`A validação ${platform} ainda não foi concluída.`);

    if (
      build.profile !== profile ||
      build.distribution !== 'STORE' ||
      !build.buildDetailsUrl.endsWith(`/${build.id}`)
    )
      throw new Error(
        `O registro ${platform} exige build de loja do perfil ${profile} (${extension}).`,
      );
  }

  const web = manifest.platforms?.web;
  if (
    web &&
    (web.version !== release.version ||
      web.commit !== release.commit ||
      web.url !== 'https://setlistbr.app.br' ||
      !['pending', 'passed'].includes(web.validation))
  )
    throw new Error('Registro Web divergente ou inseguro.');
  if (ready && (!web || web.validation !== 'passed'))
    throw new Error('A validação Web ainda não foi concluída.');
}

function main() {
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
      'release-metadata': { type: 'string' },
      'verify-release-copy': { type: 'string' },
      'verify-app-copy': { type: 'string' },
      ready: { type: 'boolean', default: false },
    },
  });
  if (!values.tag) throw new Error('Informe --tag.');
  const root = resolve(values.root);
  const release = checkTag(root, values.tag);
  const identity = appIdentity(root);
  const releaseMetadata = values['release-metadata']
    ? readJson(values['release-metadata'])
    : undefined;
  if (releaseMetadata)
    assertPublicReleaseMetadata(releaseMetadata, release.tag);

  const manifest = values.manifest
    ? readJson(values.manifest)
    : {
        schemaVersion: 2,
        ...release,
        createdAt: new Date().toISOString(),
        platforms: {
          android: buildRecord(values.android, release, 'ANDROID', identity),
          ios: buildRecord(values.ios, release, 'IOS', identity),
          web: {
            version: release.version,
            commit: release.commit,
            url: 'https://setlistbr.app.br',
            validation: 'pending',
          },
        },
        migrations: [],
      };
  validateManifest(manifest, release, identity, values.ready);
  if (
    Boolean(values['verify-release-copy']) !==
    Boolean(values['verify-app-copy'])
  )
    throw new Error(
      'Informe --verify-release-copy e --verify-app-copy juntos.',
    );
  if (values['verify-release-copy'] && values['verify-app-copy']) {
    if (!values.manifest)
      throw new Error('A verificação de cópias exige --manifest.');
    verifyPublicManifestCopies(
      [values['verify-release-copy'], values['verify-app-copy']],
      release,
      identity,
      values.ready,
      readFileSync(values.manifest, 'utf8'),
    );
  }
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
      schemaVersion: manifest.schemaVersion,
    }),
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
