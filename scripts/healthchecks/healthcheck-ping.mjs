const PING_URL_PATTERN =
  /^https:\/\/hc-ping\.com\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export function validatePingUrl(value) {
  return typeof value === 'string' && PING_URL_PATTERN.test(value);
}

export async function sendHealthcheckPing(
  pingUrl,
  suffix = '',
  { fetchImpl = fetch, timeoutMs = 15_000 } = {},
) {
  if (!validatePingUrl(pingUrl)) {
    throw new Error('Healthchecks Ping URL ausente ou inválida.');
  }

  if (!['', '/start', '/fail'].includes(suffix)) {
    throw new Error('Sinal Healthchecks inválido.');
  }

  let response;
  try {
    response = await fetchImpl(`${pingUrl}${suffix}`, {
      method: 'GET',
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
