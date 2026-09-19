import { fireEvent, render } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import { BandScreen } from '@/features/bands/BandScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('<BandScreen />', () => {
  it('agrupa integrantes e mostra controles apenas para o proprietário', async () => {
    const ownerView = await render(
      <AppProviders>
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await ownerView.findByText('Proprietários · 1')).toBeTruthy();
    expect(ownerView.getByText('Editores · 1')).toBeTruthy();
    expect(ownerView.getByText('Integrantes · 1')).toBeTruthy();
    expect(ownerView.getByText('Você')).toBeTruthy();
    expect(ownerView.getByLabelText('Convidar integrante')).toBeTruthy();
    expect(ownerView.getByLabelText('Administrar Bruno Lima')).toBeTruthy();

    await fireEvent.press(ownerView.getByLabelText('Convidar integrante'));
    expect(ownerView.getByTestId('demo-action-notice')).toBeTruthy();
    expect(ownerView.getByText(/Os convites entram/)).toBeTruthy();
    await fireEvent.press(
      ownerView.getByLabelText('Fechar aviso de demonstração'),
    );
    expect(ownerView.queryByTestId('demo-action-notice')).toBeNull();

    await fireEvent.press(ownerView.getByLabelText('Administrar Bruno Lima'));
    expect(ownerView.getByTestId('demo-action-notice')).toBeTruthy();
    expect(ownerView.getByText(/A administração de integrantes/)).toBeTruthy();
    await ownerView.unmount();

    const memberView = await render(
      <AppProviders currentUserId="user-demo-carla">
        <BandScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await memberView.findByText('Você')).toBeTruthy();
    expect(memberView.queryByLabelText('Convidar integrante')).toBeNull();
    expect(memberView.queryByLabelText('Administrar Bruno Lima')).toBeNull();
  });
});
