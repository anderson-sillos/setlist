import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { withTiming } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { colors, motion } from '@/theme/tokens';

let mockReducedMotion = false;
jest.mock('@/hooks/useReducedMotionPreference', () => ({
  useReducedMotionPreference: () => mockReducedMotion,
}));

type RenderedNode = ReturnType<Awaited<ReturnType<typeof render>>['toJSON']>;

function findIcon(node: RenderedNode): Record<string, unknown> | undefined {
  if (!node) return;
  if (Array.isArray(node)) {
    return node.map(findIcon).find(Boolean);
  }
  if (node.type === 'RNSVGSvgView') return node.props;
  for (const child of node.children ?? []) {
    if (typeof child === 'string') continue;
    const icon = findIcon(child);
    if (icon) return icon;
  }
}

describe('<AppButton />', () => {
  beforeEach(() => {
    mockReducedMotion = false;
    jest.mocked(withTiming).mockClear();
  });

  it.each([
    { icon: undefined, label: 'Ação principal', variant: 'primary' as const },
    {
      icon: 'edit' as const,
      label: 'Ação secundária',
      variant: 'secondary' as const,
    },
  ])(
    'executa $label na variante $variant',
    async ({ icon, label, variant }) => {
      const onPress = jest.fn();
      const view = await render(
        <AppButton
          icon={icon}
          label={label}
          onPress={onPress}
          variant={variant}
        />,
      );

      await fireEvent.press(view.getByRole('button'));

      expect(view.getByText(label)).toBeTruthy();
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('preserva ícone e texto durante pressão e evidencia foco no componente', async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const style = jest.fn(() => ({ marginTop: 8 }));
    const view = await render(
      <AppButton
        icon="add"
        label="Criar banda"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
      />,
    );
    const button = view.getByRole('button');

    await fireEvent(button, 'pressIn');
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledWith(1, { duration: motion.short });
    expect(view.getByText('Criar banda')).toBeTruthy();
    expect(findIcon(view.toJSON())).toMatchObject({
      height: 18,
      width: 18,
    });
    await fireEvent(button, 'pressOut');
    expect(onPressOut).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledWith(0, { duration: motion.short });

    await fireEvent(button, 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(
      StyleSheet.flatten(view.getByRole('button').props.style),
    ).toMatchObject({
      borderColor: colors.border.focus,
      borderWidth: 2,
      marginTop: 8,
    });
    await fireEvent(button, 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(
      StyleSheet.flatten(view.getByRole('button').props.style).borderWidth,
    ).toBe(1);
    expect(style).toHaveBeenCalled();
    await userEvent.setup().press(button);
    expect(findIcon(view.toJSON())).toBeDefined();
  });

  it('aplica movimento reduzido durante a pressão e limpa o destaque ao desabilitar', async () => {
    const view = await render(<AppButton icon="add" label="Criar banda" />);
    await fireEvent(view.getByRole('button'), 'pressIn');
    jest.mocked(withTiming).mockClear();
    mockReducedMotion = true;
    await view.rerender(<AppButton icon="add" label="Criar banda" />);
    expect(withTiming).not.toHaveBeenCalled();
    await fireEvent(view.getByRole('button'), 'pressOut');
    expect(withTiming).not.toHaveBeenCalled();
    await fireEvent(view.getByRole('button'), 'pressIn');
    await view.rerender(<AppButton disabled icon="add" label="Criar banda" />);
    expect(view.getByRole('button').props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(findIcon(view.toJSON())).toMatchObject({
      stroke: colors.text.disabled,
    });
    expect(
      StyleSheet.flatten(view.getByText('Criar banda').props.style).color,
    ).toBe(colors.text.disabled);
    expect(withTiming).not.toHaveBeenCalled();
  });
});
