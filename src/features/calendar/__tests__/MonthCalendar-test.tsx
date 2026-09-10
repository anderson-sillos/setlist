import { fireEvent, render } from '@testing-library/react-native';

import { AppText } from '@/components/ui/AppText';
import { demoRepositoryData } from '@/data/demo';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';

describe('calendário mensal de shows', () => {
  it('começa no domingo, destaca Carnaval e permite trocar de mês', async () => {
    const view = await render(
      <MonthCalendar
        initialDate={new Date('2026-02-10T12:00:00-03:00')}
        renderShow={(show) => <AppText>{show.name}</AppText>}
        shows={[]}
      />,
    );

    expect(view.getAllByText('Dom')).toHaveLength(1);
    expect(view.getByText('17 · Carnaval (terça-feira)')).toBeTruthy();

    await fireEvent.press(
      view.getByLabelText(/17 de fevereiro de 2026, Carnaval/),
    );
    expect(view.getByText('Feriado · Carnaval (terça-feira)')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Próximo mês'));
    expect(view.getByText('março de 2026')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Mês anterior'));
    expect(view.getByText('fevereiro de 2026')).toBeTruthy();
  });

  it('destaca Corpus Christi no calendário do produto', async () => {
    const view = await render(
      <MonthCalendar
        initialDate={new Date('2026-06-01T12:00:00-03:00')}
        renderShow={(show) => <AppText>{show.name}</AppText>}
        shows={[]}
      />,
    );

    expect(view.getByText('4 · Corpus Christi')).toBeTruthy();

    await fireEvent.press(
      view.getByLabelText(/4 de junho de 2026, Corpus Christi/),
    );
    expect(view.getByText('Feriado · Corpus Christi')).toBeTruthy();
  });

  it('marca a quantidade de shows e apresenta a agenda do dia', async () => {
    const shows = demoRepositoryData.shows.filter((show) =>
      show.startsAt.startsWith('2026-09-19'),
    );
    const view = await render(
      <MonthCalendar
        initialDate={new Date('2026-09-09T12:00:00-03:00')}
        renderShow={(show) => <AppText>{show.name}</AppText>}
        shows={shows}
      />,
    );

    await fireEvent.press(
      view.getByLabelText(/19 de setembro de 2026, 2 shows/),
    );

    expect(view.getByText('Ensaio Aberto')).toBeTruthy();
    expect(view.getByText('Show do Bairro')).toBeTruthy();
  });
});
