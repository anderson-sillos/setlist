import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('<HomeScreen />', () => {
  it.each([
    { width: 390, mode: 'phone', columns: 1 },
    { width: 820, mode: 'tablet', columns: 2 },
    { width: 1440, mode: 'desktop', columns: 3 },
  ] as const)(
    'apresenta o catálogo em $mode',
    async ({ width, mode, columns }) => {
      const { getAllByRole, getAllByTestId, getByTestId, getByText } =
        await render(<HomeScreen viewportWidth={width} />);

      expect(getByTestId(`catalog-${mode}`)).toBeTruthy();
      expect(
        getByText(`Layout ${mode} · ${columns}`, { exact: false }),
      ).toBeTruthy();
      expect(getByText(`${width} px`)).toBeTruthy();
      expect(getAllByTestId(/platform-card-/)).toHaveLength(3);
      expect(getAllByRole('button')).toHaveLength(2);
    },
  );

  it('usa a largura da janela quando não recebe uma largura de catálogo', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText(/Layout (phone|tablet|desktop)/)).toBeTruthy();
  });
});
