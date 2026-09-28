interface YouTubeMobilePlayerProps {
  readonly videoId: string;
  readonly viewportWidth: number;
}

/** O player WebView só é usado em iOS e Android. */
export function YouTubeMobilePlayer(_props: YouTubeMobilePlayerProps) {
  return null;
}
