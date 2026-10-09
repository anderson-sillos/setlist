# Selos das lojas

Artes oficiais em português brasileiro, obtidas em 08/10/2026 e preservadas sem
alterações. As marcas e artes pertencem à Apple e ao Google; seu uso segue as
orientações dos respectivos fornecedores.

- `app-store-pt-br.svg`: [arte oficial da Apple](https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/pt-br),
  conforme as [diretrizes da App Store](https://developer.apple.com/app-store/marketing/guidelines/).
- `google-play-pt-br.svg`: `GetItOnGooglePlay_Badge_Web_color_Portuguese-Brazil.svg`
  do [Partner Marketing Hub](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86718).

O componente `MobileAppDownloadLinks.web.tsx` usa os SVGs locais com altura de
44 px e largura proporcional ao `viewBox`, sem depender das lojas para carregar
as imagens. Os destinos dos atalhos ficam em `src/config/mobileStoreLinks.ts`.
