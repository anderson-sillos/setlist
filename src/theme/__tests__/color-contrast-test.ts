import { colors } from '@/theme/tokens';

function getRelativeLuminance(color: string): number {
  const [red, green, blue] = color
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(foreground: string, background: string): number {
  const luminance = [
    getRelativeLuminance(foreground),
    getRelativeLuminance(background),
  ].sort((first, second) => second - first);

  return (luminance[0] + 0.05) / (luminance[1] + 0.05);
}

describe('contraste dos tokens de texto', () => {
  it.each([
    ['texto padrão em papel', colors.ink, colors.paper],
    ['texto padrão em superfície', colors.ink, colors.surface],
    ['texto secundário em papel', colors.muted, colors.paper],
    ['texto secundário em superfície', colors.muted, colors.surface],
    ['texto de destaque em superfície', colors.violetDark, colors.surface],
    [
      'texto de destaque em violeta suave',
      colors.violetDark,
      colors.violetSoft,
    ],
    ['texto inverso em botão primário', colors.surface, colors.violet],
  ])('mantém AA para %s', (_name, foreground, background) => {
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
