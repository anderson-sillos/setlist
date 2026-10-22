import { useEffect, useRef } from 'react';

import {
  getPageLineColor,
  isPageLineBold,
  PAGE_PNG_HEIGHT,
  PAGE_PNG_WIDTH,
  PAGE_SCALE,
  type ShowExportPage,
} from './showExportLayout';

interface PngPageRendererProps {
  readonly onRendered: (requestId: number, base64: string) => void;
  readonly page: ShowExportPage | null;
  readonly requestId: number;
}

export function PngPageRenderer({
  onRendered,
  page,
  requestId,
}: PngPageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handledRequest = useRef(0);

  useEffect(() => {
    if (!page || requestId <= 0 || handledRequest.current === requestId) return;
    handledRequest.current = requestId;
    let cancelled = false;
    void (async () => {
      await document.fonts.ready;
      await document.fonts.load('10px SetlistRobotoRegular');
      await document.fonts.load('700 10px SetlistRobotoBold');
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context || cancelled) return;
      context.setTransform(PAGE_SCALE, 0, 0, PAGE_SCALE, 0, 0);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, page.width, page.height);
      [...page.header, ...page.lines].forEach((line) => {
        if (line.style === 'separator') {
          context.beginPath();
          context.strokeStyle = getPageLineColor(line.style);
          context.lineWidth = 0.7;
          context.moveTo(line.x, line.top + 6);
          context.lineTo(page.width - 42, line.top + 6);
          context.stroke();
          return;
        }
        context.fillStyle = getPageLineColor(line.style);
        context.font = `${isPageLineBold(line.style) ? '700' : '400'} ${line.fontSize}px ${isPageLineBold(line.style) ? 'SetlistRobotoBold' : 'SetlistRobotoRegular'}`;
        context.textBaseline = 'alphabetic';
        context.fillText(line.text, line.x, line.top + line.fontSize);
      });
      context.beginPath();
      context.strokeStyle = '#d1d6de';
      context.lineWidth = 0.5;
      context.moveTo(42, 814);
      context.lineTo(page.width - 42, 814);
      context.stroke();
      context.fillStyle = '#596373';
      context.font = '400 8px SetlistRobotoRegular';
      context.fillText(
        `Página ${page.pageNumber} de ${page.pageCount}`,
        42,
        829,
      );
      if (!cancelled) {
        const base64 = canvas.toDataURL('image/png').split(',')[1] ?? '';
        onRendered(requestId, base64);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onRendered, page, requestId]);

  return (
    <canvas
      aria-hidden="true"
      height={PAGE_PNG_HEIGHT}
      ref={canvasRef}
      style={{
        height: PAGE_PNG_HEIGHT,
        left: -10000,
        opacity: 0,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        width: PAGE_PNG_WIDTH,
      }}
      width={PAGE_PNG_WIDTH}
    />
  );
}
