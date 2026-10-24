import { useQueryClient } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ShowExportScreen } from '@/features/shows/ShowExportScreen';
import { queryKeys } from '@/data/queryKeys';
import type { Show } from '@/domain';
import {
  canShareDocumentFile,
  closePrintTarget,
  downloadDocumentFile,
  prepareDocumentFile,
  preparePrintTarget,
  printShowDocument,
  releaseDocumentFile,
  shareDocumentFile,
} from '@/features/shows/export/documentDelivery';
import { loadDocumentFontResources } from '@/features/shows/export/documentFonts';
import { createShowExportPdf } from '@/features/shows/export/showExportPdf';
import {
  createShow,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

let capturedQueryClient: ReturnType<typeof useQueryClient> | null = null;

function CaptureQueryClient() {
  const queryClient = useQueryClient();
  useEffect(() => {
    capturedQueryClient = queryClient;
  }, [queryClient]);
  return null;
}

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/features/shows/export/documentFonts', () => {
  const font = {
    unitsPerEm: 1000,
    layout: (value: string) => ({
      advanceWidth: Array.from(value).length * 500,
    }),
  };
  return {
    loadDocumentFontResources: jest.fn().mockResolvedValue({
      boldFont: font,
      regularFont: font,
    }),
    measureDocumentText: (
      value: string,
      size: number,
      _bold: boolean,
      selectedFont: typeof font,
    ) =>
      (selectedFont.layout(value).advanceWidth / selectedFont.unitsPerEm) *
      size,
  };
});

jest.mock('@/features/shows/export/documentDelivery', () => ({
  canShareDocumentFile: jest.fn().mockResolvedValue(true),
  cleanupExpiredDocumentFiles: jest.fn().mockResolvedValue(undefined),
  closePrintTarget: jest.fn(),
  downloadDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
  prepareDocumentFile: jest.fn(),
  preparePrintTarget: jest.fn().mockReturnValue(null),
  printShowDocument: jest.fn().mockResolvedValue(undefined),
  releaseDocumentFile: jest.fn(),
  shareDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
}));

jest.mock('@/features/shows/export/showExportPdf', () => ({
  createShowExportPdf: jest.fn(),
}));

jest.mock('@/features/shows/export/PngPageRenderer', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable: MockPressable, Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    PngPageRenderer: ({
      onRendered,
      requestId,
    }: {
      onRendered: (id: number, base64: string) => void;
      requestId: number;
    }) =>
      requestId > 0
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              MockPressable,
              {
                onPress: () =>
                  onRendered(requestId, 'data:image/png;base64,aGVsbG8='),
                testID: 'mock-png-renderer',
              },
              React.createElement(MockText, null, 'PNG pronto'),
            ),
            React.createElement(
              MockPressable,
              {
                onPress: () => onRendered(requestId, ''),
                testID: 'mock-png-empty',
              },
              React.createElement(MockText, null, 'PNG vazio'),
            ),
            React.createElement(
              MockPressable,
              {
                onPress: () =>
                  onRendered(requestId + 1, 'data:image/png;base64,aGVsbG8='),
                testID: 'mock-png-stale',
              },
              React.createElement(MockText, null, 'PNG obsoleto'),
            ),
          )
        : null,
  };
});

describe('<ShowExportScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedQueryClient = null;
    jest.mocked(canShareDocumentFile).mockResolvedValue(true);
    jest.mocked(shareDocumentFile).mockResolvedValue({ status: 'opened' });
    jest.mocked(downloadDocumentFile).mockResolvedValue({ status: 'opened' });
    jest.mocked(prepareDocumentFile).mockResolvedValue({
      name: 'noite-de-teste-2026-10-24.pdf',
      mimeType: 'application/pdf',
      uri: 'file:///noite-de-teste.pdf',
      size: 2,
    });
  });

  it('apresenta a pré-visualização, defaults sem observações e troca de destino', async () => {
    const bandId = 'band-show-export';
    const showId = 'show-export';
    const userId = 'user-show-export';
    const song = createSong({
      id: 'song-show-export',
      bandId,
      title: 'Canção de teste',
      originalArtist: 'Artista de teste',
      musicalKey: 'Ré',
      estimatedDurationMs: 180_000,
    });
    const show = createShow({
      id: showId,
      bandId,
      name: 'Noite de teste',
      startsAt: '2026-10-24T20:00:00-03:00',
      notes: 'Nota geral que começa desmarcada',
      blocks: [
        createShowSetlistBlock({
          name: 'Primeiro bloco',
          items: [createShowSongSetlistItem({ songId: song.id })],
        }),
      ],
    });
    const scenario = createBandScenario({
      bandId,
      userId,
      role: 'member',
      songs: [song],
      shows: [show],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    expect(
      await view.findByText(
        'Confira a pré-visualização antes de gerar. Letras, áudio e vídeo não são incluídos.',
      ),
    ).toBeTruthy();
    await waitFor(() =>
      expect(view.getByText('1. Canção de teste')).toBeTruthy(),
    );
    expect(view.getByLabelText('PDF').props.accessibilityState.checked).toBe(
      true,
    );
    expect(view.getByLabelText('BPM').props.accessibilityState.checked).toBe(
      false,
    );
    expect(
      view.getByLabelText('Observações gerais do show').props.accessibilityState
        .checked,
    ).toBe(false);
    expect(view.queryByText('Nota geral que começa desmarcada')).toBeNull();
    expect(view.queryByText('Letras sincronizadas')).toBeNull();

    await fireEvent.press(view.getByLabelText('Texto'));
    expect(view.getByLabelText('Texto').props.accessibilityState.checked).toBe(
      true,
    );
    expect(view.getByText('Gerar TXT')).toBeTruthy();
  });

  it('permite percorrer todas as páginas da pré-visualização antes de gerar', async () => {
    const bandId = 'band-long-export';
    const showId = 'show-long-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-long-export',
      role: 'member',
      shows: [
        createShow({
          id: showId,
          bandId,
          name: 'Show com várias páginas',
          notes: 'Texto longo para testar a paginação. '.repeat(900),
        }),
      ],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Observações gerais do show'));
    await waitFor(() =>
      expect(view.getByText(/\d+ páginas · A4/)).toBeTruthy(),
    );

    let pagePreview = view.getByLabelText(/^Pré-visualização da página/);
    let [, currentPage, pageCount] =
      /^Pré-visualização da página (\d+) de (\d+)$/.exec(
        pagePreview.props.accessibilityLabel as string,
      ) ?? [];
    expect(Number(pageCount)).toBeGreaterThan(1);

    while (Number(currentPage) < Number(pageCount)) {
      await fireEvent.press(
        view.getByRole('button', { name: 'Próxima página' }),
      );
      await waitFor(() => {
        pagePreview = view.getByLabelText(/^Pré-visualização da página/);
        const match = /^Pré-visualização da página (\d+) de (\d+)$/.exec(
          pagePreview.props.accessibilityLabel as string,
        );
        currentPage = match?.[1] ?? currentPage;
        pageCount = match?.[2] ?? pageCount;
        expect(Number(currentPage)).toBeGreaterThan(1);
      });
    }

    expect(Number(currentPage)).toBe(Number(pageCount));
    expect(
      view.getByRole('button', { name: 'Próxima página' }).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(
      view.getByRole('button', { name: 'Página anterior' }).props
        .accessibilityState.disabled,
    ).toBe(false);
  });

  it('preserva a pré-visualização após falha e permite repetir a geração', async () => {
    const bandId = 'band-retry-export';
    const showId = 'show-retry-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-retry-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show para repetir' })],
    });
    let rejectPdfGeneration: (error: Error) => void = () => undefined;
    jest
      .mocked(createShowExportPdf)
      .mockImplementationOnce(
        () =>
          new Promise<Uint8Array>((_resolve, reject) => {
            rejectPdfGeneration = reject;
          }),
      )
      .mockResolvedValueOnce(new Uint8Array([1, 2]));
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByText('Gerar PDF'));
    expect(await view.findByText('Gerando arquivo…')).toBeTruthy();
    rejectPdfGeneration(new Error('Falha temporária na geração'));
    expect(await view.findByText('Falha temporária na geração')).toBeTruthy();
    expect(view.getByText('Este show ainda não tem músicas.')).toBeTruthy();

    await fireEvent.press(view.getByText('Gerar PDF'));
    expect(await view.findByText(/O seletor .* foi aberto/)).toBeTruthy();
    expect(createShowExportPdf).toHaveBeenCalledTimes(2);
    expect(jest.mocked(shareDocumentFile)).toHaveBeenCalledTimes(1);
  });

  it('gera e compartilha o arquivo de texto no dispositivo', async () => {
    const bandId = 'band-text-export';
    const showId = 'show-text-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-text-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show em texto' })],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Texto'));
    await fireEvent.press(view.getByText('Gerar TXT'));

    expect(
      await view.findByText(/O seletor do sistema foi aberto/),
    ).toBeTruthy();
    expect(shareDocumentFile).toHaveBeenCalledTimes(1);
    expect(prepareDocumentFile).toHaveBeenCalledWith(
      expect.stringMatching(/show-em-texto-.*\.txt$/),
      'text/plain;charset=utf-8',
      expect.any(Uint8Array),
    );
    expect(view.getByText('Atualizar visualização')).toBeTruthy();

    await fireEvent.press(view.getByText('Gerar TXT'));
    await view.findByText(/O seletor do sistema foi aberto/);
    expect(jest.mocked(releaseDocumentFile)).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByText('Atualizar visualização'));
    expect(jest.mocked(releaseDocumentFile)).toHaveBeenCalledTimes(2);
  });

  it('gera uma imagem para a página selecionada após receber a renderização', async () => {
    const bandId = 'band-png-export';
    const showId = 'show-png-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-png-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show em imagem' })],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Imagem'));
    await fireEvent.press(view.getByText('Gerar imagem da página 1'));
    await fireEvent.press(await view.findByTestId('mock-png-stale'));
    await fireEvent.press(await view.findByTestId('mock-png-renderer'));

    expect(
      await view.findByText(/O seletor do sistema foi aberto/),
    ).toBeTruthy();
    expect(prepareDocumentFile).toHaveBeenCalledWith(
      expect.stringMatching(/show-em-imagem-.*-pagina-01\.png$/),
      'image/png',
      expect.any(Uint8Array),
    );
  });

  it('mostra um erro quando a renderização da imagem retorna conteúdo vazio', async () => {
    const bandId = 'band-empty-png-export';
    const showId = 'show-empty-png-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-empty-png-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show sem imagem' })],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Imagem'));
    await fireEvent.press(view.getByText('Gerar imagem da página 1'));
    await fireEvent.press(await view.findByTestId('mock-png-empty'));

    expect(await view.findByText('A imagem gerada ficou vazia.')).toBeTruthy();
    expect(prepareDocumentFile).not.toHaveBeenCalled();
  });

  it('abre a impressão no sistema e permite atualizar a pré-visualização', async () => {
    const bandId = 'band-print-export';
    const showId = 'show-print-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-print-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show para imprimir' })],
    });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Imprimir'));
    await fireEvent.press(view.getByText('Gerar e imprimir'));

    expect(
      await view.findByText('A janela de impressão foi aberta.'),
    ).toBeTruthy();
    expect(jest.mocked(printShowDocument)).toHaveBeenCalledTimes(1);
    expect(view.getByText('Atualizar visualização')).toBeTruthy();
  });

  it('usa download como alternativa quando o compartilhamento web não está disponível', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-export';
      const showId = 'show-web-export';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-export',
        role: 'member',
        shows: [createShow({ id: showId, bandId, name: 'Show web' })],
      });
      jest.mocked(canShareDocumentFile).mockResolvedValue(false);
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Texto'));
      await fireEvent.press(view.getByText('Gerar TXT'));

      expect(await view.findByText(/download foi iniciado/)).toBeTruthy();
      expect(downloadDocumentFile).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('registra o cancelamento do compartilhamento sem descartar o arquivo', async () => {
    const bandId = 'band-cancelled-export';
    const showId = 'show-cancelled-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-cancelled-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show cancelado' })],
    });
    jest.mocked(shareDocumentFile).mockResolvedValue({ status: 'cancelled' });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByText('Gerar PDF'));

    expect(await view.findByText(/Compartilhamento cancelado/)).toBeTruthy();
    expect(view.getByText('Atualizar visualização')).toBeTruthy();
  });

  it('informa quando o compartilhamento nativo não está disponível', async () => {
    const bandId = 'band-unsupported-export';
    const showId = 'show-unsupported-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-unsupported-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show sem destino' })],
    });
    jest.mocked(shareDocumentFile).mockResolvedValue({ status: 'unsupported' });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByText('Gerar PDF'));

    expect(
      await view.findByText(
        /O compartilhamento está indisponível neste dispositivo/,
      ),
    ).toBeTruthy();
    expect(view.getByText('Atualizar visualização')).toBeTruthy();
  });

  it('usa download se a API de compartilhamento web lançar erro', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-share-error';
      const showId = 'show-web-share-error';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-share-error',
        role: 'member',
        shows: [createShow({ id: showId, bandId, name: 'Show web offline' })],
      });
      jest
        .mocked(canShareDocumentFile)
        .mockRejectedValue(new Error('bloqueado'));
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Texto'));
      await fireEvent.press(view.getByText('Gerar TXT'));

      expect(
        await view.findByText(/não abriu o compartilhamento automaticamente/),
      ).toBeTruthy();
      expect(downloadDocumentFile).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('abre o compartilhamento web quando o navegador aceita o arquivo', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-share';
      const showId = 'show-web-share';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-share',
        role: 'member',
        shows: [
          createShow({ id: showId, bandId, name: 'Show compartilhável' }),
        ],
      });
      jest.mocked(canShareDocumentFile).mockResolvedValue(true);
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Texto'));
      await fireEvent.press(view.getByText('Gerar TXT'));

      expect(
        await view.findByText(/O seletor de compartilhamento foi aberto/),
      ).toBeTruthy();
      expect(shareDocumentFile).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('preserva o arquivo quando o compartilhamento web é cancelado', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-cancelled-share';
      const showId = 'show-web-cancelled-share';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-cancelled-share',
        role: 'member',
        shows: [
          createShow({
            id: showId,
            bandId,
            name: 'Show compartilhamento cancelado',
          }),
        ],
      });
      jest.mocked(canShareDocumentFile).mockResolvedValue(true);
      jest.mocked(shareDocumentFile).mockResolvedValue({ status: 'cancelled' });
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Texto'));
      await fireEvent.press(view.getByText('Gerar TXT'));

      expect(await view.findByText(/Compartilhamento cancelado/)).toBeTruthy();
      expect(downloadDocumentFile).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('mostra o erro quando o download web também falha', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-download-error';
      const showId = 'show-web-download-error';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-download-error',
        role: 'member',
        shows: [createShow({ id: showId, bandId, name: 'Show sem download' })],
      });
      jest.mocked(canShareDocumentFile).mockResolvedValue(false);
      jest
        .mocked(downloadDocumentFile)
        .mockResolvedValue({ status: 'unsupported' });
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Texto'));
      await fireEvent.press(view.getByText('Gerar TXT'));

      expect(
        await view.findByText(
          'O navegador não conseguiu iniciar o download do arquivo.',
        ),
      ).toBeTruthy();
      expect(closePrintTarget).toHaveBeenCalledWith(null);
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('imprime no navegador sem iniciar uma atualização de dados em segundo plano', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      const bandId = 'band-web-print';
      const showId = 'show-web-print';
      const scenario = createBandScenario({
        bandId,
        userId: 'user-web-print',
        role: 'member',
        shows: [
          createShow({ id: showId, bandId, name: 'Show para imprimir web' }),
        ],
      });
      const view = await render(
        <TestAppProviders
          currentUserId={scenario.currentUserId}
          repositories={scenario.repositories}
        >
          <ShowExportScreen bandId={bandId} showId={showId} />
        </TestAppProviders>,
      );

      await view.findByText('1 página · A4');
      await fireEvent.press(view.getByLabelText('Imprimir'));
      await fireEvent.press(view.getByText('Gerar e imprimir'));

      expect(
        await view.findByText('A janela de impressão foi aberta.'),
      ).toBeTruthy();
      expect(jest.mocked(printShowDocument)).toHaveBeenCalledTimes(1);
      expect(
        view.queryByText(/Atualizando os dados do show e da banda/),
      ).toBeNull();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
    }
  });

  it('mostra mensagens claras se a janela de impressão não puder ser aberta', async () => {
    const bandId = 'band-print-popup-error';
    const showId = 'show-print-popup-error';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-print-popup-error',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show pop-up' })],
    });
    jest
      .mocked(preparePrintTarget)
      .mockImplementationOnce(() => {
        throw new Error('Pop-up bloqueado');
      })
      .mockImplementationOnce(() => {
        throw 'não abriu';
      });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByLabelText('Imprimir'));
    await fireEvent.press(view.getByText('Gerar e imprimir'));
    expect(await view.findByText('Pop-up bloqueado')).toBeTruthy();

    await fireEvent.press(view.getByText('Gerar e imprimir'));
    expect(
      await view.findByText('Não foi possível preparar a janela de impressão.'),
    ).toBeTruthy();
  });

  it('mostra uma mensagem genérica para falhas sem objeto Error', async () => {
    const bandId = 'band-unknown-export-error';
    const showId = 'show-unknown-export-error';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-unknown-export-error',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show com falha' })],
    });
    jest.mocked(createShowExportPdf).mockRejectedValueOnce('falha');
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('1 página · A4');
    await fireEvent.press(view.getByText('Gerar PDF'));

    expect(await view.findByText('Falha ao gerar o arquivo.')).toBeTruthy();
  });

  it('mostra o motivo quando as fontes não podem ser carregadas', async () => {
    const bandId = 'band-font-error-export';
    const showId = 'show-font-error-export';
    const scenario = createBandScenario({
      bandId,
      userId: 'user-font-error-export',
      role: 'member',
      shows: [createShow({ id: showId, bandId, name: 'Show sem fonte' })],
    });
    jest
      .mocked(loadDocumentFontResources)
      .mockRejectedValueOnce(new Error('Fonte indisponível'));
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    expect(await view.findByText('Fonte indisponível')).toBeTruthy();
  });

  it('mantém a cópia revisada estável até a atualização explícita', async () => {
    const bandId = 'band-refresh-export';
    const showId = 'show-refresh-export';
    const initialShow = createShow({
      id: showId,
      bandId,
      name: 'Nome salvo inicialmente',
    });
    const updatedShow: Show = { ...initialShow, name: 'Nome salvo atualizado' };
    const scenario = createBandScenario({
      bandId,
      userId: 'user-refresh-export',
      role: 'member',
      shows: [initialShow],
    });
    let repositoryReads = 0;
    jest
      .spyOn(scenario.repositories.shows, 'findById')
      .mockImplementation(async (_requestedBandId, requestedShowId) => {
        if (requestedShowId !== showId) return null;
        repositoryReads += 1;
        return repositoryReads === 1 ? initialShow : updatedShow;
      });
    const view = await render(
      <TestAppProviders
        currentUserId={scenario.currentUserId}
        repositories={scenario.repositories}
      >
        <CaptureQueryClient />
        <ShowExportScreen bandId={bandId} showId={showId} />
      </TestAppProviders>,
    );

    await view.findByText('Nome salvo inicialmente');
    expect(capturedQueryClient).not.toBeNull();
    await capturedQueryClient?.invalidateQueries({
      queryKey: queryKeys.shows.byId(bandId, showId),
    });

    await view.findByText('Atualizar visualização');
    expect(view.getByText('Nome salvo inicialmente')).toBeTruthy();
    await fireEvent.press(view.getByText('Atualizar visualização'));
    expect(await view.findByText('Nome salvo atualizado')).toBeTruthy();
    expect(view.queryByText('Nome salvo inicialmente')).toBeNull();
  });
});
