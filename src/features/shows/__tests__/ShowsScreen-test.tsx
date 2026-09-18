import { fireEvent, render } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import { ShowsScreen } from '@/features/shows/ShowsScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
}));

describe('<ShowsScreen />', () => {
  it.each([{ width: 390 }, { width: 820 }, { width: 1440 }])(
    'mantém a lista compacta e rolável em $width px',
    async ({ width }) => {
      const view = await render(
        <AppProviders>
          <ShowsScreen bandId={demoIds.primaryBand} viewportWidth={width} />
        </AppProviders>,
      );

      expect(await view.findByText('Festival da Praça')).toBeTruthy();
      expect(view.getByTestId('shows-list')).toBeTruthy();
      expect(view.getByLabelText('Buscar show por nome ou local')).toBeTruthy();
    },
  );

  it('busca shows e mantém cancelados fora da agenda ativa', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Ensaio Aberto');
    expect(view.getByText('Filtros: 2')).toBeTruthy();
    expect(view.queryByText('Encontro de Inverno')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      'praça',
    );

    expect(view.getByText('Festival da Praça')).toBeTruthy();
    expect(view.queryByText('Ensaio Aberto')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    await fireEvent.press(view.getAllByLabelText('Todos')[0]);
    await fireEvent.press(view.getByLabelText('Cancelado'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    expect(await view.findByText('Encontro de Inverno')).toBeTruthy();
  });

  it('conta filtros ativos e restaura o padrão pelo botão Limpar', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Ensaio Aberto');
    expect(view.getByText('Filtros: 2')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });

    await fireEvent.press(view.getAllByLabelText('Todos')[0]);
    await fireEvent.press(view.getAllByLabelText('Todos')[1]);
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    expect(view.getByText('Filtros: 0')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    await fireEvent.press(view.getByLabelText('Limpar filtros'));

    expect(view.queryByLabelText('Aplicar filtros')).toBeNull();
    expect(view.getByText('Filtros: 2')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
  });

  it('usa o calendário como filtro direto da lista geral de shows', async () => {
    const view = await render(
      <AppProviders>
        <ShowsScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportWidth={390}
        />
      </AppProviders>,
    );

    await view.findByText('Ensaio Aberto');
    expect(view.getByText('Filtros: 2')).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      'praça',
    );
    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );

    expect(view.getByTestId('shows-month-calendar')).toBeTruthy();
    expect(view.getByLabelText('Abrir filtros dos shows')).toBeTruthy();
    expect(view.getByLabelText('Alterar ordenação dos shows')).toBeTruthy();
    expect(view.getByLabelText(/19 de setembro de 2026, 2 shows/)).toBeTruthy();
    expect(view.queryByText('Independência do Brasil')).toBeNull();

    await fireEvent.press(view.getByLabelText('Fechar calendário'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar show por nome ou local'),
      '',
    );
    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );

    await fireEvent.press(
      view.getByLabelText(/7 de setembro de 2026, Independência do Brasil/),
    );
    expect(view.getByText('Independência do Brasil')).toBeTruthy();
    expect(view.queryByTestId('shows-month-calendar')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Abrir calendário para filtrar por data'),
    );
    await fireEvent.press(
      view.getByLabelText(/19 de setembro de 2026, 2 shows/),
    );

    expect(view.getByText('Filtros: 1')).toBeTruthy();
    expect(view.getByText('Ensaio Aberto')).toBeTruthy();
    expect(view.getByText('Show do Bairro')).toBeTruthy();
    expect(view.queryByText('Festival da Praça')).toBeNull();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getAllByLabelText('Todos')[0].props.accessibilityState).toEqual(
      { checked: true },
    );
    expect(view.getAllByLabelText('Todos')[1].props.accessibilityState).toEqual(
      { checked: true },
    );
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await fireEvent.press(view.getByLabelText('Criar novo show'));
    expect(view.getByText(/A criação do show em 19 set 2026/)).toBeTruthy();

    await fireEvent.press(view.getByLabelText(/Remover filtro de data/));
    expect(view.getByText('Filtros: 2')).toBeTruthy();
    expect(view.getByText('Festival da Praça')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros dos shows'));
    expect(view.getByLabelText('Próximos').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Ativo').props.accessibilityState).toEqual({
      checked: true,
    });
  });

  it('oculta a criação de show para integrante sem permissão de edição', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <ShowsScreen bandId={demoIds.primaryBand} viewportWidth={390} />
      </AppProviders>,
    );

    await view.findByText('Festival da Praça');
    expect(view.queryByLabelText('Criar novo show')).toBeNull();
    view.unmount();
  });
});
