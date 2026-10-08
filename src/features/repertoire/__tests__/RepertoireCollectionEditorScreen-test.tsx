import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => mockRouter,
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

describe('<RepertoireCollectionEditorScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida nome vazio, limite de 120 caracteres e duplicidade', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('Informe um nome para a coleção.'),
    ).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'a'.repeat(121),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('O nome pode ter até 120 caracteres.'),
    ).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      '  ACÚSTICO  ',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('Já existe uma coleção com esse nome nesta banda.'),
    ).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('permite salvar uma coleção vazia após nome válido', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-demo-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      '  Ensaios  ',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: demoIds.primaryBand,
        name: 'Ensaios',
        orderedSongIds: [],
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-new`,
      );
    });
  });

  it('renomeia mantendo as músicas e a revisão existente', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-demo-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festa de rua');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
        name: 'Festa de rua',
        orderedSongIds: ['song-demo-luzes', 'song-demo-mare-neon'],
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa`,
      );
    });
  });

  it('preserva o texto após falha e permite tentar novamente', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const saveSpy = jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'request_failed',
          'Não foi possível atualizar as coleções agora. Tente novamente.',
        ),
      );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festival');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    expect(
      await view.findByText(
        'Não foi possível atualizar as coleções agora. Tente novamente.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Nome da coleção').props.value).toBe('Festival');
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(
      view.getByLabelText('Salvar coleção').props.accessibilityState,
    ).toEqual({ disabled: false });
  });

  it('mantém escolhas entre buscas e filtros e seleciona apenas resultados visíveis', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByLabelText('Selecionar Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    expect(await view.findByText('Entre Pontes')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Selecionar resultados (1)' }),
    );

    expect(
      view.getByLabelText('Remover Luzes da Cidade da coleção'),
    ).toBeTruthy();
    expect(view.getByLabelText('Remover Entre Pontes da coleção')).toBeTruthy();
    expect(view.queryByLabelText('Remover Maré de Neon da coleção')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'coletivo atlântico',
    );
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.getByText('2 escolhidas')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(
      view.getByLabelText('Alterar filtros da seleção de músicas'),
    );
    await fireEvent.press(view.getByText('Arquivadas'));
    expect(await view.findByText('Rota Antiga')).toBeTruthy();
    expect(view.getByText('2 escolhidas')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Selecionar resultados (1)' }),
    );
    expect(view.getByLabelText('Remover Rota Antiga da coleção')).toBeTruthy();

    await fireEvent.press(
      view.getByLabelText('Alterar filtros da seleção de músicas'),
    );
    await fireEvent.press(view.getByText('Todas'));
    await fireEvent.press(view.getByLabelText('Alterar ordenação das músicas'));
    await fireEvent.press(view.getByText('Maior duração'));
    expect(view.getAllByRole('checkbox')[0]?.props.accessibilityLabel).toBe(
      'Selecionar Maré de Neon',
    );
    expect(view.getByText('3 escolhidas')).toBeTruthy();
  });
});
