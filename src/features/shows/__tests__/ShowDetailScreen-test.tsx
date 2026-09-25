import { fireEvent, render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { ShowDetailScreen } from '@/features/shows/ShowDetailScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
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

    await fireEvent.press(view.getByLabelText('Editar setlist'));

    expect(mockPush).toHaveBeenCalledWith(
      '/bands/band-demo-horizonte/shows/show-demo-clube/edit',
    );
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
    await fireEvent.press(view.getByLabelText('Alterar status do show'));

    expect(view.getByText('Status do show')).toBeTruthy();
    expect(view.getByLabelText('Reabrir para edição')).toBeTruthy();
    expect(view.getByLabelText('Cancelar show')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Reabrir para edição'));

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
    await fireEvent.press(view.getByLabelText('Alterar status do show'));
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
});
