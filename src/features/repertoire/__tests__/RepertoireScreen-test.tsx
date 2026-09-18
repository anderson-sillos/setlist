import { fireEvent, render } from '@testing-library/react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
}));

describe('<RepertoireScreen />', () => {
  it('apresenta o repertório e os metadados em modo somente leitura', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={820} />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByTestId('repertoire-list')).toBeTruthy();
    expect(view.getAllByText('Letra estática').length).toBeGreaterThan(0);
    expect(
      view.getAllByText('Sincronização incompleta').length,
    ).toBeGreaterThan(0);
    expect(view.getByText('3min38s')).toBeTruthy();
    expect(view.queryByText('Duração')).toBeNull();
    expect(view.queryByText(/Tom G · BPM/)).toBeNull();
  });

  it('busca, filtra e ordena o repertório sem tirar os controles da tela', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} viewportWidth={390} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );

    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByText('Arquivadas'));

    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByText('Maior duração'));

    expect(view.getByLabelText('Alterar ordenação do repertório')).toBeTruthy();
  });

  it('apresenta estados vazios e permite limpar uma busca sem resultado', async () => {
    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const emptyView = await render(
      <AppProviders repositories={emptyRepositories}>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Repertório vazio')).toBeTruthy();
    await emptyView.unmount();

    const searchView = await render(
      <AppProviders>
        <RepertoireScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await searchView.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      searchView.getByLabelText('Buscar música por título ou artista'),
      'música que não existe',
    );
    expect(searchView.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(searchView.getByText('Limpar filtros'));
    expect(await searchView.findByText('Luzes da Cidade')).toBeTruthy();
  });
});
