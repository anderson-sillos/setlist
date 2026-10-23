import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import {
  refetchScreenQueries,
  uniqueRefreshQueries,
} from '@/data/screenQueryRegistry';
import { useBandContext, useShow, useSongSummaries } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getShowHref } from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { colors, radii, spacing } from '@/theme/tokens';
import { getZonedDateTimeFields } from './export/showCalendarModel';
import {
  canShareDocumentFile,
  cleanupExpiredDocumentFiles,
  closePrintTarget,
  downloadDocumentFile,
  prepareDocumentFile,
  preparePrintTarget,
  releaseDocumentFile,
  shareDocumentFile,
  printShowDocument,
} from './export/documentDelivery';
import type { PreparedDocumentFile } from './export/documentFileTypes';
import {
  decodeBase64,
  encodeUtf8,
  createShowExportFilename,
} from './export/documentFileTypes';
import {
  loadDocumentFontResources,
  measureDocumentText,
} from './export/documentFonts';
import {
  buildShowExportPages,
  getPageLineColor,
  isPageLineBold,
  PAGE_PNG_HEIGHT,
  PAGE_PNG_WIDTH,
  type ShowExportPage,
} from './export/showExportLayout';
import { PngPageRenderer } from './export/PngPageRenderer';
import { createShowExportPdf } from './export/showExportPdf';
import { createShowExportText } from './export/showExportText';
import {
  DEFAULT_SHOW_EXPORT_OPTIONS,
  prepareShowExportDocument,
  type ShowExportOptions,
} from './export/showExportModel';

interface ShowExportScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
}

type ExportFormat = 'pdf' | 'txt' | 'png';
type ExportDestination = ExportFormat | 'print';

interface ExportSnapshot {
  readonly document: ReturnType<typeof prepareShowExportDocument>;
  readonly sourceUpdatedAt: number;
}

const destinationOptions: readonly {
  readonly icon: AppIconName;
  readonly label: string;
  readonly value: ExportDestination;
}[] = [
  { icon: 'filePdf', label: 'PDF', value: 'pdf' },
  { icon: 'fileText', label: 'Texto', value: 'txt' },
  { icon: 'image', label: 'Imagem', value: 'png' },
  { icon: 'print', label: 'Imprimir', value: 'print' },
] as const;

const exportFields: readonly {
  readonly key: keyof ShowExportOptions;
  readonly label: string;
}[] = [
  { key: 'includeArtist', label: 'Artista' },
  { key: 'includeKey', label: 'Tom' },
  { key: 'includeBpm', label: 'BPM' },
  { key: 'includeDurations', label: 'Durações e totais' },
  { key: 'includePlanning', label: 'Anotações de planejamento' },
  { key: 'includeShowNotes', label: 'Observações gerais do show' },
  { key: 'includeOccurrenceNotes', label: 'Observações por música' },
];

export function ShowExportScreen({ bandId, showId }: ShowExportScreenProps) {
  const queryClient = useQueryClient();
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongSummaries(bandId, true);
  const bandQuery = useBandContext(bandId);
  useScreenDataRefresh([showQuery, songsQuery, bandQuery]);
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const sourceUpdatedAt = Math.max(
    showQuery.dataUpdatedAt,
    songsQuery.dataUpdatedAt,
    bandQuery.dataUpdatedAt,
  );
  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [options, setOptions] = useState<ShowExportOptions>(
    DEFAULT_SHOW_EXPORT_OPTIONS,
  );
  const [destination, setDestination] = useState<ExportDestination>('pdf');
  const [layout, setLayout] = useState<{
    readonly snapshot: ExportSnapshot;
    readonly options: ShowExportOptions;
    readonly pages: readonly ShowExportPage[];
    readonly error: string | null;
  } | null>(null);
  const [updatingPreview, setUpdatingPreview] = useState(false);
  const [previewRefreshAvailable, setPreviewRefreshAvailable] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [renderRequestId, setRenderRequestId] = useState(0);
  const [files, setFiles] = useState<
    Partial<Record<ExportFormat | `png-${number}`, PreparedDocumentFile>>
  >({});
  const filesRef = useRef(files);
  const pendingPngRequest = useRef<{
    readonly id: number;
    readonly page: number;
  } | null>(null);

  const ready =
    !showQuery.isPending && !songsQuery.isPending && !bandQuery.isPending;
  const loadingSourceData =
    showQuery.isPending || songsQuery.isPending || bandQuery.isPending;
  const sourceDataError =
    showQuery.isError || songsQuery.isError || bandQuery.isError;

  useEffect(() => {
    if (
      snapshot ||
      !showQuery.data ||
      !songsQuery.data ||
      !bandQuery.data?.role ||
      showQuery.isError ||
      songsQuery.isError ||
      bandQuery.isError
    ) {
      return;
    }
    const nextSnapshot = {
      document: prepareShowExportDocument(
        showQuery.data,
        bandQuery.data,
        songsById,
      ),
      sourceUpdatedAt,
    };
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setSnapshot(nextSnapshot);
    });
    return () => {
      active = false;
    };
  }, [
    bandQuery.data,
    bandQuery.isError,
    showQuery.data,
    showQuery.isError,
    songsById,
    songsQuery.data,
    songsQuery.isError,
    snapshot,
    sourceUpdatedAt,
  ]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    void cleanupExpiredDocumentFiles().catch(() => undefined);
    return () =>
      Object.values(filesRef.current).forEach(
        (file) => file && releaseDocumentFile(file),
      );
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    let active = true;
    void loadDocumentFontResources()
      .then((fontResources) => {
        const nextPages = buildShowExportPages(
          snapshot.document,
          options,
          (text, size, bold) =>
            measureDocumentText(
              text,
              size,
              bold,
              bold ? fontResources.boldFont : fontResources.regularFont,
            ),
        );
        if (active) {
          setLayout({ snapshot, options, pages: nextPages, error: null });
        }
      })
      .catch((cause) => {
        if (active) {
          setLayout({
            snapshot,
            options,
            pages: [],
            error:
              cause instanceof Error
                ? cause.message
                : 'Não foi possível preparar a fonte do documento.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [options, snapshot]);

  const layoutMatches =
    Boolean(snapshot) &&
    layout?.snapshot === snapshot &&
    layout.options === options;
  const pages = layoutMatches ? layout.pages : [];
  const layoutError = layoutMatches ? layout.error : null;
  const layoutLoading = Boolean(snapshot && !layoutMatches);
  useEffect(() => {
    if (!updatingPreview || !layoutMatches) return;

    // Keep progress feedback visible even when the new layout is cached and
    // finishes in the same frame as the update action.
    const timeout = setTimeout(() => setUpdatingPreview(false), 600);
    return () => clearTimeout(timeout);
  }, [layoutMatches, updatingPreview]);

  const pageIndexForLayout = pages.length
    ? Math.max(0, Math.min(pageIndex, pages.length - 1))
    : 0;

  const hasExportSourceData = Boolean(
    showQuery.data && songsQuery.data && bandQuery.data?.role,
  );
  const sourceQueriesFetching =
    showQuery.isFetching || songsQuery.isFetching || bandQuery.isFetching;
  const hasPreparedFile = Object.values(files).some(Boolean);
  const canUpdatePreview = Boolean(
    snapshot &&
      (hasPreparedFile ||
        previewRefreshAvailable ||
        (ready &&
          hasExportSourceData &&
          !sourceDataError &&
          sourceUpdatedAt > snapshot.sourceUpdatedAt)),
  );
  const fileFormat: ExportFormat =
    destination === 'print' ? 'pdf' : destination;
  const currentFile =
    fileFormat === 'png'
      ? files[`png-${pageIndexForLayout + 1}`]
      : files[fileFormat];
  const currentPage = pages[pageIndexForLayout] ?? null;
  const destinationIcon = destinationOptions.find(
    ({ value }) => value === destination,
  )?.icon;

  const releaseFiles = (items: typeof files) => {
    Object.values(items).forEach((file) => file && releaseDocumentFile(file));
  };

  const updatePreview = () => {
    if (!showQuery.data || !songsQuery.data || !bandQuery.data?.role) {
      setError(
        'Os dados do show e da banda ainda estão sendo atualizados. Tente novamente em instantes.',
      );
      return;
    }
    setUpdatingPreview(true);
    setPreviewRefreshAvailable(false);
    releaseFiles(files);
    setFiles({});
    setError(null);
    setMessage(null);
    pendingPngRequest.current = null;
    setSnapshot({
      document: prepareShowExportDocument(
        showQuery.data,
        bandQuery.data,
        songsById,
      ),
      sourceUpdatedAt: Math.max(Date.now(), sourceUpdatedAt),
    });
  };

  const refreshAfterSystemPicker = async (completionMessage: string) => {
    setMessage('Atualizando os dados do show e da banda…');
    const sourceQueries = uniqueRefreshQueries([
      showQuery,
      songsQuery,
      bandQuery,
    ]);
    const queriesToRefresh = sourceQueries.filter(
      ({ isFetching }) => !isFetching,
    );
    let refreshFailed = false;
    try {
      await refetchScreenQueries(queryClient, queriesToRefresh);
      refreshFailed = sourceQueries.some(({ refreshKeys }) =>
        refreshKeys?.some(
          (queryKey) => queryClient.getQueryState(queryKey)?.status === 'error',
        ),
      );
    } catch {
      refreshFailed = true;
    }
    setPreviewRefreshAvailable(true);
    setMessage(
      refreshFailed
        ? `${completionMessage} Não foi possível atualizar os dados online; a pré-visualização pode usar os últimos dados carregados.`
        : completionMessage,
    );
  };

  const deliverPreparedFile = async (
    file: PreparedDocumentFile,
    target: ExportDestination,
    printTarget?: unknown,
  ) => {
    if (target === 'print') {
      if (Platform.OS !== 'web') {
        setPreviewRefreshAvailable(true);
      }
      await printShowDocument(file, pages, printTarget);
      if (Platform.OS !== 'web') {
        await refreshAfterSystemPicker('A janela de impressão foi aberta.');
      } else {
        setMessage('A janela de impressão foi aberta.');
      }
      return;
    }

    if (Platform.OS !== 'web') {
      setPreviewRefreshAvailable(true);
      const result = await shareDocumentFile(file);
      let completionMessage: string;
      if (result.status === 'cancelled') {
        completionMessage =
          'Compartilhamento cancelado. O arquivo continua preparado.';
      } else if (result.status === 'unsupported') {
        completionMessage =
          `O compartilhamento está indisponível neste dispositivo. O arquivo ${file.name} continua preparado.`;
      } else {
        completionMessage =
          'O seletor do sistema foi aberto. O Setlist não consegue confirmar que o destino salvou ou recebeu o arquivo.';
      }

      if (result.status !== 'unsupported') {
        await refreshAfterSystemPicker(completionMessage);
        return;
      }
      setMessage(completionMessage);
      return;
    }

    let sharingFailed = false;
    try {
      if (await canShareDocumentFile(file)) {
        const result = await shareDocumentFile(file);
        if (result.status === 'opened') {
          setMessage(
            'O seletor de compartilhamento foi aberto. O Setlist não consegue confirmar que o destino salvou ou recebeu o arquivo.',
          );
          return;
        }
        if (result.status === 'cancelled') {
          setMessage(
            'Compartilhamento cancelado. O arquivo continua preparado.',
          );
          return;
        }
      }
    } catch {
      // A ativação do navegador pode expirar durante a geração assíncrona.
      sharingFailed = true;
    }

    const download = await downloadDocumentFile(file);
    if (download.status !== 'opened') {
      throw new Error(
        'O navegador não conseguiu iniciar o download do arquivo.',
      );
    }
    setMessage(
      sharingFailed
        ? 'O navegador não abriu o compartilhamento automaticamente; o download foi iniciado.'
        : 'O compartilhamento não está disponível para este arquivo; o download foi iniciado.',
    );
  };

  const handleGenerate = async () => {
    if (!snapshot || !currentPage || working) return;
    setError(null);
    setMessage(null);

    let printTarget: unknown = null;
    if (destination === 'print') {
      try {
        // Na Web, abre a janela enquanto o clique do usuário ainda está ativo.
        printTarget = preparePrintTarget();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível preparar a janela de impressão.',
        );
        return;
      }
    }

    setWorking(true);
    if (destination === 'png') {
      const requestId = renderRequestId + 1;
      pendingPngRequest.current = {
        id: requestId,
        page: pageIndexForLayout,
      };
      setRenderRequestId(requestId);
      return;
    }
    try {
      const outputFormat = fileFormat;
      const bytes =
        outputFormat === 'pdf'
          ? await createShowExportPdf(snapshot.document, options)
          : encodeUtf8(createShowExportText(snapshot.document, options));
      const extension = outputFormat === 'pdf' ? 'pdf' : 'txt';
      const mimeType =
        outputFormat === 'pdf' ? 'application/pdf' : 'text/plain;charset=utf-8';
      const dateKey = getZonedDateTimeFields(snapshot.document.startsAt).date;
      const file = await prepareDocumentFile(
        createShowExportFilename(
          snapshot.document.showName,
          dateKey,
          extension,
        ),
        mimeType,
        bytes,
      );
      setFiles((current) => {
        const previous = current[outputFormat];
        if (previous) releaseDocumentFile(previous);
        return { ...current, [outputFormat]: file };
      });
      await deliverPreparedFile(file, destination, printTarget);
    } catch (cause) {
      closePrintTarget(printTarget);
      setError(
        cause instanceof Error ? cause.message : 'Falha ao gerar o arquivo.',
      );
    } finally {
      setWorking(false);
    }
  };

  const handlePngRendered = async (requestId: number, rawBase64: string) => {
    const pending = pendingPngRequest.current;
    if (!pending || pending.id !== requestId) return;
    try {
      const base64 = rawBase64.replace(/^data:image\/png;base64,/, '');
      const bytes = decodeBase64(base64);
      if (bytes.length === 0) throw new Error('A imagem gerada ficou vazia.');
      const document = snapshot?.document;
      if (!document) return;
      const dateKey = getZonedDateTimeFields(document.startsAt).date;
      const file = await prepareDocumentFile(
        createShowExportFilename(
          document.showName,
          dateKey,
          'png',
          pending.page + 1,
        ),
        'image/png',
        bytes,
      );
      const key = `png-${pending.page + 1}` as const;
      setFiles((current) => {
        const previous = current[key];
        if (previous) releaseDocumentFile(previous);
        return { ...current, [key]: file };
      });
      await deliverPreparedFile(file, 'png');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Falha ao gerar a imagem.',
      );
    } finally {
      pendingPngRequest.current = null;
      setWorking(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getShowHref(bandId, showId)}
      bandId={bandId}
      currentRoute={`${getShowHref(bandId, showId)}/export`}
      screenKind="detail"
      title="Exportar setlist"
    >
      {!snapshot && loadingSourceData ? (
        <LoadingFeedback variation={1} />
      ) : null}
      {!snapshot && sourceDataError ? (
        <ErrorFeedback
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ['bands', bandId] });
          }}
        />
      ) : null}
      {!snapshot &&
      ready &&
      !sourceDataError &&
      !showQuery.data ? (
        <UnavailableFeedback title="Show indisponível" />
      ) : null}
      {!snapshot && ready && !bandQuery.isError && !bandQuery.data?.role ? (
        <UnavailableFeedback title="Acesso à banda indisponível" />
      ) : null}
      {/* Keep the captured document visible while app-resume refetches reset queries. */}
      {snapshot ? (
        <View style={styles.content}>
          <AppText>
            Confira a pré-visualização antes de gerar. Letras, áudio e vídeo não
            são incluídos.
          </AppText>

          {canUpdatePreview || updatingPreview ? (
            <>
              {!updatingPreview ? (
                <AppText tone="muted" variant="caption">
                  A pré-visualização atual é uma cópia estável. Atualizar usa os
                  dados carregados agora e descarta os arquivos já gerados.
                </AppText>
              ) : null}
              <AppButton
                disabled={updatingPreview || sourceQueriesFetching}
                icon={
                  updatingPreview || sourceQueriesFetching
                    ? undefined
                    : 'refresh'
                }
                leading={
                  updatingPreview || sourceQueriesFetching ? (
                    <ActivityIndicator
                      color={colors.action.primary}
                      size="small"
                    />
                  ) : undefined
                }
                label={
                  updatingPreview
                    ? 'Atualizando visualização…'
                    : sourceQueriesFetching
                      ? 'Atualizando dados…'
                      : 'Atualizar visualização'
                }
                onPress={updatePreview}
                style={styles.actionButton}
                variant="secondary"
              />
            </>
          ) : null}

          <Card style={styles.settingsCard}>
            <AppText variant="heading">Informações incluídas</AppText>
            <View style={styles.fields}>
              {exportFields.map(({ key, label }) => (
                <ExportFieldToggle
                  key={key}
                  checked={options[key]}
                  label={label}
                  onChange={(checked) => {
                    setOptions((current) => ({ ...current, [key]: checked }));
                    setMessage(null);
                    releaseFiles(files);
                    setFiles({});
                  }}
                />
              ))}
            </View>
          </Card>

          <View style={styles.previewHeading}>
            <AppText variant="heading">Pré-visualização</AppText>
            <AppText tone="muted" variant="caption">
              {pages.length} {pages.length === 1 ? 'página' : 'páginas'} · A4
            </AppText>
          </View>
          {layoutLoading ? (
            <ActivityIndicator color={colors.action.primary} />
          ) : currentPage ? (
            <>
              <DocumentPagePreview page={currentPage} />
              {pages.length > 1 ? (
                <View style={styles.pagination}>
                  <AppButton
                    disabled={pageIndexForLayout === 0}
                    accessibilityLabel="Página anterior"
                    icon="back"
                    label="Anterior"
                    onPress={() => setPageIndex(pageIndexForLayout - 1)}
                    style={styles.paginationButton}
                    variant="secondary"
                  />
                  <AppText
                    accessibilityLabel={`Página ${pageIndexForLayout + 1} de ${pages.length}`}
                    accessibilityLiveRegion="polite"
                    style={styles.paginationLabel}
                    variant="caption"
                  >
                    {pageIndexForLayout + 1} / {pages.length}
                  </AppText>
                  <AppButton
                    disabled={pageIndexForLayout >= pages.length - 1}
                    accessibilityLabel="Próxima página"
                    icon="forward"
                    label="Próxima"
                    onPress={() => setPageIndex(pageIndexForLayout + 1)}
                    style={styles.paginationButton}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </>
          ) : null}

          <Card style={styles.settingsCard}>
            <AppText variant="heading">Destino</AppText>
            <View
              accessibilityLabel="Destino da exportação"
              accessibilityRole="radiogroup"
              style={styles.destinationOptions}
            >
              {destinationOptions.map(({ icon, label, value }) => {
                const selected = destination === value;
                return (
                  <Pressable
                    disabled={working}
                    key={value}
                    accessibilityLabel={label}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                      disabled: working,
                    }}
                    onPress={() => {
                      releaseFiles(files);
                      setFiles({});
                      setDestination(value);
                      setMessage(null);
                      setError(null);
                    }}
                    style={({ pressed }) => [
                      styles.destinationOption,
                      selected && styles.destinationOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon
                      color={
                        selected ? colors.action.primary : colors.text.secondary
                      }
                      name={icon}
                      size={22}
                    />
                    <AppText
                      style={[
                        styles.destinationLabel,
                        selected && styles.destinationLabelSelected,
                      ]}
                      variant="body"
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText tone="muted" variant="caption">
              Depois de gerar, o compartilhamento, download ou impressão será
              iniciado automaticamente.
            </AppText>
            {destination === 'png' && currentPage ? (
              <AppText tone="muted" variant="caption">
                Será gerada uma imagem da página {pageIndexForLayout + 1} de{' '}
                {pages.length} ({PAGE_PNG_WIDTH} × {PAGE_PNG_HEIGHT} px).
              </AppText>
            ) : null}
            <AppButton
              disabled={working || layoutLoading || pages.length === 0}
              icon={working ? undefined : destinationIcon}
              label={
                working
                  ? destination === 'png'
                    ? `Gerando página ${pageIndexForLayout + 1}…`
                    : 'Gerando arquivo…'
                  : destination === 'png'
                    ? `Gerar imagem da página ${pageIndexForLayout + 1}`
                    : destination === 'print'
                      ? 'Gerar e imprimir'
                      : `Gerar ${destination.toUpperCase()}`
              }
              onPress={() => void handleGenerate()}
              style={styles.actionButton}
            />
          </Card>

          {currentFile ? (
            <AppText tone="muted" variant="caption">
              Arquivo gerado: {currentFile.name}
            </AppText>
          ) : null}
          {message ? (
            <AppText accessibilityLiveRegion="polite" tone="success">
              {message}
            </AppText>
          ) : null}
          {error ? (
            <AppText accessibilityRole="alert" tone="danger">
              {error}
            </AppText>
          ) : null}
          {layoutError ? (
            <AppText accessibilityRole="alert" tone="danger">
              {layoutError}
            </AppText>
          ) : null}
          <PngPageRenderer
            onRendered={(requestId, base64) =>
              void handlePngRendered(requestId, base64)
            }
            page={destination === 'png' ? currentPage : null}
            requestId={renderRequestId}
          />
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

function ExportFieldToggle({
  checked,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.fieldToggle, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <AppText tone="onAccent">✓</AppText> : null}
      </View>
      <AppText>{label}</AppText>
    </Pressable>
  );
}

function DocumentPagePreview({ page }: { readonly page: ShowExportPage }) {
  return (
    <View
      accessibilityLabel={`Pré-visualização da página ${page.pageNumber} de ${page.pageCount}`}
      style={styles.pagePreview}
    >
      {[...page.header, ...page.lines].map((line, index) =>
        line.style === 'separator' ? (
          <View key={`preview-${index}`} style={styles.previewSeparator} />
        ) : (
          <AppText
            key={`preview-${index}`}
            style={{
              color: getPageLineColor(line.style),
              fontFamily: isPageLineBold(line.style)
                ? 'SetlistRobotoBold'
                : 'SetlistRobotoRegular',
              fontSize: line.fontSize,
              lineHeight: line.lineHeight,
              marginLeft: Math.max(0, line.x - 42),
              marginTop: 1,
            }}
          >
            {line.text || ' '}
          </AppText>
        ),
      )}
      <AppText style={styles.pageNumber} tone="muted" variant="caption">
        Página {page.pageNumber} de {page.pageCount}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    alignSelf: 'center',
    maxWidth: 360,
    width: '100%',
  },
  settingsCard: {
    gap: spacing.md,
  },
  destinationOptions: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    maxWidth: 595,
    width: '100%',
  },
  destinationOption: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderColor: colors.border.control,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  destinationOptionSelected: {
    borderColor: colors.action.primary,
    borderWidth: 2,
  },
  destinationLabel: {
    textAlign: 'center',
  },
  destinationLabelSelected: {
    color: colors.action.primary,
    fontWeight: '700',
  },
  fields: {
    gap: spacing.xs,
  },
  fieldToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
  pressed: { opacity: 0.75 },
  previewHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pagePreview: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: 1,
    maxWidth: 595,
    minHeight: 220,
    overflow: 'hidden',
    padding: spacing.lg,
    width: '100%',
  },
  previewSeparator: {
    borderTopColor: '#94a3b8',
    borderTopWidth: 1,
    marginVertical: spacing.xs,
  },
  pageNumber: {
    borderTopColor: '#d1d6de',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  pagination: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    maxWidth: 595,
    width: '100%',
  },
  paginationButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
  },
  paginationLabel: {
    flexShrink: 0,
    textAlign: 'center',
  },
});
