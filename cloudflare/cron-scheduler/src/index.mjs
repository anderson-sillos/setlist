const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_USER_AGENT = 'Setlist-Cron-Scheduler';
const GITHUB_OWNER = 'anderson-sillos';
const GITHUB_REPOSITORY = 'setlist';
const GITHUB_REF = 'main';
const GITHUB_DIAGNOSTIC_PATH = '/_internal/github-app-check';

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

function safeGithubText(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(
      /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/gi,
      '[redacted]',
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      '[redacted]',
    )
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

function safeGithubErrors(errors) {
  if (!Array.isArray(errors)) return [];
  return errors.slice(0, 3).map((error) => {
    if (typeof error === 'string') {
      return { message: safeGithubText(error) };
    }
    if (typeof error !== 'object' || error === null) {
      return { message: null };
    }
    return {
      resource: safeGithubText(error.resource, 64),
      field: safeGithubText(error.field, 64),
      code: safeGithubText(error.code, 64),
      message: safeGithubText(error.message),
    };
  });
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
          'User-Agent': GITHUB_USER_AGENT,
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
    const error = new Error(
      `GitHub recusou a criação do token temporário (HTTP ${response.status})`,
    );
    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
    error.phase = 'request_installation_token';
    error.code = githubFailureCode(response.status);
    error.status = response.status;
    error.requestId = response.headers.get('x-github-request-id');
    error.githubMessage = safeGithubText(responseBody?.message);
    error.githubErrors = safeGithubErrors(responseBody?.errors);
    throw error;
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
  return {
    token: body.token,
    status: response.status,
    requestId: response.headers.get('x-github-request-id'),
  };
}

function githubFailureCode(status) {
  if (status === 401) return 'github_rejected_app_jwt';
  if (status === 403) return 'github_forbidden_for_app_installation';
  if (status === 404) return 'github_installation_not_found_for_app';
  if (status === 422)
    return 'github_rejected_requested_repository_or_permission';
  if (status === 429) return 'github_rate_limited';
  return 'github_token_request_failed';
}

async function revokeInstallationToken(token, fetchImpl) {
  try {
    const response = await fetchImpl(`${GITHUB_API}/installation/token`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        'User-Agent': GITHUB_USER_AGENT,
      },
      signal: AbortSignal.timeout(10_000),
    });
    return { revoked: response.status === 204, status: response.status };
  } catch {
    return { revoked: false, status: null };
  }
}

export async function validateGithubAppAccess(
  env,
  { fetchImpl = fetch, cryptoApi = crypto, now = Date.now() } = {},
) {
  let installationToken;
  try {
    const result = await createInstallationToken(
      env,
      fetchImpl,
      cryptoApi,
      now,
    );
    installationToken = result.token;
    const cleanup = await revokeInstallationToken(installationToken, fetchImpl);
    installationToken = null;
    return {
      ok: cleanup.revoked,
      phase: 'complete',
      github_access: 'validated',
      token_created_http_status: result.status,
      token_revoked: cleanup.revoked,
      revoke_http_status: cleanup.status,
      github_request_id: result.requestId,
    };
  } catch (error) {
    return {
      ok: false,
      phase: error.phase || 'request_installation_token',
      code: error.code || 'github_token_request_failed',
      http_status: error.status || null,
      github_request_id: error.requestId || null,
      github_message: error.githubMessage || null,
      github_errors: error.githubErrors || [],
    };
  } finally {
    // Never log or return the installation token. It is revoked immediately
    // after a successful creation attempt above.
    installationToken = null;
  }
}

async function diagnosticSecretsMatch(received, expected, cryptoApi) {
  if (typeof received !== 'string' || typeof expected !== 'string')
    return false;
  const [receivedHash, expectedHash] = await Promise.all([
    cryptoApi.subtle.digest('SHA-256', encoder.encode(received)),
    cryptoApi.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(receivedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
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
          'User-Agent': GITHUB_USER_AGENT,
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

  const { token } = await createInstallationToken(
    env,
    fetchImpl,
    cryptoApi,
    now,
  );
  for (const job of due)
    await dispatchWorkflow(job.workflow, job.inputs, token, fetchImpl);
  return due.map(({ workflow }) => workflow);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === GITHUB_DIAGNOSTIC_PATH) {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }

      const expectedSecret = env?.DIAGNOSTIC_TOKEN;
      if (typeof expectedSecret !== 'string' || expectedSecret.length < 32) {
        return jsonResponse(
          { ok: false, code: 'diagnostic_token_secret_missing_or_too_short' },
          503,
        );
      }

      const authorization = request.headers.get('Authorization') || '';
      const receivedSecret = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
      if (
        !(await diagnosticSecretsMatch(receivedSecret, expectedSecret, crypto))
      ) {
        return jsonResponse({ ok: false, code: 'unauthorized' }, 401);
      }

      const result = await validateGithubAppAccess(env);
      // Explicit allow-list: never emit request headers, JWTs, or access tokens.
      console.log(
        JSON.stringify({ event: 'github-app-access-diagnostic', ...result }),
      );
      return jsonResponse(result, result.ok ? 200 : 502);
    }

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
