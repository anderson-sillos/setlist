import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// Documento web compartilhado por todas as rotas do aplicativo.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Setlist</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :focus-visible {
                outline: 3px solid #5b21b6 !important;
                outline-offset: 2px;
              }

              input:focus-visible,
              textarea:focus-visible {
                outline: 3px solid #5b21b6 !important;
                outline-offset: 2px;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
