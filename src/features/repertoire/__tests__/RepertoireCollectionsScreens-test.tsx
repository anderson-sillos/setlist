import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { demoIds } from '@/data/demo';
import { RepertoireCollectionDetailScreen } from '@/features/repertoire/RepertoireCollectionDetailScreen';
import { RepertoireCollectionsScreen } from '@/features/repertoire/RepertoireCollectionsScreen';
import { AppProviders } from '@/providers/AppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => mockRouter,
}));

describe('telas de consulta de coleções do repertório', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite a integrantes consultar a lista sem controles de edição', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    expect(await view.findByText('Acústico')).toBeTruthy();
    expect(view.getByLabelText('Abrir coleção Acústico')).toBeTruthy();
    expect(view.queryByLabelText('Criar coleção de músicas')).toBeNull();
    expect(view.queryByText('Criar coleção')).toBeNull();
  });

  it('oferece criação de coleção a proprietário e editor', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireCollectionsScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByText('Acústico');
    await fireEvent.press(view.getByLabelText('Criar coleção de músicas'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/new`,
    );
  });

  it('mantém leitura do detalhe para integrante e reserva edição a quem pode escrever', async () => {
    const memberView = await render(
      <AppProviders currentUserId="user-demo-carla">
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    expect(await memberView.findByText('Festa')).toBeTruthy();
    expect(memberView.getByText('Luzes da Cidade')).toBeTruthy();
    expect(memberView.queryByLabelText('Editar coleção')).toBeNull();
    await memberView.unmount();

    const ownerView = await render(
      <AppProviders>
        <RepertoireCollectionDetailScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    await ownerView.findByText('Festa');
    await fireEvent.press(ownerView.getByLabelText('Editar coleção'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa/edit`,
    );
  });
});
