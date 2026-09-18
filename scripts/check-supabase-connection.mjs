#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const requestedEnvironment = process.argv[2] ?? 'development';
const allowedEnvironments = new Set(['development', 'production']);

if (!allowedEnvironments.has(requestedEnvironment)) {
  console.error('Use: npm run supabase:check -- development|production');
  process.exit(1);
}

const environmentFiles = [
  `.env.${requestedEnvironment}.local`,
  `.env.${requestedEnvironment}`,
  '.env.local',
  '.env',
];

function parseEnvironmentFile(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return separator < 0
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

async function readEnvironment() {
  for (const file of environmentFiles) {
    try {
      const contents = await readFile(file, 'utf8');
      return { ...parseEnvironmentFile(contents), ...process.env };
    } catch {
      // Tenta o próximo arquivo, permitindo usar variáveis exportadas na CI.
    }
  }

  return process.env;
}

const environment = await readEnvironment();
const appEnvironment = environment.EXPO_PUBLIC_APP_ENV;
const url = environment.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/u, '');
const publishableKey = environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (appEnvironment !== requestedEnvironment) {
  console.error(
    `Ambiente divergente: esperado ${requestedEnvironment}, recebido ${appEnvironment ?? 'ausente'}.`,
  );
  process.exit(1);
}

if (!url || !url.startsWith('https://') || !publishableKey) {
  console.error(
    'Defina EXPO_PUBLIC_SUPABASE_URL HTTPS e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes de testar.',
  );
  process.exit(1);
}

const response = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: publishableKey },
});

if (!response.ok) {
  console.error(
    `Supabase ${requestedEnvironment} respondeu HTTP ${response.status}. Confira URL e chave publicável.`,
  );
  process.exit(1);
}

console.log(
  `Conexão Supabase ${requestedEnvironment} confirmada usando somente URL e chave publicável.`,
);
