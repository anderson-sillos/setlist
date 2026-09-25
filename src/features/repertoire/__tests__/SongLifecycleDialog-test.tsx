import { fireEvent, render } from '@testing-library/react-native';

import { demoRepositoryData } from '@/data/demo';
import { SongLifecycleDialog } from '@/features/repertoire/SongLifecycleDialog';

describe('<SongLifecycleDialog />', () => {
  const song = demoRepositoryData.songs[0];

  it('oferece arquivamento e exige confirmação para exclusão', async () => {
    const onArchive = jest.fn();
    const onRemove = jest.fn();
    const view = await render(
      <SongLifecycleDialog
        errorMessage={null}
        isSubmitting={false}
        onArchive={onArchive}
        onClose={jest.fn()}
        onRemove={onRemove}
        onRestore={jest.fn()}
        song={song}
        visible
      />,
    );

    await fireEvent.press(view.getByLabelText('Arquivar música'));
    expect(onArchive).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByLabelText('Excluir música'));
    expect(view.getByText(/Se a música estiver em algum show/i)).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da música'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('oferece restauração para uma música arquivada', async () => {
    const onRestore = jest.fn();
    const view = await render(
      <SongLifecycleDialog
        errorMessage={null}
        isSubmitting={false}
        onArchive={jest.fn()}
        onClose={jest.fn()}
        onRemove={jest.fn()}
        onRestore={onRestore}
        song={{ ...song, archivedAt: '2026-09-24T12:00:00.000Z' }}
        visible
      />,
    );

    await fireEvent.press(view.getByLabelText('Restaurar música'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
