import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { createInMemoryRepositories } from '@/data/in-memory';
import { BandCreationError, createBand } from '@/data/supabase/bandMutations';
import { BandsScreen } from '@/features/bands/BandsScreen';
import { CURRENT_BAND_TERM } from '@/features/bands/legalTerm';
import {
  clearLastBandId,
  readLastBandId,
  writeLastBandId,
} from '@/features/bands/lastBandStorage';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
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

  it('carrega Minhas bandas com os destinos demonstrativos', async () => {
    await writeLastBandId('band-demo-horizonte');
    const view = await render(
      <AppProviders>
        <BandsScreen
          now={new Date('2026-09-09T12:00:00-03:00')}
          viewportHeight={900}
          viewportWidth={1440}
        />
      </AppProviders>,
    );

    expect(await view.findByText('Banda Horizonte')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
    expect(view.getByLabelText('Abrir Banda Horizonte')).toBeTruthy();
    expect(view.getByTestId('bands-list')).toBeTruthy();
    expect(view.getByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Proprietário')).toBeTruthy();
    expect(view.getByText('Integrante')).toBeTruthy();
    expect(
      view.getByLabelText('Ir para Minhas bandas').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getAllByText(/Próximo show/)).toHaveLength(2);
    expect(
      view.getByText('Próximo show · sáb, 19 de set. de 2026 · 16h'),
    ).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Criar banda'));
    expect(view.getByTestId('create-band-dialog')).toBeTruthy();
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
    expect(await view.findByText('Banda criada')).toBeTruthy();
  });

  it('bloqueia a criação quando o termo não foi aceito', async () => {
    const view = await render(
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
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
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
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
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
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
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await fireEvent.press(view.getByLabelText('Abrir Trio Aurora'));

    expect(await view.findByText('Última acessada')).toBeTruthy();
    expect(view.getByText('Trio Aurora')).toBeTruthy();
  });

  it('mostra o estado neutro quando a pessoa ainda não participa de uma banda', async () => {
    const view = await render(
      <AppProviders
        repositories={createInMemoryRepositories({
          bandMembers: [],
          bands: [],
          shows: [],
          songs: [],
        })}
      >
        <BandsScreen />
      </AppProviders>,
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
      <AppProviders>
        <BandsScreen />
      </AppProviders>,
    );

    await view.findByText('Banda Horizonte');
    await waitFor(async () => {
      expect(await readLastBandId()).toBeNull();
    });
    expect(view.queryByText('Última acessada')).toBeNull();
  });
});
