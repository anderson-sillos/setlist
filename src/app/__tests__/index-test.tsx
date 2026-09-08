import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('<HomeScreen />', () => {
  it('apresenta a fundação multiplataforma', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('SETLIST')).toBeTruthy();
    expect(getByText('Base multiplataforma pronta')).toBeTruthy();
  });
});
