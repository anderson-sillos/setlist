#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(projectRoot, 'public/.well-known');
const androidPackage =
  process.env.SETLIST_ANDROID_PACKAGE?.trim() || 'com.andersonsillos.setlist';
const iosBundleIdentifier =
  process.env.SETLIST_IOS_BUNDLE_IDENTIFIER?.trim() || androidPackage;
const androidFingerprints = (
  process.env.SETLIST_ANDROID_SHA256_CERT_FINGERPRINTS ?? ''
)
  .split(/[\s,;]+/u)
  .map((fingerprint) => fingerprint.trim().toUpperCase())
  .filter(Boolean);
const iosTeamId = process.env.SETLIST_IOS_TEAM_ID?.trim().toUpperCase();

if (!androidFingerprints.length || !iosTeamId) {
  console.warn(
    'Associações nativas não geradas: defina SETLIST_ANDROID_SHA256_CERT_FINGERPRINTS e SETLIST_IOS_TEAM_ID nas variáveis públicas do workflow.',
  );
  process.exit(0);
}

const invalidFingerprint = androidFingerprints.find(
  (fingerprint) => !/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/u.test(fingerprint),
);

if (invalidFingerprint) {
  console.error(
    `Fingerprint Android inválida: ${invalidFingerprint}. Use SHA-256 em hexadecimal separado por dois-pontos.`,
  );
  process.exit(1);
}

if (!/^[A-Z0-9]{6,20}$/u.test(iosTeamId)) {
  console.error(
    'SETLIST_IOS_TEAM_ID inválido. Informe o Team ID alfanumérico da conta Apple Developer.',
  );
  process.exit(1);
}

await mkdir(outputDirectory, { recursive: true });

const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: androidPackage,
      sha256_cert_fingerprints: androidFingerprints,
    },
  },
];

const appleAppSiteAssociation = {
  applinks: {
    details: [
      {
        appIDs: [`${iosTeamId}.${iosBundleIdentifier}`],
        components: [{ '/': '/invite/*' }],
      },
    ],
  },
};

await Promise.all([
  writeFile(
    resolve(outputDirectory, 'assetlinks.json'),
    `${JSON.stringify(assetLinks, null, 2)}\n`,
    'utf8',
  ),
  writeFile(
    resolve(outputDirectory, 'apple-app-site-association'),
    `${JSON.stringify(appleAppSiteAssociation, null, 2)}\n`,
    'utf8',
  ),
]);

console.log(
  'Associações Android App Links e iOS Universal Links geradas em public/.well-known.',
);
