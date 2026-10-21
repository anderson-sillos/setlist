import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  verify as verifySignature,
  webcrypto,
} from 'node:crypto';
import test from 'node:test';

import scheduler, {
  createAppJwt,
  dispatchScheduledWorkflows,
  getDueWorkflows,
} from '../src/index.mjs';

const fixedNow = Date.UTC(2026, 9, 20, 0, 0, 0);
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const env = {
  GITHUB_APP_ID: '12345',
  GITHUB_INSTALLATION_ID: '67890',
  GITHUB_APP_PRIVATE_KEY: privateKey,
};

function response(status, body = {}, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

function scheduledTime(hour, minute) {
  return Date.UTC(2026, 9, 20, hour, minute, 0);
}

test('mapeia os horários UTC dos quatro workflows monitorados', () => {
  assert.deepEqual(getDueWorkflows(scheduledTime(15, 0)), [
    { workflow: 'service-availability-monitor.yml', inputs: {} },
  ]);
  assert.deepEqual(getDueWorkflows(scheduledTime(4, 17)), [
    { workflow: 'supabase-invitation-cleanup-monitor.yml', inputs: {} },
  ]);
  assert.deepEqual(getDueWorkflows(scheduledTime(4, 27)), [
    { workflow: 'supabase-auth-audit-monitor.yml', inputs: {} },
  ]);
  assert.deepEqual(getDueWorkflows(scheduledTime(6, 17)), [
    { workflow: 'supabase-backup.yml', inputs: { skip_if_exists: 'true' } },
  ]);
  assert.deepEqual(getDueWorkflows(scheduledTime(8, 37)), [
    { workflow: 'supabase-backup.yml', inputs: { skip_if_exists: 'true' } },
  ]);
  assert.deepEqual(getDueWorkflows(scheduledTime(4, 18)), []);
  assert.throws(
    () => getDueWorkflows('bad timestamp'),
    /horário de agendamento inválido/,
  );
});

test('assina JWT RS256 usando chave privada PKCS#1 do GitHub App', async () => {
  const jwt = await createAppJwt({
    appId: '12345',
    privateKeyPem: privateKey,
    cryptoApi: webcrypto,
    now: fixedNow,
  });
  const [header, payload, signature] = jwt.split('.');
  const decode = (value) =>
    Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  assert.deepEqual(JSON.parse(decode(header)), { alg: 'RS256', typ: 'JWT' });
  assert.deepEqual(JSON.parse(decode(payload)), {
    iat: Math.floor(fixedNow / 1000) - 60,
    exp: Math.floor(fixedNow / 1000) + 8 * 60,
    iss: '12345',
  });
  assert.equal(
    verifySignature(
      'RSA-SHA256',
      Buffer.from(`${header}.${payload}`),
      publicKey,
      decode(signature),
    ),
    true,
  );
});

test('não chama GitHub fora dos horários previstos', async () => {
  let calls = 0;
  const workflows = await dispatchScheduledWorkflows(
    scheduledTime(4, 18),
    env,
    {
      fetchImpl: async () => {
        calls += 1;
        throw new Error('unexpected request');
      },
      cryptoApi: webcrypto,
      now: fixedNow,
    },
  );
  assert.deepEqual(workflows, []);
  assert.equal(calls, 0);
});

test('emite workflow_dispatch em main e limita o token a Actions:write no repositório', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1)
      return response(201, { token: 'temporary-installation-token' });
    return response(200, { workflow_run_id: 42 });
  };

  const result = await dispatchScheduledWorkflows(scheduledTime(6, 17), env, {
    fetchImpl,
    cryptoApi: webcrypto,
    now: fixedNow,
  });

  assert.deepEqual(result, ['supabase-backup.yml']);
  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].url,
    'https://api.github.com/app/installations/67890/access_tokens',
  );
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    repositories: ['setlist'],
    permissions: { actions: 'write' },
  });
  assert.equal(
    calls[0].options.headers['User-Agent'],
    'Setlist-Cron-Scheduler',
  );
  assert.equal(
    calls[1].url,
    'https://api.github.com/repos/anderson-sillos/setlist/actions/workflows/supabase-backup.yml/dispatches',
  );
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    ref: 'main',
    inputs: { skip_if_exists: 'true' },
  });
  assert.equal(
    calls[1].options.headers.Authorization,
    'Bearer temporary-installation-token',
  );
  assert.equal(
    calls[1].options.headers['User-Agent'],
    'Setlist-Cron-Scheduler',
  );
});

test('não inclui respostas do GitHub nas mensagens de erro', async () => {
  await assert.rejects(
    dispatchScheduledWorkflows(scheduledTime(4, 17), env, {
      fetchImpl: async () =>
        new Response('private response data', { status: 403 }),
      cryptoApi: webcrypto,
      now: fixedNow,
    }),
    (error) => {
      assert.match(error.message, /HTTP 403/);
      assert.doesNotMatch(
        error.message,
        /private response data|temporary-installation-token/,
      );
      return true;
    },
  );
});

test('endpoint HTTP do Worker não aceita disparos externos', async () => {
  const result = await scheduler.fetch(
    new Request('https://scheduler.example/dispatch'),
  );
  assert.equal(result.status, 404);
  const diagnostic = await scheduler.fetch(
    new Request('https://scheduler.example/_internal/github-app-check', {
      method: 'POST',
    }),
  );
  assert.equal(diagnostic.status, 404);
});

test('desativado não dispara workflows; ativo usa o horário do Cron Trigger', async () => {
  let pending;
  const calls = [];
  const ctx = {
    waitUntil(promise) {
      pending = promise;
    },
  };
  const disabledEnv = { ...env, SCHEDULER_ENABLED: 'false' };

  await scheduler.scheduled(
    { scheduledTime: scheduledTime(4, 17) },
    disabledEnv,
    ctx,
  );
  assert.equal(pending, undefined);

  const activeEnv = { ...env, SCHEDULER_ENABLED: 'true' };
  await scheduler.scheduled(
    { scheduledTime: scheduledTime(4, 18) },
    activeEnv,
    {
      waitUntil(promise) {
        pending = promise;
      },
    },
  );
  assert.deepEqual(await pending, undefined);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    assert.equal(options.headers['User-Agent'], 'Setlist-Cron-Scheduler');
    if (calls.length === 1) return response(201, { token: 'temporary-token' });
    return response(200, { workflow_run_id: 42 });
  };
  try {
    await scheduler.scheduled(
      { scheduledTime: scheduledTime(4, 17) },
      activeEnv,
      {
        waitUntil(promise) {
          pending = promise;
        },
      },
    );
    await pending;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.deepEqual(calls, [
    'https://api.github.com/app/installations/67890/access_tokens',
    'https://api.github.com/repos/anderson-sillos/setlist/actions/workflows/supabase-invitation-cleanup-monitor.yml/dispatches',
  ]);
});
