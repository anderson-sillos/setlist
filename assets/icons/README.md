# Ícones do Setlist

Os arquivos desta pasta usam o mesmo símbolo `Music2` do `brandMark` da
navegação: nota branca sobre o violeta `#7c3aed`.

- `app-icon.svg`: fonte vetorial do ícone completo.
- `app-icon-1024.png`: fonte raster sem transparência usada pelo Expo para iOS,
  como ícone convencional do Android e como imagem central da splash nativa.
- `android-adaptive-foreground.svg` e
  `android-adaptive-foreground-1024.png`: camada branca transparente para o
  ícone adaptativo e monocromático do Android. O violeta é aplicado como fundo
  pela configuração do Expo.
- `app-icon-180.png`: variante para atalhos Apple Touch.
- `app-icon-192.png` e `app-icon-512.png`: variantes para atalhos e manifestos
  web.
- `favicon-16.png`, `favicon-32.png` e `favicon-48.png`: variantes PNG para
  navegadores.
- `favicon.ico`: arquivo multirresolução com 16, 32, 48, 64, 128 e 256 px.

O Expo/EAS gera automaticamente os demais tamanhos exigidos pelos catálogos de
ícones do Android e do iOS a partir das fontes de 1024 px. Para recriar todos os
arquivos depois de uma alteração visual, execute:

```bash
npm run assets:icons
```

O símbolo é derivado do ícone `Music2` do projeto Lucide, distribuído sob a
licença ISC.
