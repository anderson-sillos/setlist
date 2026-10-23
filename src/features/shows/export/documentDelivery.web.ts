import type {
  DocumentDeliveryResult,
  PreparedDocumentFile,
} from './documentFileTypes';
import {
  getPageLineColor,
  isPageLineBold,
  PAGE_HEIGHT_PT,
  PAGE_WIDTH_PT,
  type ShowExportPage,
} from './showExportLayout';
import { loadDocumentFontResources } from './documentFonts';

export async function cleanupExpiredDocumentFiles(): Promise<void> {
  // Browser downloads are owned by object URLs and released by the route.
}

type FileShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

export async function prepareDocumentFile(
  name: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<PreparedDocumentFile> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mimeType });
  return {
    name,
    mimeType,
    uri: URL.createObjectURL(blob),
    blob,
    size: blob.size,
  };
}

export async function canShareDocumentFile(
  file: PreparedDocumentFile,
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !file.blob) return false;
  const shareNavigator = navigator as FileShareNavigator;
  if (!shareNavigator.share || !shareNavigator.canShare) return false;
  const candidate = new File([file.blob], file.name, { type: file.mimeType });
  return shareNavigator.canShare({ files: [candidate] });
}

function isFileShareSupported(file: PreparedDocumentFile): boolean {
  if (typeof navigator === 'undefined' || !file.blob) return false;
  const shareNavigator = navigator as FileShareNavigator;
  if (!shareNavigator.share || !shareNavigator.canShare) return false;
  const candidate = new File([file.blob], file.name, { type: file.mimeType });
  return shareNavigator.canShare({ files: [candidate] });
}

export async function shareDocumentFile(
  file: PreparedDocumentFile,
): Promise<DocumentDeliveryResult> {
  if (!file.blob || !isFileShareSupported(file)) {
    return { status: 'unsupported' };
  }
  const shareNavigator = navigator as FileShareNavigator;
  const candidate = new File([file.blob], file.name, { type: file.mimeType });
  try {
    await shareNavigator.share?.({ files: [candidate], title: file.name });
    return { status: 'opened' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    throw error;
  }
}

export async function downloadDocumentFile(
  file: PreparedDocumentFile,
): Promise<DocumentDeliveryResult> {
  if (!file.blob) return { status: 'unsupported' };
  const anchor = document.createElement('a');
  anchor.href = file.uri;
  anchor.download = file.name;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return { status: 'opened' };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function printShowDocument(
  _file: PreparedDocumentFile,
  pages: readonly ShowExportPage[],
  preparedTarget?: unknown,
): Promise<void> {
  const printWindow =
    (preparedTarget as Window | null | undefined) ?? window.open('', '_blank');
  if (!printWindow) {
    throw new Error(
      'O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.',
    );
  }
  printWindow.opener = null;
  const fonts = await loadDocumentFontResources();
  const fontUrl = (value: string) => value.replace(/["\\\n\r]/g, '\\$&');
  const content = pages
    .map((page) => {
      const lines = [...page.header, ...page.lines]
        .map((line) => {
          if (line.style === 'separator') {
            return `<hr style="position:absolute;left:${line.x}pt;top:${line.top + 6}pt;width:${page.width - line.x - 42}pt;border:0;border-top:.7pt solid ${getPageLineColor(line.style)};margin:0" />`;
          }
          return `<div style="position:absolute;left:${line.x}pt;top:${line.top}pt;font-size:${line.fontSize}pt;line-height:${line.lineHeight}pt;font-weight:${isPageLineBold(line.style) ? 700 : 400};color:${getPageLineColor(line.style)};white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(line.text)}</div>`;
        })
        .join('');
      return `<section class="page">${lines}<footer>Página ${page.pageNumber} de ${page.pageCount}</footer></section>`;
    })
    .join('');
  printWindow.document.open();
  printWindow.document.write(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Setlist</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}@font-face{font-family:SetlistRobotoRegular;src:url("${fontUrl(fonts.regularUri)}") format("truetype")}@font-face{font-family:SetlistRobotoBold;src:url("${fontUrl(fonts.boldUri)}") format("truetype")}body{margin:0;background:#fff;color:#111827;font-family:SetlistRobotoRegular,Arial,sans-serif}.page{width:${PAGE_WIDTH_PT}pt;height:${PAGE_HEIGHT_PT}pt;page-break-after:always;position:relative;background:#fff}.page:last-child{page-break-after:auto}.brand,.title,.section,.song,.total{font-family:SetlistRobotoBold,Arial,sans-serif}footer{position:absolute;bottom:16pt;left:42pt;right:42pt;border-top:.5pt solid #d1d6de;padding-top:4pt;font-size:8pt;color:#596373}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${content}<script>window.addEventListener('load',()=>document.fonts.ready.then(()=>setTimeout(()=>window.print(),150)))</script></body></html>`,
  );
  printWindow.document.close();
}

export function preparePrintTarget(): Window {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error(
      'O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.',
    );
  }
  printWindow.opener = null;
  return printWindow;
}

export function closePrintTarget(target: unknown): void {
  const printWindow = target as Window | null;
  if (printWindow && !printWindow.closed) printWindow.close();
}

export function releaseDocumentFile(file: PreparedDocumentFile): void {
  URL.revokeObjectURL(file.uri);
}
