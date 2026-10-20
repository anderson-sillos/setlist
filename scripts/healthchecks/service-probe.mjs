import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sendHealthcheckPing } from './healthcheck-ping.mjs';

const TIMEOUT_MS = 10_000;
const PRODUCTION_WEB_HOST = 'setlistbr.app.br';
const PRODUCTION_SUPABASE_HOST = 'tqijocmmiwistinrjpwl.supabase.co';

export function buildServiceTargets({ siteUrl, supabaseUrl, publishableKey }) {
  const site = new URL(siteUrl);
  const supabase = new URL(supabaseUrl);
  if (
    site.protocol !== 'https:' ||
    site.hostname !== PRODUCTION_WEB_HOST ||
    site.port ||
    site.username ||
    site.password ||
    site.search ||
    site.hash ||
    supabase.protocol !== 'https:' ||
    supabase.hostname !== PRODUCTION_SUPABASE_HOST ||
    supabase.port ||
    supabase.username ||
    supabase.password ||
    supabase.pathname !== '/' ||
    supabase.search ||
    supabase.hash ||
    !publishableKey
  ) {
    throw new Error('Configuração de sondagem pública incompleta.');
  }

  const base = supabase.href.replace(/\/+$/u, '');
  const publicHeaders = { apikey: publishableKey };
  return [
    { name: 'Web', url: site.href, headers: {}, redirect: 'follow' },
    {
      name: 'Supabase REST',
      url: `${base}/rest/v1/`,
      headers: { ...publicHeaders, accept: 'application/openapi+json' },
      redirect: 'error',
    },
    {
      name: 'Supabase Auth',
      url: `${base}/auth/v1/settings`,
      headers: publicHeaders,
      redirect: 'error',
    },
  ];
}

export async function probeServices(
  targets,
  { fetchImpl = fetch, timeoutMs = TIMEOUT_MS, report = console } = {},
) {
  for (const target of targets) {
    let response;
    try {
      response = await fetchImpl(target.url, {
        method: 'GET',
        headers: target.headers,
        redirect: target.redirect,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new Error(`${target.name}: falha de rede ou timeout.`);
    }

    await response.body?.cancel().catch(() => {});
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`${target.name}: HTTP ${response.status}.`);
    }
    report.info(`${target.name}: HTTP ${response.status}.`);
  }
}

async function main() {
  const heartbeatUrl = process.env.SERVICE_UPTIME_HEARTBEAT_URL;
  let failed = false;
  try {
    await sendHealthcheckPing(heartbeatUrl, '/start');
    const targets = buildServiceTargets({
      siteUrl: process.env.SETLIST_PUBLIC_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    await probeServices(targets);
  } catch (error) {
    failed = true;
    console.error(
      error instanceof Error ? error.message : 'Falha na sondagem pública.',
    );
  }

  try {
    await sendHealthcheckPing(heartbeatUrl, failed ? '/fail' : '');
  } catch (error) {
    failed = true;
    console.error(
      error instanceof Error ? error.message : 'Falha ao reportar a sondagem.',
    );
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}

export { main as runServiceProbe };
