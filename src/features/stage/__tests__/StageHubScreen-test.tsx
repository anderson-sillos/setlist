import { render } from '@testing-library/react-native';

import { StageHubScreen } from '@/features/stage/StageHubScreen';
import { TestAppProviders } from '@/testing/TestAppProviders';
import {
  createStageTestScenario,
  stageTestIds,
  StageTestProviders,
} from '@/testing/scenarios/stageTestScenario';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('<StageHubScreen />', () => {
  it('apresenta os shows do palco com os mesmos metadados da lista de shows', async () => {
    const view = await render(
      <StageTestProviders>
        <StageHubScreen bandId={stageTestIds.band} />
      </StageTestProviders>,
    );

    expect(
      await view.findByLabelText(
        'Abrir Ensaio Aberto no modo palco. Status: Rascunho',
      ),
    ).toBeTruthy();
    expect(view.getByText('sáb. 19 set. 2026 - 16h')).toBeTruthy();
    expect(view.getAllByLabelText('Duração 7min').length).toBeGreaterThan(0);
    expect(view.getByText('Estúdio Central')).toBeTruthy();
    expect(
      view.getByLabelText('Abrir Show do Bairro no modo palco. Status: Pronto'),
    ).toBeTruthy();
    expect(
      view.queryByLabelText(/Abrir Encontro de Inverno no modo palco/),
    ).toBeNull();
  });

  it('usa resumos de shows sem carregar listas completas de shows ou músicas', async () => {
    const scenario = createStageTestScenario();
    const listShowDocuments = jest.spyOn(
      scenario.repositories.shows,
      'listByBandId',
    );
    const listShowSummaries = jest.spyOn(
      scenario.repositories.shows,
      'listSummariesByBandId',
    );
    const listSongDocuments = jest.spyOn(
      scenario.repositories.songs,
      'listByBandId',
    );
    const listSongSummaries = jest.spyOn(
      scenario.repositories.songs,
      'listSummariesByBandId',
    );
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <StageHubScreen bandId={stageTestIds.band} />
      </TestAppProviders>,
    );

    expect(
      await view.findByLabelText(
        'Abrir Ensaio Aberto no modo palco. Status: Rascunho',
      ),
    ).toBeTruthy();
    expect(listShowSummaries).toHaveBeenCalledWith(stageTestIds.band);
    expect(listShowDocuments).not.toHaveBeenCalled();
    expect(listSongDocuments).not.toHaveBeenCalled();
    expect(listSongSummaries).not.toHaveBeenCalled();
  });
});
