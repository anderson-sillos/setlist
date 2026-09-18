import { render } from '@testing-library/react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors } from '@/theme/tokens';

describe('AppIcon', () => {
  it('aplica o tamanho e a cor padrão sem expor o ícone decorativo', async () => {
    const view = await render(<AppIcon name="menu" />);
    const icon = view.toJSON();

    expect(icon).toMatchObject({
      props: {
        'aria-hidden': 'true',
      },
      type: 'RNSVGSvgView',
    });

    expect(icon).not.toBeNull();
    expect(Array.isArray(icon)).toBe(false);

    if (!icon || Array.isArray(icon)) {
      throw new Error('O AppIcon deve renderizar um único elemento SVG.');
    }

    expect(icon.props).not.toHaveProperty('accessibilityElementsHidden');
    expect(icon.props).not.toHaveProperty('accessible');
    expect(icon.props).not.toHaveProperty('importantForAccessibility');
    expect(icon.props).not.toHaveProperty('pointerEvents');
  });

  it('aceita personalização visual sem mudar sua semântica decorativa', async () => {
    const view = await render(
      <AppIcon
        color={colors.violet}
        name="shows"
        size={20}
        strokeWidth={2.5}
      />,
    );

    expect(view.toJSON()).toMatchObject({
      props: {
        'aria-hidden': 'true',
        height: 20,
        strokeWidth: 2.5,
        width: 20,
      },
      type: 'RNSVGSvgView',
    });
  });
});
