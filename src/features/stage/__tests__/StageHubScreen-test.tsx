import { render } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import { StageHubScreen } from '@/features/stage/StageHubScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
}));

describe('<StageHubScreen />', () => {
  it('apresenta os shows do palco com os mesmos metadados da lista de shows', async () => {
    const view = await render(
      <AppProviders>
        <StageHubScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(
      await view.findByLabelText('Abrir Ensaio Aberto no modo palco'),
    ).toBeTruthy();
    expect(view.getByText('sáb, 19 de set. de 2026 · 16h')).toBeTruthy();
    expect(view.getAllByLabelText('Duração 7min').length).toBeGreaterThan(0);
    expect(view.getByText('Estúdio Central')).toBeTruthy();
  });
});
