import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { sendContentReport } from '@/data/supabase/contentReports';
import { ContentReportDialog } from '@/features/moderation/ContentReportDialog';

jest.mock('@/data/supabase/contentReports', () => ({
  sendContentReport: jest.fn(),
}));

const mockSendContentReport = jest.mocked(sendContentReport);

beforeEach(() => {
  mockSendContentReport.mockReset();
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
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

  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Conteúdo indevido na letra',
  );
  jest.mocked(Keyboard.isVisible).mockReturnValue(true);
  await fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));

  await waitFor(() => {
    expect(mockSendContentReport).toHaveBeenCalledWith({
      bandId: 'band-1',
      description: 'Conteúdo indevido na letra',
      kind: 'song',
      targetId: 'song-1',
    });
    expect(mockSendContentReport).toHaveBeenCalledTimes(1);
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    expect(
      view.getByText('Denúncia encaminhada para análise. Obrigado por avisar.'),
    ).toBeTruthy();
  });
});

it('dispensa o teclado ao tocar no título e preserva a descrição', async () => {
  const onClose = jest.fn();
  const view = await render(
    <ContentReportDialog
      bandId="band-1"
      kind="song"
      onClose={onClose}
      targetId="song-1"
      targetName="Música de teste"
      visible
    />,
  );
  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Descrição que ainda está em edição',
  );

  await fireEvent.press(view.getByText('Denunciar música'));

  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Descrição que ainda está em edição',
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(mockSendContentReport).not.toHaveBeenCalled();
});

it('não dispensa o teclado quando o toque acontece no próprio campo', async () => {
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

  await fireEvent.press(view.getByLabelText('Motivo da denúncia'));
  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Texto em edição',
  );

  expect(Keyboard.dismiss).not.toHaveBeenCalled();
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Texto em edição',
  );
});

it('dispensa o teclado ao tocar nas instruções sem perder a descrição', async () => {
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
  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Texto que deve continuar no campo',
  );

  await fireEvent.press(view.getByText(/Descreva o motivo da denúncia/));

  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Texto que deve continuar no campo',
  );
});

it('o primeiro toque no fundo dispensa o teclado e o próximo pede confirmação de descarte', async () => {
  const onClose = jest.fn();
  const view = await render(
    <ContentReportDialog
      bandId="band-1"
      kind="user"
      onClose={onClose}
      targetId="user-2"
      targetName="Integrante de teste"
      visible
    />,
  );
  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Descrição que deve ser preservada',
  );
  jest.mocked(Keyboard.isVisible).mockReturnValueOnce(true);

  await fireEvent.press(
    view.getByLabelText('Fechar janela de denúncia tocando fora'),
  );

  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Descrição que deve ser preservada',
  );

  await fireEvent.press(
    view.getByLabelText('Fechar janela de denúncia tocando fora'),
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(view.getByTestId('unsaved-changes-prompt')).toBeTruthy();
});

it('cancelar fecha a janela no primeiro toque com o teclado aberto', async () => {
  const onClose = jest.fn();
  const view = await render(
    <ContentReportDialog
      bandId="band-1"
      kind="song"
      onClose={onClose}
      targetId="song-1"
      targetName="Música de teste"
      visible
    />,
  );
  jest.mocked(Keyboard.isVisible).mockReturnValue(true);

  await fireEvent.press(view.getByRole('button', { name: 'Cancelar' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(mockSendContentReport).not.toHaveBeenCalled();
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

  await fireEvent.changeText(
    view.getByLabelText('Motivo da denúncia'),
    'Descrição detalhada do caso',
  );
  await fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));
  expect(
    await view.findByText('Não foi possível confirmar o envio.'),
  ).toBeTruthy();
  expect(view.getByLabelText('Motivo da denúncia').props.value).toBe(
    'Descrição detalhada do caso',
  );

  await fireEvent.press(view.getByRole('button', { name: 'Enviar denúncia' }));
  await waitFor(() => {
    expect(mockSendContentReport).toHaveBeenCalledTimes(2);
    expect(
      view.getByText('Denúncia encaminhada para análise. Obrigado por avisar.'),
    ).toBeTruthy();
  });
});
