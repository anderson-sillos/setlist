import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { sendContentReport } from '@/data/supabase/contentReports';
import { ContentReportDialog } from '@/features/moderation/ContentReportDialog';

jest.mock('@/data/supabase/contentReports', () => ({
  sendContentReport: jest.fn(),
}));

const mockSendContentReport = jest.mocked(sendContentReport);

beforeEach(() => {
  mockSendContentReport.mockReset();
});

it('envia denúncia da música e mostra confirmação após aceite', async () => {
  mockSendContentReport.mockResolvedValue();
  const view = await render(
    <ContentReportDialog
      bandId="band-1"
      kind="song"
      onClose={jest.fn()}
      targetId="song-1"
      targetName="Música de teste"
      visible
    />,
  );

  fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Conteúdo indevido na letra',
  );
  fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));

  await waitFor(() => {
    expect(mockSendContentReport).toHaveBeenCalledWith({
      bandId: 'band-1',
      description: 'Conteúdo indevido na letra',
      kind: 'song',
      targetId: 'song-1',
    });
    expect(
      view.getByText('Denúncia encaminhada para análise. Obrigado por avisar.'),
    ).toBeTruthy();
  });
});

it('mantém a descrição e permite repetir quando a entrega falha', async () => {
  mockSendContentReport
    .mockRejectedValueOnce(new Error('Não foi possível confirmar o envio.'))
    .mockResolvedValueOnce();
  const view = await render(
    <ContentReportDialog
      bandId="band-1"
      kind="user"
      onClose={jest.fn()}
      targetId="user-2"
      targetName="Integrante de teste"
      visible
    />,
  );

  fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Descrição detalhada do caso',
  );
  fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));
  expect(
    await view.findByText('Não foi possível confirmar o envio.'),
  ).toBeTruthy();
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Descrição detalhada do caso',
  );

  fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));
  await waitFor(() => {
    expect(mockSendContentReport).toHaveBeenCalledTimes(2);
    expect(
      view.getByText('Denúncia encaminhada para análise. Obrigado por avisar.'),
    ).toBeTruthy();
  });
});
