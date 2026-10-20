import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { sendHealthcheckPing } from './healthcheck-ping.mjs';

const SCRIPT_DIRECTORY = fileURLToPath(new URL('.', import.meta.url));

function runPsql(queryFile, databaseUrl, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const childEnvironment = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      PGDATABASE: databaseUrl,
      PGCONNECT_TIMEOUT: '15',
    };

    const child = spawn(
      'psql',
      [
        '-X',
        '-q',
        '-A',
        '-t',
        '-F',
        '|',
        '-v',
        'ON_ERROR_STOP=1',
        '-f',
        queryFile,
      ],
      { env: childEnvironment, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    let stdout = '';
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      child.kill('SIGTERM');
      reject(new Error('A consulta do monitor excedeu o tempo limite.'));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > 2048) {
        settled = true;
        child.kill('SIGTERM');
        clearTimeout(timeout);
        reject(
          new Error('A consulta do monitor retornou uma saída inesperada.'),
        );
      }
    });

    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error('Não foi possível executar a consulta do monitor.'));
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error('A consulta do monitor falhou.'));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export function isHealthyMonitorResult(output) {
  return output === 't|t|t' || output === 't|t|t|t|t';
}

export async function runPostgresMonitor({
  databaseUrl = process.env.SUPABASE_DB_URL,
  heartbeatUrl,
  queryFile,
  runQuery = runPsql,
  sendPing = sendHealthcheckPing,
  report = console,
}) {
  let failed = false;
  try {
    await sendPing(heartbeatUrl, '/start');
    if (!databaseUrl) throw new Error('SUPABASE_DB_URL ausente.');

    const output = await runQuery(
      `${SCRIPT_DIRECTORY}${queryFile}`,
      databaseUrl,
    );
    if (!isHealthyMonitorResult(output)) {
      throw new Error('A verificação agregada encontrou uma pendência.');
    }
    report.info('Verificação de retenção aprovada.');
  } catch (error) {
    failed = true;
    report.error(error instanceof Error ? error.message : 'Falha no monitor.');
  }

  try {
    await sendPing(heartbeatUrl, failed ? '/fail' : '');
  } catch (error) {
    report.error(
      error instanceof Error ? error.message : 'Falha ao reportar o monitor.',
    );
    failed = true;
  }

  if (failed) process.exitCode = 1;
  return !failed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [queryFile, heartbeatEnvironmentName] = process.argv.slice(2);
  const heartbeatUrl = process.env[heartbeatEnvironmentName];
  if (!queryFile || !heartbeatEnvironmentName) {
    console.error('Uso interno do monitor incompleto.');
    process.exitCode = 1;
  } else {
    await runPostgresMonitor({ queryFile, heartbeatUrl });
  }
}
