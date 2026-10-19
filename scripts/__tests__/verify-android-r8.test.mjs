import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { verifyAndroidR8 } from '../verify-android-r8.mjs';

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createFixture({
  gradleProperties,
  proguardPreset,
  validationMapping,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'setlist-r8-check-'));
  temporaryRoots.push(root);
  mkdirSync(join(root, 'android', 'app'), { recursive: true });
  writeFileSync(
    join(root, 'android', 'gradle.properties'),
    gradleProperties ??
      [
        'android.r8.optimizedResourceShrinking=true',
        'android.enableMinifyInReleaseBuilds=true',
        'android.enableShrinkResourcesInReleaseBuilds=true',
      ].join('\n'),
  );
  writeFileSync(
    join(root, 'android', 'app', 'build.gradle'),
    `proguardFiles getDefaultProguardFile("${proguardPreset ?? 'proguard-android-optimize.txt'}"), "proguard-rules.pro"`,
  );
  writeFileSync(
    join(root, 'eas.json'),
    JSON.stringify({
      build: {
        'production-android': {
          buildArtifactPaths: [
            'android/app/build/outputs/mapping/release/mapping.txt',
          ],
        },
        'production-android-validation': {
          buildArtifactPaths:
            validationMapping === false
              ? []
              : ['android/app/build/outputs/mapping/release/mapping.txt'],
        },
      },
    }),
  );
  return root;
}

test('aceita a configuração Android de release com R8 e mapping', () => {
  assert.deepEqual(verifyAndroidR8(createFixture()), []);
});

test('rejeita propriedades, preset ou perfil de mapping ausentes', () => {
  const root = createFixture({
    gradleProperties: 'android.r8.optimizedResourceShrinking=false',
    proguardPreset: 'proguard-android.txt',
    validationMapping: false,
  });

  assert.deepEqual(verifyAndroidR8(root), [
    'Propriedade Gradle ausente: android.r8.optimizedResourceShrinking=true',
    'Propriedade Gradle ausente: android.enableMinifyInReleaseBuilds=true',
    'Propriedade Gradle ausente: android.enableShrinkResourcesInReleaseBuilds=true',
    'O build Android não usa proguard-android-optimize.txt.',
    'O perfil EAS production-android-validation não coleta android/app/build/outputs/mapping/release/mapping.txt.',
  ]);
});
