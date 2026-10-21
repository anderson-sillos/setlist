const PING_URL_PATTERN =
  /^https:\/\/hc-ping\.com\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const MAX_PING_BODY_BYTES = 16_000;

export function validatePingUrl(value) {
  return typeof value === 'string' && PING_URL_PATTERN.test(value);
}

export async function sendHealthcheckPing(
  pingUrl,
  suffix = '',
  {
    fetchImpl = fetch,
    timeoutMs = 15_000,
    body,
    userAgent,
  } = {},
) {
  if (!validatePingUrl(pingUrl)) {
    throw new Error('Healthchecks Ping URL ausente ou inválida.');
  }

  if (!['', '/start', '/fail'].includes(suffix)) {
    throw new Error('Sinal Healthchecks inválido.');
  }

  if (body !== undefined && typeof body !== 'string') {
    throw new Error('O diagnóstico do Healthchecks deve ser texto.');
  }
  if (
    body !== undefined &&
    new TextEncoder().encode(body).byteLength > MAX_PING_BODY_BYTES
  ) {
    throw new Error('O diagnóstico do Healthchecks excede o limite local.');
  }

  let response;
  try {
    const headers = {};
    if (body !== undefined) {
      headers['content-type'] = 'text/plain; charset=utf-8';
    }
    if (userAgent) headers['user-agent'] = userAgent;

    response = await fetchImpl(`${pingUrl}${suffix}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      ...(body === undefined ? {} : { body }),
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error('Não foi possível enviar o sinal ao Healthchecks.');
  }

  await response.body?.cancel().catch(() => {});
  if (!response.ok) {
    throw new Error('Healthchecks recusou o sinal.');
  }
}
