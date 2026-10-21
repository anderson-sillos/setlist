const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_OWNER = 'anderson-sillos';
const GITHUB_REPOSITORY = 'setlist';
const GITHUB_REF = 'main';

const encoder = new TextEncoder();

export const WORKFLOW_SCHEDULES = Object.freeze({
  'service-availability-monitor.yml': (date) => date.getUTCMinutes() % 30 === 0,
  'supabase-invitation-cleanup-monitor.yml': (date) =>
    date.getUTCHours() === 4 && date.getUTCMinutes() === 17,
  'supabase-auth-audit-monitor.yml': (date) =>
    date.getUTCHours() === 4 && date.getUTCMinutes() === 27,
  'supabase-backup.yml': (date) =>
    (date.getUTCHours() === 6 && date.getUTCMinutes() === 17) ||
    (date.getUTCHours() === 8 && date.getUTCMinutes() === 37),
});

export function getDueWorkflows(scheduledTime) {
  const date = new Date(scheduledTime);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Cloudflare forneceu um horário de agendamento inválido');
  }

  return Object.entries(WORKFLOW_SCHEDULES)
    .filter(([, isDue]) => isDue(date))
    .map(([workflow]) => ({
      workflow,
      inputs:
        workflow === 'supabase-backup.yml' ? { skip_if_exists: 'true' } : {},
    }));
}

function concatBytes(...parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function encodeDerLength(length) {
  if (length < 0x80) return Uint8Array.of(length);
  const encoded = [];
  for (let rest = length; rest > 0; rest >>>= 8) encoded.unshift(rest & 0xff);
  return Uint8Array.of(0x80 | encoded.length, ...encoded);
}

function encodeDer(tag, value) {
  return concatBytes(Uint8Array.of(tag), encodeDerLength(value.length), value);
}

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodePrivateKey(pem) {
  const pkcs8Match = pem.match(
    /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/,
  );
  if (pkcs8Match) return decodeBase64(pkcs8Match[1].replace(/\s/g, ''));

  const pkcs1Match = pem.match(
    /-----BEGIN RSA PRIVATE KEY-----([\s\S]+?)-----END RSA PRIVATE KEY-----/,
  );
  if (!pkcs1Match)
    throw new Error('A chave privada do GitHub App não está em PEM RSA válido');

  const pkcs1 = decodeBase64(pkcs1Match[1].replace(/\s/g, ''));
  const version = Uint8Array.of(0x02, 0x01, 0x00);
  const rsaEncryptionAlgorithm = Uint8Array.of(
    0x30,
    0x0d,
    0x06,
    0x09,
    0x2a,
    0x86,
    0x48,
    0x86,
    0xf7,
    0x0d,
    0x01,
    0x01,
    0x01,
    0x05,
    0x00,
  );
  return encodeDer(
    0x30,
    concatBytes(version, rsaEncryptionAlgorithm, encodeDer(0x04, pkcs1)),
  );
}

function encodeBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function createAppJwt({
  appId,
  privateKeyPem,
  cryptoApi = crypto,
  now = Date.now(),
}) {
  const issuedAt = Math.floor(now / 1000) - 60;
  const expiresAt = issuedAt + 9 * 60;
  const header = encodeBase64Url(
    encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
  );
  const payload = encodeBase64Url(
    encoder.encode(
      JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: appId }),
    ),
  );
  const unsignedToken = `${header}.${payload}`;

  const privateKey = await cryptoApi.subtle.importKey(
    'pkcs8',
    decodePrivateKey(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await cryptoApi.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken),
  );
  return `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
}

function requiredSetting(value, settingName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Configuração ausente no Cloudflare Worker: ${settingName}`,
    );
  }
  return value.trim();
}

async function createInstallationToken(env, fetchImpl, cryptoApi, now) {
  const appId = requiredSetting(env.GITHUB_APP_ID, 'GITHUB_APP_ID');
  const installationId = requiredSetting(
    env.GITHUB_INSTALLATION_ID,
    'GITHUB_INSTALLATION_ID',
  );
  const privateKeyPem = requiredSetting(
    env.GITHUB_APP_PRIVATE_KEY,
    'GITHUB_APP_PRIVATE_KEY',
  );

  let jwt;
  try {
    jwt = await createAppJwt({ appId, privateKeyPem, cryptoApi, now });
  } catch {
    throw new Error('Não foi possível autenticar o GitHub App');
  }

  let response;
  try {
    response = await fetchImpl(
      `${GITHUB_API}/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${jwt}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: [GITHUB_REPOSITORY],
          permissions: { actions: 'write' },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    throw new Error(
      'Não foi possível solicitar o token temporário do GitHub App',
    );
  }

  if (!response.ok) {
    throw new Error(
      `GitHub recusou a criação do token temporário (HTTP ${response.status})`,
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      'GitHub retornou uma resposta inválida ao criar o token temporário',
    );
  }
  if (typeof body?.token !== 'string' || body.token.length === 0) {
    throw new Error('GitHub não retornou o token temporário esperado');
  }
  return body.token;
}

async function dispatchWorkflow(workflow, inputs, token, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: GITHUB_REF, inputs }),
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    throw new Error(`Falha de rede ao disparar ${workflow}`);
  }

  if (!response.ok) {
    throw new Error(
      `GitHub recusou o disparo de ${workflow} (HTTP ${response.status})`,
    );
  }
}

export async function dispatchScheduledWorkflows(
  scheduledTime,
  env,
  { fetchImpl = fetch, cryptoApi = crypto, now = Date.now() } = {},
) {
  const due = getDueWorkflows(scheduledTime);
  if (due.length === 0) return [];

  const token = await createInstallationToken(env, fetchImpl, cryptoApi, now);
  for (const job of due)
    await dispatchWorkflow(job.workflow, job.inputs, token, fetchImpl);
  return due.map(({ workflow }) => workflow);
}

export default {
  async fetch() {
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    if (env.SCHEDULER_ENABLED !== 'true') return;

    const work = dispatchScheduledWorkflows(event.scheduledTime, env).then(
      (workflows) => {
        if (workflows.length > 0) {
          console.log(
            JSON.stringify({
              event: 'workflow-dispatch-complete',
              workflows,
              scheduledTime: new Date(event.scheduledTime).toISOString(),
            }),
          );
        }
      },
    );
    ctx.waitUntil(work);
  },
};
