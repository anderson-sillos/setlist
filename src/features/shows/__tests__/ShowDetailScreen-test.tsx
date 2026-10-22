import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ShowMutationError, deleteShow, duplicateShow } from '@/data/supabase';
import {
  updateShow,
  updateShowStatus,
} from '@/data/supabase/showUpdateMutations';
import type { AppRepositories, BandRole } from '@/domain';
import { ShowDetailScreen } from '@/features/shows/ShowDetailScreen';
import {
  createLyricsForStatus,
  createShow,
  createShowPlanningSetlistItem,
  createShowSeparatorSetlistItem,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';
const BAND_ID = 'band-show-detail';
const OWNER_USER_ID = 'user-show-detail-owner';
const MEMBER_USER_ID = 'user-show-detail-member';
const FESTIVAL_SHOW_ID = 'show-festival-praca';
const CLUB_SHOW_ID = 'show-noite-no-clube';
const LIGHTS_SONG = createSong({
  id: 'song-lights-city',
  bandId: BAND_ID,
  title: 'Luzes da Cidade',
  originalArtist: 'Banda Horizonte',
  estimatedDurationMs: 218_000,
  lyricStatus: 'static',
  lyrics: createLyricsForStatus('static'),
});
const INSTRUMENTAL_SONG = createSong({
  id: 'song-opening-instrumental',
  bandId: BAND_ID,
  title: 'Instrumental de Abertura',
  estimatedDurationMs: 95_000,
});
const BRIDGES_SONG = createSong({
  id: 'song-entre-pontes',
  bandId: BAND_ID,
  title: 'Entre Pontes',
  estimatedDurationMs: 220_000,
  lyricStatus: 'synchronized',
  lyrics: createLyricsForStatus('synchronized'),
});
const RAIN_SONG = createSong({
  id: 'song-depois-da-chuva',
  bandId: BAND_ID,
  title: 'Depois da Chuva',
  estimatedDurationMs: 216_000,
  lyricStatus: 'incomplete',
  lyrics: createLyricsForStatus('incomplete'),
});
const SONGS = [LIGHTS_SONG, INSTRUMENTAL_SONG, BRIDGES_SONG, RAIN_SONG];
const FESTIVAL_SHOW = createShow({
  id: FESTIVAL_SHOW_ID,
  bandId: BAND_ID,
  name: 'Festival da Praça',
  startsAt: '2027-02-20T21:00:00-03:00',
  venue: 'Praça Central',
  notes: 'Passagem de som às 17h. Show com dois blocos e bis.',
  status: 'ready',
  blocks: [
    createShowSetlistBlock({
      id: 'show-block-festival-abertura',
      name: 'Abertura',
      items: [
        createShowSongSetlistItem({
          id: 'show-item-festival-instrumental',
          songId: INSTRUMENTAL_SONG.id,
          notes: 'Começar com luz baixa.',
        }),
        createShowPlanningSetlistItem({
          id: 'show-item-festival-apresentacao',
          description: 'Entrada e apresentação da banda',
          estimatedDurationMs: 90_000,
        }),
        createShowSongSetlistItem({
          id: 'show-item-festival-luzes-abertura',
          songId: LIGHTS_SONG.id,
        }),
      ],
    }),
    createShowSetlistBlock({
      id: 'show-block-festival-segundo',
      name: 'Segundo Set',
      items: [
        createShowSongSetlistItem({
          id: 'show-item-festival-pontes',
          songId: BRIDGES_SONG.id,
          notes: 'Emendar diretamente da fala do vocalista.',
        }),
        createShowPlanningSetlistItem({
          id: 'show-item-festival-afinacao',
          description: 'Troca de violão e afinação',
          estimatedDurationMs: 120_000,
        }),
        createShowPlanningSetlistItem({
          id: 'show-item-festival-interacao',
          description: 'Interação com o público',
        }),
        createShowSeparatorSetlistItem({ id: 'show-item-festival-separator' }),
        createShowSongSetlistItem({
          id: 'show-item-festival-luzes-bis',
          songId: LIGHTS_SONG.id,
          notes: 'Usar a versão curta no bis.',
        }),
        createShowSongSetlistItem({
          id: 'show-item-festival-chuva',
          songId: RAIN_SONG.id,
        }),
      ],
    }),
  ],
});
const CLUB_SHOW = createShow({
  id: CLUB_SHOW_ID,
  bandId: BAND_ID,
  name: 'Noite no Clube',
  startsAt: '2027-03-14T20:30:00-03:00',
  venue: 'Clube das Artes',
  notes: 'Repertório ainda em preparação.',
  status: 'draft',
  blocks: [
    createShowSetlistBlock({
      id: 'show-block-clube-principal',
      name: 'Principal',
      items: [
        createShowSongSetlistItem({
          id: 'show-item-clube-pontes',
          songId: BRIDGES_SONG.id,
        }),
        createShowSongSetlistItem({
          id: 'show-item-clube-luzes',
          songId: LIGHTS_SONG.id,
        }),
      ],
    }),
  ],
});
const MEMBER_SHOW = createShow({
  id: 'show-encontro-dezembro',
  bandId: BAND_ID,
  name: 'Encontro de Dezembro',
  startsAt: '2026-12-05T20:30:00-03:00',
  venue: 'Casa das Artes',
});
const CANCELLED_SHOW = createShow({
  id: 'show-cancelled',
  bandId: BAND_ID,
  name: 'Show cancelado',
  startsAt: '2027-04-01T20:00:00-03:00',
  status: 'cancelled',
});

function renderShowDetail({
  showId,
  role = 'owner',
  repositories: providedRepositories,
  viewportWidth,
  shows = [FESTIVAL_SHOW, CLUB_SHOW, MEMBER_SHOW],
}: {
  showId: string;
  role?: BandRole;
  repositories?: AppRepositories;
  viewportWidth?: number;
  shows?: readonly ReturnType<typeof createShow>[];
}) {
  const currentUserId = role === 'member' ? MEMBER_USER_ID : OWNER_USER_ID;
  const scenario = createBandScenario({
    bandId: BAND_ID,
    userId: currentUserId,
    role,
    songs: SONGS,
    shows,
  });
  const repositories = providedRepositories ?? scenario.repositories;

  return render(
    <AppProviders
      currentUserId={scenario.currentUserId}
      repositories={repositories}
    >
      <ShowDetailScreen
        bandId={scenario.band.id}
        showId={showId}
        viewportWidth={viewportWidth}
      />
    </AppProviders>,
  );
}
const mockReplace = jest.fn();

const mockPush = jest.fn();
jest.mock('@/data/supabase', () => ({
  ...jest.requireActual('@/data/supabase'),
  deleteShow: jest.fn().mockResolvedValue(undefined),
  duplicateShow: jest.fn().mockResolvedValue('show-duplicated'),
}));

jest.mock('@/data/supabase/showUpdateMutations', () => ({
  ...jest.requireActual('@/data/supabase/showUpdateMutations'),
  updateShow: jest.fn().mockResolvedValue(undefined),
  updateShowStatus: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe('<ShowDetailScreen />', () => {
  it('usa resumos de músicas e shows para completar os dados do detalhe', async () => {
    const repositories = createBandScenario({
      bandId: BAND_ID,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: SONGS,
      shows: [FESTIVAL_SHOW, CLUB_SHOW, MEMBER_SHOW],
    }).repositories;
    const listSongDocuments = jest.spyOn(repositories.songs, 'listByBandId');
    const listSongSummaries = jest.spyOn(
      repositories.songs,
      'listSummariesByBandId',
    );
    const listFullShowLists = jest.spyOn(repositories.shows, 'listByBandId');
    const listShowSummaries = jest.spyOn(
      repositories.shows,
      'listSummariesByBandId',
    );

    const view = await renderShowDetail({
      showId: FESTIVAL_SHOW_ID,
      repositories,
    });

    expect(await view.findByText('Festival da Praça')).toBeTruthy();
    expect(view.getByText('19min')).toBeTruthy();
    expect(listSongSummaries).toHaveBeenCalledWith(BAND_ID, {
      includeArchived: true,
    });
    expect(listShowSummaries).toHaveBeenCalledWith(BAND_ID);
    expect(listSongDocuments).not.toHaveBeenCalled();
    expect(listFullShowLists).not.toHaveBeenCalled();
  });

  it('mostra dados, blocos, ordem e observações do show', async () => {
    const view = await renderShowDetail({
      showId: FESTIVAL_SHOW_ID,
      viewportWidth: 1440,
    });

    expect(await view.findByText('Festival da Praça')).toBeTruthy();
    expect(view.getByTestId('show-detail-desktop')).toBeTruthy();
    expect(view.getByText('I. Abertura')).toBeTruthy();
    expect(view.getByText('II. Segundo Set')).toBeTruthy();
    expect(view.getByText('Usar a versão curta no bis.')).toBeTruthy();
    expect(view.getAllByText('Luzes da Cidade')).toHaveLength(2);
    expect(view.getByText('sáb, 20 de fev. de 2027 · 21h')).toBeTruthy();
    expect(view.getByText('19min')).toBeTruthy();
    expect(view.getByText('5 músicas')).toBeTruthy();
    expect(view.getByLabelText('5 músicas no setlist')).toBeTruthy();
    expect(view.getByText('Músicas 16min · Planejamento 3min')).toBeTruthy();
    expect(view.getAllByText('3min38s')).toHaveLength(2);
    expect(view.getByText('Entrada e apresentação da banda')).toBeTruthy();
    expect(view.getByText('Troca de violão e afinação')).toBeTruthy();
    expect(view.getByText('Interação com o público')).toBeTruthy();
    expect(view.queryByText('Planejamento')).toBeNull();
    expect(view.getAllByLabelText('Anotação de planejamento')).toHaveLength(3);
    expect(view.getByLabelText('Separador visual')).toBeTruthy();
    for (const number of ['1.', '2.', '3.', '4.', '5.']) {
      expect(view.getByText(number)).toBeTruthy();
    }
    expect(view.queryByText('6.')).toBeNull();
    const planningRow = view.getByTestId(
      'show-planning-item-show-item-festival-afinacao',
    );
    const songRow = view.getByTestId('show-song-item-show-item-festival-chuva');
    expect(
      StyleSheet.flatten(planningRow.props.style).backgroundColor,
    ).toBeUndefined();
    expect(StyleSheet.flatten(planningRow.props.style).padding).toBeUndefined();
    expect(
      StyleSheet.flatten(songRow.props.style).borderTopWidth,
    ).toBeUndefined();
    expect(view.queryByLabelText('Abrir modo palco')).toBeNull();
  });

  it('abre a edição da setlist em uma tela própria para shows editáveis', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    expect(await view.findByText('Noite no Clube')).toBeTruthy();
    expect(view.getByTestId('show-setlist-header')).toBeTruthy();
    expect(view.getByText('Editar setlist')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Editar setlist'));

    expect(mockPush).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/shows/${CLUB_SHOW_ID}/edit`,
    );
  });

  it('concentra as ações do show no popup de mais opções', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));

    expect(view.getByTestId('show-detail-actions-sheet')).toBeTruthy();
    expect(view.getByLabelText('Exportar setlist do show')).toBeTruthy();
    expect(
      view.getByLabelText('Adicionar cópia do show ao calendário'),
    ).toBeTruthy();
    expect(view.getByLabelText('Editar show')).toBeTruthy();
    expect(view.getByLabelText('Duplicar show')).toBeTruthy();
    expect(view.getByLabelText('Marcar como Pronto')).toBeTruthy();
    expect(view.getByLabelText('Cancelar show')).toBeTruthy();
    expect(view.getByLabelText('Excluir show')).toBeTruthy();
    expect(view.getByLabelText('Fechar mais opções do show')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Fechar mais opções do show'));

    expect(view.queryByTestId('show-detail-actions-sheet')).toBeNull();
  });

  it('apresenta as transições de status disponíveis para quem edita', async () => {
    const view = await renderShowDetail({ showId: FESTIVAL_SHOW_ID });

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Reabrir para edição'));

    expect(view.getByText('Status do show')).toBeTruthy();
    expect(view.getByLabelText('Confirmar Reabrir para edição')).toBeTruthy();
  });

  it('lista pendências de letras sem bloquear a confirmação de show pronto', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Marcar como Pronto'));

    expect(view.getByText('Verificação das letras')).toBeTruthy();
    expect(view.getAllByText('Luzes da Cidade')).toHaveLength(2);
    expect(view.getByText('Letra estática')).toBeTruthy();
    expect(view.getByLabelText('Confirmar Marcar como Pronto')).toBeTruthy();
  });

  it('mostra um estado quando o show não é encontrado', async () => {
    const view = await renderShowDetail({ showId: 'unknown', shows: [] });

    expect(await view.findByText('Show indisponível')).toBeTruthy();
  });

  beforeEach(() => jest.clearAllMocks());

  it('salva atualizações dos dados do show', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Editar show'));
    await fireEvent.changeText(
      view.getByLabelText('Nome do show'),
      'Noite atualizada',
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação do show'));

    await waitFor(() => {
      expect(updateShow).toHaveBeenCalledWith(
        expect.objectContaining({
          bandId: BAND_ID,
          showId: CLUB_SHOW_ID,
          name: 'Noite atualizada',
        }),
      );
    });
  });

  it('duplica o show e navega para o novo registro', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Duplicar show'));
    await fireEvent.changeText(
      view.getByLabelText('Nome do show'),
      'Noite duplicada',
    );
    await fireEvent.press(view.getByLabelText('Confirmar criação do show'));

    await waitFor(() => {
      expect(duplicateShow).toHaveBeenCalledWith(
        expect.objectContaining({
          bandId: BAND_ID,
          name: 'Noite duplicada',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/shows/show-duplicated`,
      );
    });
  });

  it('confirma uma transição de status e atualiza os dados do show', async () => {
    const view = await renderShowDetail({ showId: FESTIVAL_SHOW_ID });

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Reabrir para edição'));
    await fireEvent.press(view.getByLabelText('Confirmar Reabrir para edição'));

    await waitFor(() => {
      expect(updateShowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          bandId: BAND_ID,
          currentStatus: 'ready',
          showId: FESTIVAL_SHOW_ID,
          status: 'draft',
        }),
      );
    });
  });

  it('exclui definitivamente o show e retorna à lista', async () => {
    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Excluir show'));
    await fireEvent.press(
      view.getByLabelText('Confirmar exclusão definitiva do show'),
    );

    await waitFor(() => {
      expect(deleteShow).toHaveBeenCalledWith({
        bandId: BAND_ID,
        showId: CLUB_SHOW_ID,
      });
      expect(mockReplace).toHaveBeenCalledWith(`/bands/${BAND_ID}/shows`);
    });
  });

  it('permite que integrante consulte as cópias do show sem ações de edição', async () => {
    const view = await renderShowDetail({
      showId: MEMBER_SHOW.id,
      role: 'member',
    });

    await view.findByText('Encontro de Dezembro');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    expect(view.getByLabelText('Exportar setlist do show')).toBeTruthy();
    expect(
      view.getByLabelText('Adicionar cópia do show ao calendário'),
    ).toBeTruthy();
    expect(view.queryByLabelText('Editar show')).toBeNull();
    expect(view.queryByLabelText('Duplicar show')).toBeNull();
    expect(view.queryByLabelText('Editar setlist')).toBeNull();
  });

  it('encerra o menu antes de abrir a rota de exportação para integrante', async () => {
    const view = await renderShowDetail({
      showId: MEMBER_SHOW.id,
      role: 'member',
    });

    await view.findByText('Encontro de Dezembro');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Exportar setlist do show'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/shows/${MEMBER_SHOW.id}/export`,
      );
    });
  });

  it('abre a preparação de calendário para integrante e desabilita show cancelado', async () => {
    const memberView = await renderShowDetail({
      showId: MEMBER_SHOW.id,
      role: 'member',
    });

    await memberView.findByText('Encontro de Dezembro');
    await fireEvent.press(memberView.getByLabelText('Mais opções do show'));
    await fireEvent.press(
      memberView.getByLabelText('Adicionar cópia do show ao calendário'),
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/shows/${MEMBER_SHOW.id}/calendar`,
      );
    });

    const cancelledView = await renderShowDetail({
      showId: CANCELLED_SHOW.id,
      shows: [CANCELLED_SHOW],
    });
    await cancelledView.findByText('Show cancelado');
    await fireEvent.press(cancelledView.getByLabelText('Mais opções do show'));

    const cancelledAction = cancelledView.getByLabelText(
      'Indisponível: shows cancelados não podem ser adicionados como eventos ativos',
    );
    expect(cancelledAction.props.accessibilityState.disabled).toBe(true);
  });

  it.each([
    [
      'erro inesperado',
      new Error('offline'),
      'Não foi possível atualizar o status agora. Tente novamente.',
    ],
    [
      'erro de permissão',
      new ShowMutationError(
        'permission_denied',
        'Você não pode mudar esse status.',
      ),
      'Você não pode mudar esse status.',
    ],
  ])(
    'mostra feedback de %s ao atualizar o status',
    async (_kind, error, message) => {
      jest.mocked(updateShowStatus).mockRejectedValueOnce(error);

      const view = await renderShowDetail({ showId: FESTIVAL_SHOW_ID });

      await view.findByText('Festival da Praça');
      await fireEvent.press(view.getByLabelText('Mais opções do show'));
      await fireEvent.press(view.getByLabelText('Reabrir para edição'));
      await fireEvent.press(
        view.getByLabelText('Confirmar Reabrir para edição'),
      );

      await waitFor(() => expect(view.getByText(message)).toBeTruthy());
    },
  );

  it.each([
    [
      'erro inesperado',
      new Error('offline'),
      'Não foi possível excluir o show agora. Tente novamente.',
    ],
    [
      'erro de permissão',
      new ShowMutationError(
        'permission_denied',
        'Você não pode excluir o show.',
      ),
      'Você não pode excluir o show.',
    ],
  ])('mostra feedback de %s ao excluir show', async (_kind, error, message) => {
    jest.mocked(deleteShow).mockRejectedValueOnce(error);

    const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Excluir show'));
    await fireEvent.press(
      view.getByLabelText('Confirmar exclusão definitiva do show'),
    );

    await waitFor(() => expect(view.getByText(message)).toBeTruthy());
  });

  it.each([
    [
      'erro inesperado',
      new Error('offline'),
      'Não foi possível atualizar o show agora. Tente novamente.',
    ],
    [
      'erro de permissão',
      new ShowMutationError(
        'permission_denied',
        'Sem acesso para editar o show.',
      ),
      'Sem acesso para editar o show.',
    ],
  ])(
    'mostra feedback de %s ao editar os dados do show',
    async (_kind, error, message) => {
      jest.mocked(updateShow).mockRejectedValueOnce(error);

      const view = await renderShowDetail({ showId: CLUB_SHOW_ID });

      await view.findByText('Noite no Clube');
      await fireEvent.press(view.getByLabelText('Mais opções do show'));
      await fireEvent.press(view.getByLabelText('Editar show'));
      await fireEvent.changeText(
        view.getByLabelText('Nome do show'),
        'Nome novo',
      );
      await fireEvent.press(view.getByLabelText('Confirmar criação do show'));

      await waitFor(() => expect(view.getByText(message)).toBeTruthy());
    },
  );
});
