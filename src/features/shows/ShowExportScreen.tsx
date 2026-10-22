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
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ChoiceChips } from '@/components/ui/list-controls/ChoiceChips';
import { useBandContext, useShow, useSongSummaries } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getShowHref } from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';
import { getZonedDateTimeFields } from './export/showCalendarModel';
import {
  canShareDocumentFile,
  cleanupExpiredDocumentFiles,
  downloadDocumentFile,
  prepareDocumentFile,
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

interface ExportSnapshot {
  readonly document: ReturnType<typeof prepareShowExportDocument>;
  readonly sourceUpdatedAt: number;
}

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Texto', value: 'txt' },
  { label: 'PNG', value: 'png' },
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
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [layout, setLayout] = useState<{
    readonly snapshot: ExportSnapshot;
    readonly options: ShowExportOptions;
    readonly pages: readonly ShowExportPage[];
    readonly error: string | null;
  } | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [renderRequestId, setRenderRequestId] = useState(0);
  const [files, setFiles] = useState<
    Partial<Record<ExportFormat | `png-${number}`, PreparedDocumentFile>>
  >({});
  const filesRef = useRef(files);
  const [shareAvailability, setShareAvailability] = useState<{
    readonly uri: string;
    readonly available: boolean;
  } | null>(null);
  const pendingPngRequest = useRef<{
    readonly id: number;
    readonly page: number;
  } | null>(null);

  const ready =
    !showQuery.isPending && !songsQuery.isPending && !bandQuery.isPending;
  const canPrepare =
    ready &&
    !showQuery.isError &&
    !songsQuery.isError &&
    !bandQuery.isError &&
    Boolean(showQuery.data && songsQuery.data && bandQuery.data?.role);

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
  const pageIndexForLayout = pages.length
    ? Math.max(0, Math.min(pageIndex, pages.length - 1))
    : 0;

  const hasNewData = Boolean(
    snapshot && sourceUpdatedAt > snapshot.sourceUpdatedAt,
  );
  const currentFile =
    format === 'png' ? files[`png-${pageIndexForLayout + 1}`] : files[format];
  const currentPage = pages[pageIndexForLayout] ?? null;
  const shareSupported = Boolean(
    currentFile &&
    shareAvailability?.uri === currentFile.uri &&
    shareAvailability.available,
  );

  useEffect(() => {
    let active = true;
    if (!currentFile) return;
    void canShareDocumentFile(currentFile)
      .then((available) => {
        if (active) {
          setShareAvailability({ uri: currentFile.uri, available });
        }
      })
      .catch(() => {
        if (active) {
          setShareAvailability({ uri: currentFile.uri, available: false });
        }
      });
    return () => {
      active = false;
    };
  }, [currentFile]);

  const releaseFiles = (items: typeof files) => {
    Object.values(items).forEach((file) => file && releaseDocumentFile(file));
  };

  const updatePreview = () => {
    if (!showQuery.data || !songsQuery.data || !bandQuery.data) return;
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

  const handleGenerate = async () => {
    if (!snapshot || !currentPage || working) return;
    setError(null);
    setMessage(null);
    setWorking(true);
    if (format === 'png') {
      const requestId = renderRequestId + 1;
      pendingPngRequest.current = {
        id: requestId,
        page: pageIndexForLayout,
      };
      setRenderRequestId(requestId);
      return;
    }
    try {
      const bytes =
        format === 'pdf'
          ? await createShowExportPdf(snapshot.document, options)
          : encodeUtf8(createShowExportText(snapshot.document, options));
      const extension = format === 'pdf' ? 'pdf' : 'txt';
      const mimeType =
        format === 'pdf' ? 'application/pdf' : 'text/plain;charset=utf-8';
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
        const previous = current[format];
        if (previous) releaseDocumentFile(previous);
        return { ...current, [format]: file };
      });
      setMessage(
        `${extension.toUpperCase()} preparado. Escolha como deseja entregá-lo.`,
      );
    } catch (cause) {
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
      if (bytes.length === 0) throw new Error('A imagem PNG ficou vazia.');
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
      setMessage(`Imagem PNG da página ${pending.page + 1} preparada.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Falha ao gerar a imagem PNG.',
      );
    } finally {
      pendingPngRequest.current = null;
      setWorking(false);
    }
  };

  const handleDelivery = async (action: 'share' | 'download') => {
    if (!currentFile || working) return;
    setWorking(true);
    setError(null);
    try {
      const result =
        action === 'share'
          ? await shareDocumentFile(currentFile)
          : await downloadDocumentFile(currentFile);
      if (result.status === 'cancelled') {
        setMessage('Compartilhamento cancelado. O arquivo continua preparado.');
      } else if (result.status === 'unsupported') {
        setMessage(
          'Compartilhamento indisponível para este arquivo. Use o download ou outra ação disponível.',
        );
      } else {
        setMessage(
          action === 'download' && Platform.OS === 'web'
            ? 'O download do arquivo foi iniciado.'
            : 'O seletor do sistema foi aberto. O Setlist não consegue confirmar que o destino salvou ou recebeu o arquivo.',
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível entregar o arquivo.',
      );
    } finally {
      setWorking(false);
    }
  };

  const handlePrint = async () => {
    if (!currentFile || !pages.length || working) return;
    setWorking(true);
    setError(null);
    try {
      await printShowDocument(currentFile, pages);
      setMessage('A preparação para impressão foi aberta.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível abrir a impressão.',
      );
    } finally {
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
      {showQuery.isPending || songsQuery.isPending || bandQuery.isPending ? (
        <LoadingFeedback variation={1} />
      ) : null}
      {showQuery.isError || songsQuery.isError || bandQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ['bands', bandId] });
          }}
        />
      ) : null}
      {ready &&
      !showQuery.isError &&
      !songsQuery.isError &&
      !bandQuery.isError &&
      !showQuery.data ? (
        <UnavailableFeedback title="Show indisponível" />
      ) : null}
      {ready && !bandQuery.isError && !bandQuery.data?.role ? (
        <UnavailableFeedback title="Acesso à banda indisponível" />
      ) : null}
      {canPrepare && snapshot ? (
        <View style={styles.content}>
          <AppText>
            Revise a prévia antes de gerar. Letras, áudio e vídeo não são
            incluídos.
          </AppText>
          <AppText tone="muted" variant="caption">
            A cópia preparada fica estável durante esta revisão. Atualize a
            prévia para usar mudanças recentes do show ou do repertório.
          </AppText>

          {hasNewData ? (
            <AppButton
              icon="refresh"
              label="Atualizar prévia com os dados atuais"
              onPress={updatePreview}
              variant="secondary"
            />
          ) : null}

          <Card style={styles.settingsCard}>
            <AppText variant="heading">Formato</AppText>
            <ChoiceChips
              accessibilityLabel="Formato de exportação"
              onChange={(value) => {
                setFormat(value);
                setMessage(null);
                setError(null);
              }}
              options={formatOptions}
              value={format}
            />
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
            <AppText variant="heading">Prévia</AppText>
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
                    label="Página anterior"
                    onPress={() => setPageIndex(pageIndexForLayout - 1)}
                    variant="secondary"
                  />
                  <AppText accessibilityLiveRegion="polite" variant="caption">
                    Página {pageIndexForLayout + 1} de {pages.length}
                  </AppText>
                  <AppButton
                    disabled={pageIndexForLayout >= pages.length - 1}
                    label="Próxima página"
                    onPress={() => setPageIndex(pageIndexForLayout + 1)}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {format === 'png' ? (
            <AppText tone="muted" variant="caption">
              Cada página é gerada e entregue como um PNG independente (
              {PAGE_PNG_WIDTH} × {PAGE_PNG_HEIGHT} px).
            </AppText>
          ) : null}
          <AppButton
            disabled={working || layoutLoading || pages.length === 0}
            icon={working ? undefined : 'fileText'}
            label={
              working
                ? format === 'png'
                  ? `Gerando página ${pageIndexForLayout + 1}…`
                  : 'Gerando arquivo…'
                : format === 'png'
                  ? `Gerar PNG da página ${pageIndexForLayout + 1}`
                  : `Gerar ${format.toUpperCase()}`
            }
            onPress={() => void handleGenerate()}
          />

          {currentFile ? (
            <View style={styles.deliveryActions}>
              {Platform.OS === 'web' && shareSupported ? (
                <AppButton
                  disabled={working}
                  icon="share"
                  label="Compartilhar arquivo"
                  onPress={() => void handleDelivery('share')}
                  variant="secondary"
                />
              ) : Platform.OS === 'web' ? (
                <AppText tone="muted" variant="caption">
                  Compartilhamento indisponível para este arquivo neste
                  dispositivo. Use salvar ou baixar.
                </AppText>
              ) : null}
              <AppButton
                disabled={working}
                icon="fileText"
                label={
                  Platform.OS === 'web'
                    ? 'Salvar ou baixar arquivo'
                    : 'Abrir seletor para salvar ou compartilhar'
                }
                onPress={() => void handleDelivery('download')}
                variant="secondary"
              />
              {format === 'pdf' ? (
                <AppButton
                  disabled={working}
                  icon="fileText"
                  label="Imprimir roteiro"
                  onPress={() => void handlePrint()}
                  variant="secondary"
                />
              ) : null}
              {format === 'png' ? (
                <AppText tone="muted" variant="caption">
                  Arquivo preparado: {currentFile.name}
                </AppText>
              ) : null}
            </View>
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
            page={format === 'png' ? currentPage : null}
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
      accessibilityLabel={`Prévia da página ${page.pageNumber} de ${page.pageCount}`}
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
  settingsCard: {
    gap: spacing.md,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  deliveryActions: {
    gap: spacing.sm,
  },
});
