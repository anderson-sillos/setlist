import { render } from '@testing-library/react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors } from '@/theme/tokens';

describe('AppIcon', () => {
  it('aplica o tamanho e a cor padrão sem expor o ícone decorativo', async () => {
    const view = await render(<AppIcon name="menu" />);

    expect(view.toJSON()).toMatchObject({
      props: {
        accessibilityElementsHidden: true,
        accessible: false,
        importantForAccessibility: 'no',
        pointerEvents: 'none',
      },
      type: 'RNSVGSvgView',
    });
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
        accessible: false,
      },
      type: 'RNSVGSvgView',
    });
  });
});
