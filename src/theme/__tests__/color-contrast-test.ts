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
    [
      'texto principal na superfície base',
      colors.text.primary,
      colors.background.base,
      4.5,
    ],
    [
      'texto principal na superfície elevada',
      colors.text.primary,
      colors.background.raised,
      4.5,
    ],
    [
      'texto secundário no fundo base',
      colors.text.secondary,
      colors.background.base,
      4.5,
    ],
    [
      'texto secundário na superfície elevada',
      colors.text.secondary,
      colors.background.raised,
      4.5,
    ],
    [
      'texto discreto na superfície elevada',
      colors.text.muted,
      colors.background.raised,
      4.5,
    ],
    [
      'ação violeta na superfície base',
      colors.action.primary,
      colors.background.base,
      4.5,
    ],
    [
      'ação violeta na superfície selecionada',
      colors.action.primary,
      colors.background.selected,
      4.5,
    ],
    [
      'texto do botão primário',
      colors.text.onAccent,
      colors.action.primary,
      4.5,
    ],
    [
      'texto do botão pressionado',
      colors.text.onAccent,
      colors.action.pressed,
      4.5,
    ],
    [
      'estado de sucesso',
      colors.semantic.success,
      colors.semantic.successSurface,
      4.5,
    ],
    [
      'estado de atenção',
      colors.semantic.warning,
      colors.semantic.warningSurface,
      4.5,
    ],
    [
      'estado de erro',
      colors.semantic.danger,
      colors.semantic.dangerSurface,
      4.5,
    ],
    [
      'estado informativo',
      colors.semantic.info,
      colors.semantic.infoSurface,
      4.5,
    ],
    [
      'borda de controle na superfície base',
      colors.border.control,
      colors.background.base,
      3,
    ],
    [
      'borda de foco na superfície elevada',
      colors.border.focus,
      colors.background.raised,
      3,
    ],
  ])(
    'atinge o contraste definido para %s',
    (_name, foreground, background, minimum) => {
      expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(
        minimum,
      );
    },
  );
});
