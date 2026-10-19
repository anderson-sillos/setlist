import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  assertPublicReleaseMetadata,
  assertPublicManifestSafe,
  buildRecord,
  validateManifest,
  verifyPublicManifestCopies,
} from '../release-manifest.mjs';

const identity = {
  owner: 'anderson-silloss-team',
  slug: 'setlist',
  androidAppId: 'com.andersonsillos.setlist',
  iosAppId: 'com.andersonsillos.setlist',
};
const release = {
  version: '1.0.0',
  candidate: true,
  commit: 'd32840d61c1d2564cf5395c040712571bb762f8a',
  tag: 'v1.0.0-rc.4',
};
const ids = {
  android: '7a8874df-5744-46d1-a587-d183c03f0653',
  ios: 'f59ad69f-54f4-4458-90ba-f1d56c901a7a',
};

function withBuild(platform, callback, overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'setlist-release-manifest-'));
  const ios = platform === 'IOS';
  const extension = ios ? 'ipa' : 'aab';
  const build = {
    id: ios ? ids.ios : ids.android,
    status: 'FINISHED',
    platform,
    artifacts: {
      applicationArchiveUrl: `https://expo.dev/artifacts/eas/private.${extension}?token=temporary-secret`,
    },
    app: {
      slug: identity.slug,
      ownerAccount: { name: identity.owner },
    },
    distribution: 'STORE',
    buildProfile: ios ? 'production' : 'production-android',
    appIdentifier: ios ? identity.iosAppId : identity.androidAppId,
    appVersion: release.version,
    appBuildVersion: '6',
    gitCommitHash: release.commit,
    ...overrides,
  };
  const path = join(directory, 'build.json');
  writeFileSync(path, JSON.stringify(build));
  try {
    callback(path, build);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function validManifest(validation = 'pending') {
  const androidId = ids.android;
  const iosId = ids.ios;
  return {
    schemaVersion: 2,
    version: release.version,
    candidate: true,
    commit: release.commit,
    tag: release.tag,
    createdAt: '2026-10-19T00:00:00.000Z',
    platforms: {
      android: {
        id: androidId,
        version: release.version,
        build: '6',
        commit: release.commit,
        profile: 'production-android',
        distribution: 'STORE',
        buildDetailsUrl: `https://expo.dev/accounts/${identity.owner}/projects/${identity.slug}/builds/${androidId}`,
        validation,
      },
      ios: {
        id: iosId,
        version: release.version,
        build: '6',
        commit: release.commit,
        profile: 'production',
        distribution: 'STORE',
        buildDetailsUrl: `https://expo.dev/accounts/${identity.owner}/projects/${identity.slug}/builds/${iosId}`,
        validation,
      },
      web: {
        version: release.version,
        commit: release.commit,
        url: 'https://setlistbr.app.br',
        validation,
      },
    },
    migrations: [],
  };
}

test('gera referências EAS estáveis sem serializar URLs privadas de download', () => {
  for (const [platform, easPlatform] of [
    ['android', 'ANDROID'],
    ['ios', 'IOS'],
  ]) {
    withBuild(easPlatform, (path) => {
      const record = buildRecord(path, release, easPlatform, identity);
      assert.equal(record.id, ids[platform]);
      assert.equal(record.build, '6');
      assert.equal(
        record.buildDetailsUrl,
        `https://expo.dev/accounts/${identity.owner}/projects/${identity.slug}/builds/${ids[platform]}`,
      );
      assert.equal(JSON.stringify(record).includes('temporary-secret'), false);
      assert.equal(JSON.stringify(record).includes('/artifacts/eas/'), false);
    });
  }
});

test('recusa metadados EAS que divergem do commit ou perfil esperado', () => {
  withBuild(
    'ANDROID',
    (path) =>
      assert.throws(
        () => buildRecord(path, release, 'ANDROID', identity),
        /versão\/commit\/app/,
      ),
    { gitCommitHash: '0000000000000000000000000000000000000000' },
  );
  withBuild(
    'ANDROID',
    (path) =>
      assert.throws(
        () => buildRecord(path, release, 'ANDROID', identity),
        /Perfil ou formato/,
      ),
    { buildProfile: 'preview' },
  );
});

test('confere APK interno de validação sem tratá-lo como build de loja', () => {
  withBuild(
    'ANDROID',
    (path) => {
      const record = buildRecord(path, release, 'ANDROID', identity);
      assert.equal(record.profile, 'production-android-validation');
      assert.equal(record.distribution, 'INTERNAL');
      assert.equal(record.validation, 'pending');
    },
    {
      buildProfile: 'production-android-validation',
      distribution: 'INTERNAL',
      artifacts: {
        applicationArchiveUrl: 'https://expo.dev/artifacts/eas/private.apk',
      },
    },
  );
});

test('valida manifesto schema 2 e exige validação das três plataformas no fechamento', () => {
  const manifest = validManifest();
  assert.doesNotThrow(() => validateManifest(manifest, release, identity));
  assert.throws(
    () => validateManifest(manifest, release, identity, true),
    /A validação android ainda não foi concluída/,
  );

  const wrongPendingProfile = validManifest();
  wrongPendingProfile.platforms.android.profile = 'preview';
  assert.throws(
    () => validateManifest(wrongPendingProfile, release, identity),
    /registro android exige build de loja do perfil production-android/,
  );

  const readyManifest = validManifest('passed');
  assert.doesNotThrow(() =>
    validateManifest(readyManifest, release, identity, true),
  );
});

test('rejeita manifestos legados ou com links e campos privados', () => {
  const legacy = validManifest();
  legacy.schemaVersion = 1;
  legacy.platforms.android.artifactUrl =
    'https://expo.dev/artifacts/eas/private.aab?token=secret';
  assert.throws(
    () => validateManifest(legacy, release, identity),
    /Campo privado não permitido/,
  );

  const queryLink = validManifest();
  queryLink.platforms.android.buildDetailsUrl += '?token=secret';
  assert.throws(
    () => validateManifest(queryLink, release, identity),
    /URL privada ou insegura/,
  );

  const wrongProject = validManifest();
  wrongProject.platforms.ios.buildDetailsUrl = `https://expo.dev/accounts/another-team/projects/setlist/builds/${ids.ios}`;
  assert.throws(
    () => validateManifest(wrongProject, release, identity),
    /Registro ios divergente ou inseguro/,
  );

  const artifactRoute = validManifest();
  artifactRoute.platforms.android.buildDetailsUrl = `https://expo.dev/artifacts/eas/${ids.android}`;
  assert.throws(
    () => assertPublicManifestSafe(artifactRoute),
    /URL privada ou insegura/,
  );
});

test('bloqueia notas e ativos de Release com download nativo ou URL assinada', () => {
  const safe = {
    tagName: release.tag,
    isDraft: false,
    isPrerelease: true,
    body: 'Candidata RC.4. Build Android: https://expo.dev/accounts/team/projects/setlist/builds/7a8874df-5744-46d1-a587-d183c03f0653',
    assets: [{ name: 'release-manifest.json' }],
  };
  assert.doesNotThrow(() => assertPublicReleaseMetadata(safe, release.tag));

  assert.throws(
    () =>
      assertPublicReleaseMetadata(
        {
          ...safe,
          body: `${safe.body}\nhttps://expo.dev/artifacts/eas/app.aab?token=secret`,
        },
        release.tag,
      ),
    /link privado de artefato/,
  );
  assert.throws(
    () =>
      assertPublicReleaseMetadata(
        { ...safe, assets: [{ name: 'setlist.ipa' }] },
        release.tag,
      ),
    /não pode publicar AAB, IPA ou APK/,
  );
  assert.throws(
    () =>
      assertPublicReleaseMetadata(
        { ...safe, assets: [{ name: 'ios-build.json' }] },
        release.tag,
      ),
    /somente release-manifest\.json/,
  );
  assert.throws(
    () =>
      assertPublicReleaseMetadata(
        {
          ...safe,
          body: 'Download: https://example.com/build?X-Amz-Signature=secret',
        },
        release.tag,
      ),
    /link privado de artefato/,
  );
  assert.throws(
    () =>
      assertPublicReleaseMetadata(
        { ...safe, body: `${safe.body}\nTemporary token: abcdefghijklmnop` },
        release.tag,
      ),
    /credencial temporária/,
  );
});

test('verifica os dois manifestos públicos e rejeita cópia divergente ou insegura', () => {
  const directory = mkdtempSync(join(tmpdir(), 'setlist-pages-manifest-'));
  const releasePath = join(directory, 'release.json');
  const appPath = join(directory, 'app-release.json');
  try {
    const safeContents = `${JSON.stringify(validManifest())}\n`;
    writeFileSync(releasePath, safeContents);
    writeFileSync(appPath, safeContents);
    assert.doesNotThrow(() =>
      verifyPublicManifestCopies([releasePath, appPath], release, identity),
    );

    const unsafeManifest = validManifest();
    unsafeManifest.platforms.ios.downloadUrl =
      'https://expo.dev/artifacts/eas/private.ipa?token=secret';
    writeFileSync(appPath, `${JSON.stringify(unsafeManifest)}\n`);
    assert.throws(
      () =>
        verifyPublicManifestCopies([releasePath, appPath], release, identity),
      /manifestos públicos Web e \/app são diferentes/,
    );

    writeFileSync(releasePath, `${JSON.stringify(unsafeManifest)}\n`);
    assert.throws(
      () =>
        verifyPublicManifestCopies([releasePath, appPath], release, identity),
      /Campo privado não permitido/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Pages usa workflow confiável, exporta a tag isolada e valida as duas cópias', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/pages.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /ref: main\s+path: workflow-source/);
  assert.match(
    workflow,
    /ref: refs\/tags\/\$\{\{ inputs\.release_tag \|\| github\.event\.release\.tag_name \}\}\s+path: release-source/,
  );
  assert.match(workflow, /--release-metadata/);
  const releaseCopy = workflow.indexOf('pages-site/release.json');
  const appCopy = workflow.indexOf('pages-site/app/release.json');
  const verifyReleaseCopy = workflow.indexOf('--verify-release-copy');
  const verifyAppCopy = workflow.indexOf('--verify-app-copy');
  assert.ok(releaseCopy >= 0 && appCopy > releaseCopy);
  assert.ok(verifyReleaseCopy > appCopy && verifyAppCopy > verifyReleaseCopy);
});
