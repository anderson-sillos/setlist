import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sendHealthcheckPing } from './healthcheck-ping.mjs';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;
const HEALTHCHECKS_USER_AGENT =
  'Setlist-Service-Availability-Monitor/1.0 (GitHub Actions; https://github.com/anderson-sillos/setlist)';
const PRODUCTION_WEB_HOST = 'setlistbr.app.br';
// Independent allowlist: the probe target still comes from the environment,
// but an incorrect variable must not redirect production monitoring to dev.
const PRODUCTION_SUPABASE_HOST = 'tqijocmmiwistinrjpwl.supabase.co';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function configuredTimeoutMs(value = process.env.SERVICE_PROBE_TIMEOUT_MS) {
  if (value === undefined || value.trim() === '') return DEFAULT_TIMEOUT_MS;

  const normalized = value.trim();
  const timeoutMs = Number(normalized);
  if (
    !/^\d+$/u.test(normalized) ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new Error(
      `SERVICE_PROBE_TIMEOUT_MS deve ser um inteiro entre 1 e ${MAX_TIMEOUT_MS} ms.`,
    );
  }
  return timeoutMs;
}

function networkFailureReason(error, timeoutMs) {
  const causeCode = error?.cause?.code;
  if (causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
    return `timeout ao conectar (${causeCode}; limite ${timeoutMs} ms)`;
  }

  if (
    error?.name === 'TimeoutError' ||
    /timeout/iu.test(error?.message ?? '')
  ) {
    return `sem resposta dentro do limite de ${timeoutMs} ms`;
  }

  if (typeof causeCode === 'string' && /^[A-Z0-9_]{1,64}$/u.test(causeCode)) {
    const knownCauses = {
      ECONNREFUSED: 'conexão recusada',
      ECONNRESET: 'conexão encerrada antes da resposta',
      ENETUNREACH: 'rota de rede indisponível',
      ENOTFOUND: 'nome do host não resolvido',
      EAI_AGAIN: 'falha temporária na resolução DNS',
      EHOSTUNREACH: 'host inacessível pela rede',
      ETIMEDOUT: 'tempo limite de conexão excedido',
      CERT_HAS_EXPIRED: 'certificado TLS expirado',
      ERR_TLS_CERT_ALTNAME_INVALID: 'certificado TLS não corresponde ao host',
      UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'cadeia do certificado TLS não validada',
    };
    return `${knownCauses[causeCode] ?? 'falha de rede'} (${causeCode})`;
  }

  return 'falha de rede ou timeout';
}

function httpFailureAction(targetName, status) {
  if (status === 401 || status === 403) {
    if (targetName === 'Web') {
      return 'o site respondeu, mas recusou a requisição; confira regras de CDN/WAF e o deployment';
    }
    return 'o endpoint respondeu, mas recusou a sondagem; confira chave pública, URL e regras de acesso';
  }
  if (status === 404) {
    return 'o endpoint respondeu, mas a rota não foi encontrada; confira a rota monitorada e a configuração do serviço';
  }
  if (status === 408 || status === 425) {
    return 'resposta temporariamente lenta ou indisponível; confira latência e disponibilidade do provedor';
  }
  if (status === 429) {
    return 'requisições limitadas; confira rate limits e frequência do monitor';
  }
  if (status >= 500) {
    const providerLogs =
      targetName === 'Web'
        ? 'logs do provedor de hospedagem/CDN'
        : 'logs do projeto Supabase';
    return `erro no serviço ou gateway; use o request_id para correlacionar com os ${providerLogs}`;
  }
  return 'o endpoint respondeu, mas a sondagem não foi aceita; confira rota e configuração do monitor';
}

function responseRequestId(target, response) {
  const requestIdHeaders =
    target.name === 'Web'
      ? ['cf-ray', 'x-request-id']
      : ['sb-request-id', 'x-request-id'];
  for (const header of requestIdHeaders) {
    const value = response.headers.get(header);
    if (value && /^[A-Za-z0-9._:-]{1,128}$/u.test(value)) return value;
  }
  return undefined;
}

function responseHeader(response, name, pattern) {
  const value = response.headers.get(name)?.trim();
  return value && pattern.test(value) ? value : undefined;
}

function responseDiagnostics(target, response) {
  const fields = [];
  const contentType = responseHeader(
    response,
    'content-type',
    /^[\x20-\x7e]{1,128}$/u,
  );
  if (contentType) fields.push(`content-type=${JSON.stringify(contentType)}`);

  const contentLength = responseHeader(
    response,
    'content-length',
    /^\d{1,15}$/u,
  );
  if (contentLength) {
    fields.push(`content-length=${contentLength} B (declarado)`);
  } else fields.push('content-length=ausente');

  const contentEncoding = responseHeader(
    response,
    'content-encoding',
    /^(?:identity|gzip|br|deflate|zstd|compress)(?:\s*,\s*(?:identity|gzip|br|deflate|zstd|compress))*$/iu,
  );
  if (contentEncoding) fields.push(`content-encoding=${contentEncoding}`);

  if (target.name === 'Web') {
    const cacheStatus = responseHeader(
      response,
      'cf-cache-status',
      /^[A-Za-z_-]{1,32}$/u,
    );
    if (cacheStatus) fields.push(`cf-cache-status=${cacheStatus}`);

    const cacheAge = responseHeader(response, 'age', /^\d{1,12}$/u);
    if (cacheAge) fields.push(`age=${cacheAge}s`);
  }

  if (response.status === 429 || response.status >= 500) {
    const headerValue = responseHeader(
      response,
      'retry-after',
      /^[\x20-\x7e]{1,64}$/u,
    );
    if (headerValue && /^\d{1,10}$/u.test(headerValue)) {
      fields.push(`retry-after=${headerValue}s`);
    } else if (headerValue) {
      const parsedDate = Date.parse(headerValue);
      if (Number.isFinite(parsedDate)) {
        fields.push(`retry-after=${new Date(parsedDate).toISOString()}`);
      }
    }
  }

  return { fields, requestId: responseRequestId(target, response) };
}

function operationLabel(target) {
  const method = target.method ?? 'GET';
  let path = target.path;
  if (typeof path !== 'string') {
    try {
      path = new URL(target.url).pathname;
    } catch {
      path = '/';
    }
  }
  return `${method} ${path}`;
}

function requestPolicyLabel(target, timeoutMs) {
  return `${operationLabel(target)} (timeout ${timeoutMs} ms; redirects ${target.redirect ?? 'follow'})`;
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function formatHealthcheckEvent({
  outcome,
  startedAt,
  durationMs,
  results,
  failureMessage,
}) {
  const lines = [
    'Setlist — monitor de disponibilidade Web e Supabase',
    `Resultado: ${outcome}`,
    `Início UTC: ${startedAt}`,
    `Duração total: ${durationMs} ms`,
  ];

  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
  if (
    typeof repository === 'string' &&
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository) &&
    typeof runId === 'string' &&
    /^\d+$/u.test(runId)
  ) {
    const attemptLabel =
      typeof runAttempt === 'string' && /^\d+$/u.test(runAttempt)
        ? `Tentativa do workflow: ${runAttempt}`
        : undefined;
    lines.push(
      `Execução GitHub Actions: https://github.com/${repository}/actions/runs/${runId}`,
    );
    if (attemptLabel) lines.push(attemptLabel);
  }

  const commit = process.env.GITHUB_SHA;
  if (typeof commit === 'string' && /^[0-9a-f]{7,40}$/iu.test(commit)) {
    lines.push(`Commit: ${commit.slice(0, 12)}`);
  }

  if (failureMessage) lines.push(`Resumo: ${failureMessage}`);
  if (results.length > 0) {
    lines.push('Tentativas por serviço:');
    for (const result of results) {
      lines.push(
        `- ${result.name}: ${result.healthy ? 'saudável' : 'falha final'}`,
      );
      if (result.operation) lines.push(`  operação: ${result.operation}`);
      for (const attempt of result.attempts) {
        const requestId = attempt.requestId
          ? `; request_id=${attempt.requestId}`
          : '';
        const retry = Number.isFinite(attempt.retryDelayMs)
          ? `; retry em ${attempt.retryDelayMs} ms`
          : '';
        lines.push(
          `  tentativa ${attempt.number}: ${attempt.detail}; ${attempt.elapsedMs} ms${requestId}${retry}`,
        );
      }
    }
  }

  return lines.join('\n');
}

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
    typeof publishableKey !== 'string' ||
    publishableKey.length < 20 ||
    !publishableKey.startsWith('sb_publishable_')
  ) {
    throw new Error('Configuração de sondagem pública incompleta.');
  }

  const base = supabase.href.replace(/\/+$/u, '');
  const publicHeaders = { apikey: publishableKey };
  return [
    {
      name: 'Web',
      method: 'GET',
      path: site.pathname,
      url: site.href,
      headers: {},
      redirect: 'follow',
    },
    {
      name: 'Supabase REST',
      method: 'GET',
      path: '/rest/v1/songs',
      // The PostgREST root exposes OpenAPI metadata and requires a secret key.
      // Probe a zero-row query instead so the public publishable key is enough
      // and no application data is returned.
      url: `${base}/rest/v1/songs?select=id&limit=0`,
      headers: { ...publicHeaders, accept: 'application/json' },
      redirect: 'error',
    },
    {
      name: 'Supabase Auth',
      method: 'GET',
      path: '/auth/v1/settings',
      url: `${base}/auth/v1/settings`,
      headers: publicHeaders,
      redirect: 'error',
    },
  ];
}

export async function probeServices(
  targets,
  {
    fetchImpl = fetch,
    timeoutMs = configuredTimeoutMs(),
    maxAttempts = MAX_ATTEMPTS,
    retryDelayMs = RETRY_DELAY_MS,
    waitImpl = wait,
    report = console,
  } = {},
) {
  const attemptLimit = Number.isFinite(maxAttempts)
    ? Math.max(1, Math.trunc(maxAttempts))
    : MAX_ATTEMPTS;
  const retryDelay = Number.isFinite(retryDelayMs)
    ? Math.max(0, Math.trunc(retryDelayMs))
    : RETRY_DELAY_MS;
  const failures = [];
  const results = [];

  for (const target of targets) {
    let lastFailure;
    let attemptsMade = 0;
    const attempts = [];
    const operation = requestPolicyLabel(target, timeoutMs);
    for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
      attemptsMade = attempt;
      const startedAt = Date.now();
      let response;
      try {
        response = await fetchImpl(target.url, {
          method: target.method ?? 'GET',
          headers: target.headers,
          redirect: target.redirect,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        lastFailure = {
          kind: 'network',
          reason: networkFailureReason(error, timeoutMs),
          elapsedMs,
        };
        const attemptResult = {
          number: attempt,
          detail: lastFailure.reason,
          elapsedMs,
        };
        attempts.push(attemptResult);
        if (attempt < attemptLimit) {
          const delayMs = retryDelay * 2 ** (attempt - 1);
          attemptResult.retryDelayMs = delayMs;
          report.warn?.(
            `${target.name}: ${operation}, tentativa ${attempt}/${attemptLimit} falhou após ${elapsedMs} ms — ${lastFailure.reason}; nova tentativa em ${delayMs} ms.`,
          );
          await waitImpl(delayMs);
          continue;
        }
        break;
      }

      const elapsedMs = Date.now() - startedAt;
      await response.body?.cancel().catch(() => {});
      const diagnostics = responseDiagnostics(target, response);
      const diagnosticDetail = diagnostics.fields.join('; ');
      const requestDetail = diagnostics.requestId
        ? `; request_id=${diagnostics.requestId}`
        : '';
      if (response.status >= 200 && response.status < 300) {
        attempts.push({
          number: attempt,
          detail: `HTTP ${response.status}${diagnosticDetail ? `; ${diagnosticDetail}` : ''}`,
          elapsedMs,
          requestId: diagnostics.requestId,
        });
        report.info(
          `${target.name}: ${operation} → HTTP ${response.status} em ${elapsedMs} ms (tentativa ${attempt}/${attemptLimit})${diagnosticDetail ? `; ${diagnosticDetail}` : ''}${requestDetail}.`,
        );
        lastFailure = undefined;
        break;
      }

      lastFailure = {
        kind: 'http',
        status: response.status,
        elapsedMs,
        diagnostics: diagnosticDetail,
      };
      lastFailure.requestId = diagnostics.requestId;
      const attemptResult = {
        number: attempt,
        detail: `HTTP ${response.status}${diagnosticDetail ? `; ${diagnosticDetail}` : ''}`,
        elapsedMs,
        requestId: diagnostics.requestId,
      };
      attempts.push(attemptResult);
      if (isRetryableStatus(response.status) && attempt < attemptLimit) {
        const delayMs = retryDelay * 2 ** (attempt - 1);
        attemptResult.retryDelayMs = delayMs;
        report.warn?.(
          `${target.name}: ${operation}, tentativa ${attempt}/${attemptLimit} falhou após ${elapsedMs} ms — HTTP ${response.status}${diagnosticDetail ? `; ${diagnosticDetail}` : ''}${requestDetail}; nova tentativa em ${delayMs} ms.`,
        );
        await waitImpl(delayMs);
        continue;
      }
      break;
    }

    if (lastFailure) {
      const attemptSummary = `${attemptsMade} tentativa${attemptsMade === 1 ? '' : 's'}`;
      const requestDetail = lastFailure.requestId
        ? `, request_id=${lastFailure.requestId}`
        : '';
      if (lastFailure.kind === 'network') {
        failures.push(
          `${target.name}: falha de rede ou timeout — ${operation} sem resposta HTTP (${lastFailure.reason}) na tentativa final (${lastFailure.elapsedMs} ms); sondagem falhou após ${attemptSummary}. Verifique a conectividade/latência entre o runner do GitHub Actions e o serviço e compare com o status do provedor.`,
        );
      } else {
        const diagnosticDetail = lastFailure.diagnostics
          ? `; ${lastFailure.diagnostics}`
          : '';
        failures.push(
          `${target.name}: HTTP ${lastFailure.status} na tentativa final (${lastFailure.elapsedMs} ms${diagnosticDetail}${requestDetail}); operação: ${operation}; sondagem falhou após ${attemptSummary}. Ação: ${httpFailureAction(target.name, lastFailure.status)}.`,
        );
      }
    }
    results.push({
      name: target.name,
      operation,
      healthy: !lastFailure,
      attempts,
    });
  }

  if (failures.length > 0) {
    const error = new Error(failures.join(' '));
    error.serviceResults = results;
    throw error;
  }
  return results;
}

async function main() {
  const heartbeatUrl = process.env.SERVICE_UPTIME_HEARTBEAT_URL;
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  let failed = false;
  let failureMessage;
  let serviceResults = [];
  try {
    await sendHealthcheckPing(heartbeatUrl, '/start', {
      userAgent: HEALTHCHECKS_USER_AGENT,
    });
    const targets = buildServiceTargets({
      siteUrl: process.env.SETLIST_PUBLIC_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    serviceResults = await probeServices(targets);
  } catch (error) {
    failed = true;
    failureMessage =
      error instanceof Error ? error.message : 'Falha na sondagem pública.';
    serviceResults = Array.isArray(error?.serviceResults)
      ? error.serviceResults
      : [];
    console.error(failureMessage);
  }

  const recoveredAfterRetry =
    !failed && serviceResults.some((result) => result.attempts.length > 1);
  const eventBody =
    failed || recoveredAfterRetry
      ? formatHealthcheckEvent({
          outcome: failed ? 'FALHA' : 'RECUPERADO APÓS RETRY',
          startedAt,
          durationMs: Date.now() - startedAtMs,
          results: serviceResults,
          failureMessage,
        })
      : undefined;

  try {
    await sendHealthcheckPing(heartbeatUrl, failed ? '/fail' : '', {
      body: eventBody,
      userAgent: HEALTHCHECKS_USER_AGENT,
    });
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
