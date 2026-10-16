import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createInMemoryRepositories } from '@/testing/repositories';
import { BandCreationError, createBand } from '@/data/supabase/bandMutations';
import type { AppRepositories, EntityId } from '@/domain';
import { BandsScreen } from '@/features/bands/BandsScreen';
import { CURRENT_BAND_TERM } from '@/features/bands/legalTerm';
import {
  clearLastBandId,
  readLastBandId,
  writeLastBandId,
} from '@/features/bands/lastBandStorage';
import {
  createBand as createBandFixture,
  createBandMember,
  createShow,
  createUserBandSummary,
} from '@/testing/factories';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const CURRENT_USER_ID = 'user-bands-screen';
const HORIZONTE_BAND_ID = 'band-horizonte-test';
const AURORA_BAND_ID = 'band-aurora-test';
const DEFAULT_REPOSITORY_DATA = {
  bands: [
    createBandFixture({ id: HORIZONTE_BAND_ID, name: 'Banda Horizonte' }),
    createBandFixture({ id: AURORA_BAND_ID, name: 'Trio Aurora' }),
  ],
  bandMembers: [
    createBandMember({
      id: 'membership-horizonte-owner',
      bandId: HORIZONTE_BAND_ID,
      role: 'owner',
      userId: CURRENT_USER_ID,
    }),
    createBandMember({
      id: 'membership-aurora-member',
      bandId: AURORA_BAND_ID,
      role: 'member',
      userId: CURRENT_USER_ID,
    }),
  ],
  repertoireCollections: [],
  repertoireCollectionSongs: [],
  songs: [],
  shows: [
    createShow({
      id: 'show-horizonte-next',
      bandId: HORIZONTE_BAND_ID,
      name: 'Ensaio Aberto',
      startsAt: '2026-09-19T16:00:00-03:00',
      venue: 'Estúdio Central',
    }),
    createShow({
      id: 'show-aurora-next',
      bandId: AURORA_BAND_ID,
      name: 'Domingo no Café',
      startsAt: '2026-09-20T17:00:00-03:00',
      venue: 'Café da Esquina',
    }),
  ],
};

function createTestRepositories(
  data: Partial<typeof DEFAULT_REPOSITORY_DATA> = {},
): AppRepositories {
  return createInMemoryRepositories(
    { ...DEFAULT_REPOSITORY_DATA, ...data },
    { now: () => '2026-09-09T12:00:00-03:00' },
  );
}

function BandsTestProviders({
  children,
  currentUserId = CURRENT_USER_ID,
  repositories = createTestRepositories(),
}: {
  children: ReactNode;
  currentUserId?: EntityId;
  repositories?: AppRepositories;
}) {
  return (
    <AppProviders currentUserId={currentUserId} repositories={repositories}>
      {children}
    </AppProviders>
  );
}

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    addListener: () => jest.fn(),
    dispatch: jest.fn(),
  }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/data/supabase/bandMutations', () => {
  const actual = jest.requireActual('@/data/supabase/bandMutations');

  return {
    ...actual,
    createBand: jest.fn(),
  };
});

const mockCreateBand = jest.mocked(createBand);

describe('<BandsScreen />', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockCreateBand.mockResolvedValue('band-created-remotely');
    await clearLastBandId();
  });

  it('carrega Minhas bandas do repositório conectado', async () => {
    await writeLastBandId(HORIZONTE_BAND_ID);
    const repositories = createTestRepositories();
    const listUserSummaries = jest.spyOn(
      repositories.bands,
      'listUserSummaries',
    );
    const listShowsByBand = jest.spyOn(repositories.shows, 'listByBandId');
    const view = await render(
      <BandsTestProviders repositories={repositories}>
        <BandsScreen viewportHeight={900} viewportWidth={1440} />
      </BandsTestProviders>,
    );

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.getByLabelText('Abrir Banda Horizonte')).toBeTruthy();
    expect(view.getByTestId('bands-list')).toBeTruthy();
    expect(view.getByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Proprietário')).toBeTruthy();
    expect(view.getByText('Integrante')).toBeTruthy();
    expect(listUserSummaries).toHaveBeenCalledTimes(1);
    expect(listShowsByBand).not.toHaveBeenCalled();
    expect(
      view.getByLabelText('Ir para Minhas bandas').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getAllByText(/Próximo show/)).toHaveLength(2);
    expect(
      view.getByText('Próximo show · sáb. 19 set. 2026 - 16h'),
    ).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Criar banda'));
    expect(view.getByTestId('create-band-dialog')).toBeTruthy();
    expect(view.getByTestId('band-creation-keyboard-layout')).toBeTruthy();
    expect(view.getByText(CURRENT_BAND_TERM.title)).toBeTruthy();
    expect(
      view.getByLabelText('Confirmar criação da banda').props
        .accessibilityState,
    ).toEqual({
      disabled: true,
    });
    await fireEvent.press(
      view.getByLabelText('Aceitar termo de responsabilidade'),
    );
    await fireEvent.changeText(
      view.getByLabelText('Nome da banda'),
      '  Banda Nova  ',
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação da banda'));

    await waitFor(() => {
      expect(mockCreateBand).toHaveBeenCalledWith({
        acceptedTerm: true,
        name: '  Banda Nova  ',
        termVersion: CURRENT_BAND_TERM.version,
      });
    });
    await waitFor(() =>
      expect(view.queryByTestId('create-band-dialog')).toBeNull(),
    );
  });

  it('mantém o estado de carregamento até receber o resumo do próximo show', async () => {
    const repositories = createTestRepositories({
      bands: [createBandFixture({ id: HORIZONTE_BAND_ID })],
      bandMembers: [
        createBandMember({
          bandId: HORIZONTE_BAND_ID,
          userId: CURRENT_USER_ID,
        }),
      ],
      shows: [],
    });
    let resolveSummaries:
      | ((summaries: ReturnType<typeof createUserBandSummary>[]) => void)
      | undefined;
    const listUserSummaries = jest
      .spyOn(repositories.bands, 'listUserSummaries')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSummaries = resolve;
          }),
      );
    const view = await render(
      <BandsTestProviders repositories={repositories}>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await waitFor(() => expect(listUserSummaries).toHaveBeenCalledTimes(1));
    expect(view.queryByText('Nenhum próximo show')).toBeNull();

    await act(async () => {
      resolveSummaries?.([
        createUserBandSummary({
          bandId: HORIZONTE_BAND_ID,
          bandName: 'Banda Horizonte',
          nextShowStartsAt: null,
          role: 'member',
        }),
      ]);
    });

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Nenhum próximo show')).toBeTruthy();
  });

  it('bloqueia a criação quando o termo não foi aceito', async () => {
    const view = await render(
      <BandsTestProviders>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.press(view.getByLabelText('Criar banda'));
    await fireEvent.changeText(
      view.getByLabelText('Nome da banda'),
      'Banda sem aceite',
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação da banda'));

    expect(mockCreateBand).not.toHaveBeenCalled();
    expect(view.queryByText('Banda criada')).toBeNull();
  });

  it('apresenta uma falha retornada pelo servidor e mantém o formulário', async () => {
    mockCreateBand.mockRejectedValueOnce(
      new BandCreationError(
        'request_failed',
        'Não foi possível criar a banda agora. Tente novamente.',
      ),
    );
    const view = await render(
      <BandsTestProviders>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.press(view.getByLabelText('Criar banda'));
    await fireEvent.changeText(
      view.getByLabelText('Nome da banda'),
      'Banda com erro',
    );
    await fireEvent.press(
      view.getByLabelText('Aceitar termo de responsabilidade'),
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação da banda'));

    expect(
      await view.findByText(
        'Não foi possível criar a banda agora. Tente novamente.',
      ),
    ).toBeTruthy();
    expect(view.getByTestId('create-band-dialog')).toBeTruthy();
  });

  it('busca bandas pelo nome', async () => {
    const view = await render(
      <BandsTestProviders>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.changeText(
      view.getByLabelText('Buscar banda pelo nome'),
      'aurora',
    );

    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.queryByText('Banda Horizonte')).toBeNull();
  });

  it('persiste a banda escolhida para a próxima abertura', async () => {
    const view = await render(
      <BandsTestProviders>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.press(view.getByLabelText('Abrir Trio Aurora'));

    expect(await view.findByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
  });

  it('mostra o estado neutro quando a pessoa ainda não participa de uma banda', async () => {
    const view = await render(
      <BandsTestProviders
        repositories={createTestRepositories({
          bandMembers: [],
          bands: [],
          shows: [],
          songs: [],
        })}
      >
        <BandsScreen />
      </BandsTestProviders>,
    );

    expect(await view.findByText('Seu palco ainda está vazio')).toBeTruthy();
    expect(
      view.getByText(
        'Crie uma banda ou abra o link de convite que você recebeu.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Criar banda')).toBeTruthy();
  });

  it('remove uma seleção persistida quando ela deixa de ser autorizada', async () => {
    await writeLastBandId('band-no-longer-authorized');

    const view = await render(
      <BandsTestProviders>
        <BandsScreen />
      </BandsTestProviders>,
    );

    await view.findByText('Banda Horizonte');
    await waitFor(async () => {
      expect(await readLastBandId()).toBeNull();
    });
    expect(view.queryByText('Última acessada')).toBeNull();
  });
});
