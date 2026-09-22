const youtubeHosts = new Set([
  'music.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'www.youtube-nocookie.com',
]);

export function normalizeYoutubeReference(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    if (
      url.protocol !== 'https:' ||
      url.port.length > 0 ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      !youtubeHosts.has(url.hostname)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
