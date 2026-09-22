import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ExpoCrypto from 'expo-crypto';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import {
  createSong,
  SongMutationError,
  updateSong,
} from '@/data/supabase/songMutations';
import { SongEditorScreen } from '@/features/repertoire/SongEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => mockRouter,
}));

jest.mock('@/data/supabase/songMutations', () => {
  const actual = jest.requireActual('@/data/supabase/songMutations');

  return {
    ...actual,
    createSong: jest.fn(),
    updateSong: jest.fn(),
  };
});

const mockCreateSong = jest.mocked(createSong);
const mockUpdateSong = jest.mocked(updateSong);
const mockRandomUUID = jest.mocked(ExpoCrypto.randomUUID);

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

function createRepositories(role: 'owner' | 'editor' | 'member' = 'owner') {
  const bandId = 'band-live';
  const band = { ...demoRepositoryData.bands[0], id: bandId };
  const membership = {
    ...demoRepositoryData.bandMembers[0],
    bandId,
    id: 'member-live',
    role,
    userId: demoIds.currentUser,
  };
  const song = {
    ...demoRepositoryData.songs[0],
    bandId,
    id: 'song-live',
  };

  return {
    bandId,
    repositories: createInMemoryRepositories({
      bands: [band],
      bandMembers: [membership],
      shows: [],
      songs: [song],
    }),
    songId: song.id,
  };
}

describe('<SongEditorScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID.mockReset();
  });

  it('cria música para Owner e navega aos detalhes após salvar', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockCreateSong.mockResolvedValue('song-created');
    mockRandomUUID
      .mockReturnValueOnce('new-block')
      .mockReturnValueOnce('new-line')
      .mockReturnValueOnce('new-blank-line')
      .mockReturnValueOnce('new-refrain')
      .mockReturnValueOnce('new-refrain-line');
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.changeText(
      view.getByLabelText('Título da música *'),
      '  Nova faixa  ',
    );
    await fireEvent.changeText(view.getByLabelText('BPM'), '110');
    await fireEvent.changeText(view.getByLabelText('Duração'), '3:45');
    await fireEvent.changeText(
      view.getByLabelText('Letra completa'),
      '# Verso\nA rua acende devagar\n---\n# Refrão\nLevanta a voz',
    );
    await fireEvent.press(view.getByText('Salvar música'));

    await waitFor(() =>
      expect(mockCreateSong).toHaveBeenCalledWith({
        bandId,
        song: expect.objectContaining({
          bpm: 110,
          estimatedDurationMs: 225000,
          title: 'Nova faixa',
        }),
        lyrics: {
          blocks: [
            {
              id: 'new-block',
              name: 'Verso',
              lines: [
                {
                  id: 'new-line',
                  startTimeMs: null,
                  text: 'A rua acende devagar',
                },
                {
                  id: 'new-blank-line',
                  startTimeMs: null,
                  text: '',
                },
              ],
            },
            {
              id: 'new-refrain',
              name: 'Refrão',
              lines: [
                {
                  id: 'new-refrain-line',
                  startTimeMs: null,
                  text: 'Levanta a voz',
                },
              ],
            },
          ],
        },
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/song-created`,
    );
  });

  it('edita metadados existentes para Editor sem sobrescrever a letra', async () => {
    const { bandId, repositories, songId } = createRepositories('editor');
    mockUpdateSong.mockResolvedValue(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    const title = await view.findByLabelText('Título da música *');
    expect(title.props.value).toBe(demoRepositoryData.songs[0].title);
    await fireEvent.changeText(title, 'Título atualizado');
    await fireEvent.press(view.getByText('Salvar música'));

    await waitFor(() =>
      expect(mockUpdateSong).toHaveBeenCalledWith({
        bandId,
        lyrics: demoRepositoryData.songs[0]!.lyrics,
        songId,
        song: expect.objectContaining({ title: 'Título atualizado' }),
      }),
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('mantém os campos e as ações roláveis e valida título obrigatório', async () => {
    const { bandId, repositories } = createRepositories();
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByTestId('song-editor-keyboard-layout');
    expect(view.getByTestId('song-editor-scroll')).toBeTruthy();
    expect(view.getByText('Cancelar')).toBeTruthy();
    await fireEvent.press(view.getByText('Salvar música'));

    expect(await view.findByText('Informe o título da música.')).toBeTruthy();
    expect(mockCreateSong).not.toHaveBeenCalled();
  });

  it('preserva os dados do formulário se a gravação falhar', async () => {
    const { bandId, repositories } = createRepositories();
    mockCreateSong.mockRejectedValue(
      new SongMutationError('request_failed', 'Falha ao salvar no servidor.'),
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    const title = await view.findByLabelText('Título da música *');
    await fireEvent.changeText(title, 'Faixa que não pode sumir');
    await fireEvent.press(view.getByText('Salvar música'));

    expect(await view.findByText('Falha ao salvar no servidor.')).toBeTruthy();
    expect(view.getByLabelText('Título da música *').props.value).toBe(
      'Faixa que não pode sumir',
    );
  });

  it('bloqueia a edição de Member', async () => {
    const { bandId, repositories } = createRepositories('member');
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    expect(
      await view.findByText(
        'Seu papel permite consultar o repertório, não editá-lo',
      ),
    ).toBeTruthy();
    expect(view.queryByText('Salvar música')).toBeNull();
  });
});
