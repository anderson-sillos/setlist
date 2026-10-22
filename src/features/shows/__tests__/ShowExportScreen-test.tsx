import { useQueryClient } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';

import { ShowExportScreen } from '@/features/shows/ShowExportScreen';
import { queryKeys } from '@/data/queryKeys';
import type { Show } from '@/domain';
import { prepareDocumentFile } from '@/features/shows/export/documentDelivery';
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
  downloadDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
  prepareDocumentFile: jest.fn(),
  printShowDocument: jest.fn().mockResolvedValue(undefined),
  releaseDocumentFile: jest.fn(),
  shareDocumentFile: jest.fn().mockResolvedValue({ status: 'opened' }),
}));

jest.mock('@/features/shows/export/showExportPdf', () => ({
  createShowExportPdf: jest.fn(),
}));

jest.mock('@/features/shows/export/PngPageRenderer', () => ({
  PngPageRenderer: () => null,
}));

describe('<ShowExportScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedQueryClient = null;
    jest.mocked(prepareDocumentFile).mockResolvedValue({
      name: 'noite-de-teste-2026-10-24.pdf',
      mimeType: 'application/pdf',
      uri: 'file:///noite-de-teste.pdf',
      size: 2,
    });
  });

  it('apresenta a prévia, defaults sem observações e troca de formato', async () => {
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
        'Revise a prévia antes de gerar. Letras, áudio e vídeo não são incluídos.',
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

  it('permite percorrer todas as páginas da prévia antes de gerar', async () => {
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

    let pagePreview = view.getByLabelText(/^Prévia da página/);
    let [, currentPage, pageCount] =
      /^Prévia da página (\d+) de (\d+)$/.exec(
        pagePreview.props.accessibilityLabel as string,
      ) ?? [];
    expect(Number(pageCount)).toBeGreaterThan(1);

    while (Number(currentPage) < Number(pageCount)) {
      await fireEvent.press(
        view.getByRole('button', { name: 'Próxima página' }),
      );
      await waitFor(() => {
        pagePreview = view.getByLabelText(/^Prévia da página/);
        const match = /^Prévia da página (\d+) de (\d+)$/.exec(
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

  it('preserva a prévia após falha e permite repetir a geração', async () => {
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
    expect(await view.findByText(/PDF preparado/)).toBeTruthy();
    expect(createShowExportPdf).toHaveBeenCalledTimes(2);
    expect(
      view.getByText('Abrir seletor para salvar ou compartilhar'),
    ).toBeTruthy();
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

    await view.findByText('Atualizar prévia com os dados atuais');
    expect(view.getByText('Nome salvo inicialmente')).toBeTruthy();
    await fireEvent.press(
      view.getByText('Atualizar prévia com os dados atuais'),
    );
    expect(await view.findByText('Nome salvo atualizado')).toBeTruthy();
    expect(view.queryByText('Nome salvo inicialmente')).toBeNull();
  });
});
