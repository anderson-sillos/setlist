import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sendHealthcheckPing } from './healthcheck-ping.mjs';

const CONFIRMATION = 'RUN HEALTHCHECKS REHEARSAL';
const MODES = new Set(['fail', 'start', 'no-ping', 'success']);

export async function runAlertRehearsal({
  mode,
  confirmation,
  heartbeatUrl,
  report = console,
  ping = sendHealthcheckPing,
}) {
  if (!MODES.has(mode) || confirmation !== CONFIRMATION) {
    throw new Error('Ensaio não confirmado ou modo inválido.');
  }
  if (mode === 'no-ping') {
    report.info(
      'Modo no-ping: nenhum sinal foi enviado; aguarde o check declarar atraso.',
    );
    return;
  }

  const suffix = mode === 'success' ? '' : `/${mode}`;
  await ping(heartbeatUrl, suffix);
  report.info(`Sinal de ensaio enviado: ${mode}.`);
}

async function main() {
  try {
    await runAlertRehearsal({
      mode: process.env.REHEARSAL_MODE,
      confirmation: process.env.REHEARSAL_CONFIRMATION,
      heartbeatUrl: process.env.HEALTHCHECKS_REHEARSAL_URL,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha no ensaio.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
