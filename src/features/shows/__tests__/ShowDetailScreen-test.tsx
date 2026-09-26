import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ShowMutationError, deleteShow, duplicateShow } from '@/data/supabase';
import {
  updateShow,
  updateShowStatus,
} from '@/data/supabase/showUpdateMutations';
import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { ShowDetailScreen } from '@/features/shows/ShowDetailScreen';
import { AppProviders } from '@/providers/AppProviders';
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
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe('<ShowDetailScreen />', () => {
  it('mostra dados, blocos, ordem e observações do show', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
          viewportWidth={1440}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Festival da Praça')).toBeTruthy();
    expect(view.getByTestId('show-detail-desktop')).toBeTruthy();
    expect(view.getByText('Abertura')).toBeTruthy();
    expect(view.getByText('Segundo Set')).toBeTruthy();
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
    expect(view.getByLabelText('Abrir modo palco')).toBeTruthy();
  });

  it('abre a edição da setlist em uma tela própria para shows editáveis', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    expect(await view.findByText('Noite no Clube')).toBeTruthy();
    expect(view.getByTestId('show-setlist-header')).toBeTruthy();
    expect(view.getByText('Editar setlist')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Editar setlist'));

    expect(mockPush).toHaveBeenCalledWith(
      '/bands/band-demo-horizonte/shows/show-demo-clube/edit',
    );
  });

  it('concentra as ações do show no popup de mais opções', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));

    expect(view.getByTestId('show-detail-actions-sheet')).toBeTruthy();
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
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
        />
      </AppProviders>,
    );

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Reabrir para edição'));

    expect(view.getByText('Status do show')).toBeTruthy();
    expect(view.getByLabelText('Confirmar Reabrir para edição')).toBeTruthy();
  });

  it('lista pendências de letras sem bloquear a confirmação de show pronto', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Marcar como Pronto'));

    expect(view.getByText('Verificação das letras')).toBeTruthy();
    expect(view.getAllByText('Luzes da Cidade')).toHaveLength(2);
    expect(view.getByText('Letra estática')).toBeTruthy();
    expect(view.getByLabelText('Confirmar Marcar como Pronto')).toBeTruthy();
  });

  it('mostra um estado quando o show não é encontrado', async () => {
    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const view = await render(
      <AppProviders repositories={emptyRepositories}>
        <ShowDetailScreen bandId={demoIds.primaryBand} showId="unknown" />
      </AppProviders>,
    );

    expect(await view.findByText('Show indisponível')).toBeTruthy();
  });

  beforeEach(() => jest.clearAllMocks());

  it('salva atualizações dos dados do show', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

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
          bandId: demoIds.primaryBand,
          showId: 'show-demo-clube',
          name: 'Noite atualizada',
        }),
      );
    });
  });

  it('duplica o show e navega para o novo registro', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

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
          bandId: demoIds.primaryBand,
          name: 'Noite duplicada',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith(
        '/bands/band-demo-horizonte/shows/show-duplicated',
      );
    });
  });

  it('confirma uma transição de status e atualiza os dados do show', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
        />
      </AppProviders>,
    );

    await view.findByText('Festival da Praça');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Reabrir para edição'));
    await fireEvent.press(view.getByLabelText('Confirmar Reabrir para edição'));

    await waitFor(() => {
      expect(updateShowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          bandId: demoIds.primaryBand,
          currentStatus: 'ready',
          showId: demoIds.readyShow,
          status: 'draft',
        }),
      );
    });
  });

  it('exclui definitivamente o show e retorna à lista', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByText('Noite no Clube');
    await fireEvent.press(view.getByLabelText('Mais opções do show'));
    await fireEvent.press(view.getByLabelText('Excluir show'));
    await fireEvent.press(
      view.getByLabelText('Confirmar exclusão definitiva do show'),
    );

    await waitFor(() => {
      expect(deleteShow).toHaveBeenCalledWith({
        bandId: demoIds.primaryBand,
        showId: 'show-demo-clube',
      });
      expect(mockReplace).toHaveBeenCalledWith(
        '/bands/band-demo-horizonte/shows',
      );
    });
  });

  it('oculta ações para integrante sem permissão de edição', async () => {
    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.secondaryBand}
          showId="show-demo-aurora-dezembro"
        />
      </AppProviders>,
    );

    await view.findByText('Encontro de Dezembro');
    expect(view.queryByLabelText('Mais opções do show')).toBeNull();
    expect(view.queryByLabelText('Editar setlist')).toBeNull();
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

      const view = await render(
        <AppProviders>
          <ShowDetailScreen
            bandId={demoIds.primaryBand}
            showId={demoIds.readyShow}
          />
        </AppProviders>,
      );

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

    const view = await render(
      <AppProviders>
        <ShowDetailScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

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

      const view = await render(
        <AppProviders>
          <ShowDetailScreen
            bandId={demoIds.primaryBand}
            showId="show-demo-clube"
          />
        </AppProviders>,
      );

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
