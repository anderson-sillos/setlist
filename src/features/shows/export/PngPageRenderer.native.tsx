import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Line, Rect, Text } from 'react-native-svg';

import {
  getPageLineColor,
  isPageLineBold,
  PAGE_PNG_HEIGHT,
  PAGE_PNG_WIDTH,
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
  const svgRef = useRef<Svg>(null);
  const handledRequest = useRef(0);

  useEffect(() => {
    if (!page || requestId <= 0 || handledRequest.current === requestId) return;
    handledRequest.current = requestId;
    const frame = requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      svg.toDataURL((base64) => onRendered(requestId, base64));
    });
    return () => cancelAnimationFrame(frame);
  }, [onRendered, page, requestId]);

  if (!page) return null;

  const lines = [...page.header, ...page.lines];
  return (
    <Svg
      ref={svgRef}
      accessibilityElementsHidden
      height={PAGE_PNG_HEIGHT}
      pointerEvents="none"
      style={styles.surface}
      viewBox={`0 0 ${page.width} ${page.height}`}
      width={PAGE_PNG_WIDTH}
    >
      <Rect
        fill="#ffffff"
        height={page.height}
        width={page.width}
        x={0}
        y={0}
      />
      {lines.map((line, index) =>
        line.style === 'separator' ? (
          <Line
            key={`line-${index}`}
            stroke={getPageLineColor(line.style)}
            strokeWidth={0.7}
            x1={line.x}
            x2={page.width - 42}
            y1={line.top + 6}
            y2={line.top + 6}
          />
        ) : (
          <Text
            fill={getPageLineColor(line.style)}
            fontFamily={
              isPageLineBold(line.style)
                ? 'SetlistRobotoBold'
                : 'SetlistRobotoRegular'
            }
            fontSize={line.fontSize}
            key={`line-${index}`}
            x={line.x}
            y={line.top + line.fontSize}
          >
            {line.text}
          </Text>
        ),
      )}
      <Line
        stroke="#d1d6de"
        strokeWidth={0.5}
        x1={42}
        x2={page.width - 42}
        y1={814}
        y2={814}
      />
      <Text
        fill="#596373"
        fontFamily="SetlistRobotoRegular"
        fontSize={8}
        x={42}
        y={829}
      >
        {`Página ${page.pageNumber} de ${page.pageCount}`}
      </Text>
      <Text
        fill="#596373"
        fontFamily="SetlistRobotoRegular"
        fontSize={8}
        textAnchor="end"
        x={page.width - 42}
        y={829}
      >
        {page.generatedAtLabel}
      </Text>
    </Svg>
  );
}

const styles = StyleSheet.create({
  surface: {
    left: -10000,
    // `opacity` também é herdada pelo grupo SVG e deixaria a captura transparente.
    position: 'absolute',
    top: 0,
  },
});
