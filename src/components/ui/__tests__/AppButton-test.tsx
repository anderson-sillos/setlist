import { fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '@/components/ui/AppButton';

describe('<AppButton />', () => {
  it.each([
    { label: 'Ação principal', variant: 'primary' as const },
    { label: 'Ação secundária', variant: 'secondary' as const },
  ])('executa $label na variante $variant', async ({ label, variant }) => {
    const onPress = jest.fn();
    const view = await render(
      <AppButton label={label} onPress={onPress} variant={variant} />,
    );

    await fireEvent.press(view.getByRole('button'));

    expect(view.getByText(label)).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
