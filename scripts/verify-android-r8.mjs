#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAPPING_PATH = 'android/app/build/outputs/mapping/release/mapping.txt';

export function verifyAndroidR8(root = process.cwd()) {
  const failures = [];
  const read = (path) => {
    try {
      return readFileSync(resolve(root, path), 'utf8');
    } catch {
      failures.push(`Arquivo ausente: ${path}`);
      return '';
    }
  };

  const gradleProperties = read('android/gradle.properties');
  for (const property of [
    'android.r8.optimizedResourceShrinking=true',
    'android.enableMinifyInReleaseBuilds=true',
    'android.enableShrinkResourcesInReleaseBuilds=true',
  ]) {
    if (!gradleProperties.split(/\r?\n/).includes(property)) {
      failures.push(`Propriedade Gradle ausente: ${property}`);
    }
  }

  const appBuildGradle = read('android/app/build.gradle');
  if (
    !/getDefaultProguardFile\(["']proguard-android-optimize\.txt["']\)/.test(
      appBuildGradle,
    )
  ) {
    failures.push('O build Android não usa proguard-android-optimize.txt.');
  }

  const eas = JSON.parse(read('eas.json') || '{}');
  for (const profileName of [
    'production-android',
    'production-android-validation',
  ]) {
    const paths = eas.build?.[profileName]?.buildArtifactPaths ?? [];
    if (!paths.includes(MAPPING_PATH)) {
      failures.push(`O perfil EAS ${profileName} não coleta ${MAPPING_PATH}.`);
    }
  }

  return failures;
}

function main() {
  const failures = verifyAndroidR8();
  if (failures.length) {
    console.error('Configuração de R8 não aprovada:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    'R8, redução de recursos, preset otimizado e coleta do mapping.txt conferidos.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main();
}
