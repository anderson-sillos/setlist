#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const requestedEnvironment = process.argv[2] ?? 'development';
const allowedEnvironments = new Set(['development', 'production']);

if (!allowedEnvironments.has(requestedEnvironment)) {
  console.error('Use: npm run supabase:check:eas -- development|production');
  process.exit(1);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const checkCommand = `npm run supabase:check -- ${requestedEnvironment}`;
const result = spawnSync(
  npxCommand,
  [
    '--yes',
    'eas-cli@latest',
    'env:exec',
    requestedEnvironment,
    checkCommand,
    '--non-interactive',
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Não foi possível executar o EAS CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
