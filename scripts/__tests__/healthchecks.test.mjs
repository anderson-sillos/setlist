import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  sendHealthcheckPing,
  validatePingUrl,
} from '../healthchecks/healthcheck-ping.mjs';
import { runAlertRehearsal } from '../healthchecks/alert-rehearsal.mjs';
import {
  isHealthyMonitorResult,
  runPostgresMonitor,
} from '../healthchecks/run-pg-monitor.mjs';
import {
  buildServiceTargets,
  probeServices,
} from '../healthchecks/service-probe.mjs';

const pingUrl = 'https://hc-ping.com/12345678-1234-1234-1234-123456789abc';

test('aceita somente Ping URLs HTTPS do Healthchecks sem parâmetros', () => {
  assert.equal(validatePingUrl(pingUrl), true);
  assert.equal(validatePingUrl(`${pingUrl}?token=secret`), false);
  assert.equal(
    validatePingUrl('http://hc-ping.com/12345678-1234-1234-1234-123456789abc'),
    false,
  );
  assert.equal(validatePingUrl('https://example.com/check'), false);
});

test('envia o sinal sem imprimir ou ler o corpo da resposta', async () => {
  let requestedUrl;
  await sendHealthcheckPing(pingUrl, '/start', {
    fetchImpl: async (url) => {
      requestedUrl = url;
      return new Response('sensitive response body', { status: 200 });
    },
  });
  assert.equal(requestedUrl, `${pingUrl}/start`);
});

test('recusa Ping URLs inválidas antes de fazer uma requisição', async () => {
  let requested = false;
  await assert.rejects(
    sendHealthcheckPing('https://example.com/private', '', {
      fetchImpl: async () => {
        requested = true;
        return new Response(null, { status: 200 });
      },
    }),
    /ausente ou inválida/u,
  );
  assert.equal(requested, false);
});

test('trata erro HTTP do Healthchecks sem expor a Ping URL', async () => {
  await assert.rejects(
    sendHealthcheckPing(pingUrl, '', {
      fetchImpl: async () => new Response(null, { status: 503 }),
    }),
    /Healthchecks recusou o sinal/u,
  );
});

test('constrói três sondagens públicas com a chave apenas nas APIs Supabase', () => {
  const targets = buildServiceTargets({
    siteUrl: 'https://setlistbr.app.br/',
    supabaseUrl: 'https://tqijocmmiwistinrjpwl.supabase.co/',
    publishableKey: 'sb_publishable_public_key',
  });
  assert.deepEqual(
    targets.map(({ name }) => name),
    ['Web', 'Supabase REST', 'Supabase Auth'],
  );
  assert.deepEqual(targets[0].headers, {});
  assert.equal(
    targets[1].url,
    'https://tqijocmmiwistinrjpwl.supabase.co/rest/v1/',
  );
  assert.equal(
    targets[2].url,
    'https://tqijocmmiwistinrjpwl.supabase.co/auth/v1/settings',
  );
  assert.equal(targets[1].headers.apikey, 'sb_publishable_public_key');
  assert.equal(targets[2].headers.apikey, 'sb_publishable_public_key');
  assert.equal(targets[0].redirect, 'follow');
  assert.equal(targets[1].redirect, 'error');
  assert.equal(targets[2].redirect, 'error');
  assert.throws(
    () =>
      buildServiceTargets({
        siteUrl: 'https://setlistbr.app.br/',
        supabaseUrl: 'https://attacker.example',
        publishableKey: 'sb_publishable_public_key',
      }),
    /incompleta/u,
  );
});

test('considera a sondagem aprovada apenas depois de respostas 2xx', async () => {
  const targets = buildServiceTargets({
    siteUrl: 'https://setlistbr.app.br/',
    supabaseUrl: 'https://tqijocmmiwistinrjpwl.supabase.co',
    publishableKey: 'sb_publishable_public_key',
  });
  const requested = [];
  const messages = [];
  await probeServices(targets, {
    fetchImpl: async (url, options) => {
      requested.push({ url, options });
      return new Response('do not log this body', { status: 200 });
    },
    report: { info: (message) => messages.push(message) },
  });
  assert.equal(requested.length, 3);
  assert.equal(requested[0].options.headers.apikey, undefined);
  assert.equal(requested[0].options.redirect, 'follow');
  assert.equal(requested[1].options.redirect, 'error');
  assert.equal(messages.length, 3);
  assert.ok(messages.every((message) => !message.includes('https://')));
});

test('reporta somente o nome e status quando uma sondagem falha', async () => {
  const messages = [];
  await assert.rejects(
    probeServices(
      [{ name: 'Supabase Auth', url: 'https://auth.example', headers: {} }],
      {
        fetchImpl: async () => new Response('private body', { status: 503 }),
        report: { info: (message) => messages.push(message) },
      },
    ),
    /Supabase Auth: HTTP 503/u,
  );
  assert.deepEqual(messages, []);
});

test('converte erros de rede e timeout em mensagem sem URL', async () => {
  await assert.rejects(
    probeServices(
      [{ name: 'Web', url: 'https://setlistbr.app.br/', headers: {} }],
      {
        fetchImpl: async () =>
          Promise.reject(new Error('timeout https://private')),
      },
    ),
    /Web: falha de rede ou timeout/u,
  );
});

test('aceita apenas saídas agregadas saudáveis para os monitores SQL', () => {
  assert.equal(isHealthyMonitorResult('t|t|t'), true);
  assert.equal(isHealthyMonitorResult('t|t|t|t|t'), true);
  assert.equal(isHealthyMonitorResult('t|f|0'), false);
  assert.equal(isHealthyMonitorResult('t|t|t|t'), false);
  assert.equal(isHealthyMonitorResult('t|t|t|t|4'), false);
  assert.equal(isHealthyMonitorResult('user@example.com|t|t'), false);
});

test('um monitor de banco envia início e sucesso, sem expor o endereço do check', async () => {
  const signals = [];
  const messages = [];
  const success = await runPostgresMonitor({
    databaseUrl: 'postgresql://db.example/private',
    heartbeatUrl: pingUrl,
    queryFile: 'invitation-cleanup-monitor.sql',
    runQuery: async () => 't|t|t',
    sendPing: async (_url, suffix) => signals.push(suffix),
    report: {
      info: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
  });
  assert.equal(success, true);
  assert.deepEqual(signals, ['/start', '']);
  assert.ok(messages.every((message) => !message.includes(pingUrl)));
});

test('um monitor de banco envia falha quando a consulta encontra pendências', async () => {
  const signals = [];
  const priorExitCode = process.exitCode;
  const success = await runPostgresMonitor({
    databaseUrl: 'postgresql://db.example/private',
    heartbeatUrl: pingUrl,
    queryFile: 'auth-audit-retention-monitor.sql',
    runQuery: async () => 't|t|t|f|2',
    sendPing: async (_url, suffix) => signals.push(suffix),
    report: { info() {}, error() {} },
  });
  assert.equal(success, false);
  assert.deepEqual(signals, ['/start', '/fail']);
  process.exitCode = priorExitCode;
});

test('o ensaio sem ping não toca no check e exige confirmação explícita', async () => {
  let pingCount = 0;
  const messages = [];
  await runAlertRehearsal({
    mode: 'no-ping',
    confirmation: 'RUN HEALTHCHECKS REHEARSAL',
    heartbeatUrl: pingUrl,
    ping: async () => pingCount++,
    report: { info: (message) => messages.push(message) },
  });
  assert.equal(pingCount, 0);
  assert.match(messages[0], /nenhum sinal foi enviado/u);
  await assert.rejects(
    runAlertRehearsal({
      mode: 'fail',
      confirmation: 'no',
      heartbeatUrl: pingUrl,
    }),
    /não confirmado/u,
  );
});

test('o ensaio encaminha somente o sinal selecionado ao check separado', async () => {
  const signals = [];
  await runAlertRehearsal({
    mode: 'fail',
    confirmation: 'RUN HEALTHCHECKS REHEARSAL',
    heartbeatUrl: pingUrl,
    ping: async (_url, suffix) => signals.push(suffix),
    report: { info() {} },
  });
  assert.deepEqual(signals, ['/fail']);
});

test('consultas de monitoramento retornam somente métricas agregadas', async () => {
  const inviteSql = await readFile(
    new URL('../healthchecks/invitation-cleanup-monitor.sql', import.meta.url),
    'utf8',
  );
  const auditSql = await readFile(
    new URL(
      '../healthchecks/auth-audit-retention-monitor.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(
    inviteSql,
    /retention_hold\.hold_until > latest_success\.end_time/u,
  );
  assert.doesNotMatch(inviteSql, /token_hash|email|return_message/u);
  assert.match(auditSql, /count\(\*\) as row_count/u);
  assert.match(auditSql, /hold_until > now\(\)/u);
  assert.doesNotMatch(auditSql, /payload|user_id|ip_address|return_message/u);
});

test('migração de auditoria falha fechada e respeita retenções temporárias', async () => {
  const migration = await readFile(
    new URL(
      '../../supabase/migrations/20261020120000_add_auth_audit_retention.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(migration, /has_table_privilege\(current_user/u);
  assert.match(migration, /row_security_active\(/u);
  assert.match(migration, /interval '30 days'/u);
  assert.match(migration, /auth_audit_retention_holds/u);
  assert.match(migration, /'20 3 \* \* \*'/u);
  assert.doesNotMatch(migration, /grant .* to (public|anon|authenticated)/iu);
});
