import { render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { StageHubScreen } from '@/features/stage/StageHubScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('<StageHubScreen />', () => {
  it('apresenta os shows do palco com os mesmos metadados da lista de shows', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const view = await render(
      <AppProviders repositories={repositories}>
        <StageHubScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(
      await view.findByLabelText('Abrir Ensaio Aberto no modo palco'),
    ).toBeTruthy();
    expect(view.getByText('sáb, 19 de set. de 2026 · 16h')).toBeTruthy();
    expect(view.getAllByLabelText('Duração 7min').length).toBeGreaterThan(0);
    expect(view.getByText('Estúdio Central')).toBeTruthy();
    expect(
      view.getByLabelText('Abrir Show do Bairro no modo palco'),
    ).toBeTruthy();
    expect(
      view.queryByLabelText('Abrir Encontro de Inverno no modo palco'),
    ).toBeNull();
  });
});
