import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { withTiming } from 'react-native-reanimated';

import { ContentFade } from '@/components/ui/ContentFade';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { motion } from '@/theme/tokens';

jest.mock('@/hooks/useReducedMotionPreference', () => ({
  useReducedMotionPreference: jest.fn(),
}));

describe('<ContentFade />', () => {
  beforeEach(() => {
    jest.mocked(withTiming).mockClear();
  });

  it('mantém a região montada e anima somente após o carregamento inicial', async () => {
    jest.mocked(useReducedMotionPreference).mockReturnValue(false);
    const view = await render(
      <ContentFade loading>
        <Text testID="content">Conteúdo</Text>
      </ContentFade>,
    );

    expect(view.getByTestId('content')).toBeTruthy();
    await view.rerender(
      <ContentFade loading={false}>
        <Text testID="content">Conteúdo</Text>
      </ContentFade>,
    );

    expect(view.getByTestId('content')).toBeTruthy();
    expect(withTiming).toHaveBeenCalledWith(1, { duration: motion.surface });
  });

  it('exibe o conteúdo sem animação quando a pessoa reduz movimento', async () => {
    jest.mocked(useReducedMotionPreference).mockReturnValue(true);
    const view = await render(
      <ContentFade loading>
        <Text testID="content">Conteúdo</Text>
      </ContentFade>,
    );

    await view.rerender(
      <ContentFade loading={false}>
        <Text testID="content">Conteúdo</Text>
      </ContentFade>,
    );

    expect(view.getByTestId('content')).toBeTruthy();
    expect(withTiming).not.toHaveBeenCalled();
  });
});
