import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BRAND_VIOLET = '#7c3aed';
const WHITE = '#ffffff';
const FULL_ICON_SCALE = 0.66;
const ADAPTIVE_ICON_SCALE = 0.56;
const FAVICON_SCALE = 0.78;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const outputDirectory = resolve(projectRoot, 'assets/icons');

mkdirSync(outputDirectory, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function distanceToSegment(x, y, startX, startY, endX, endY) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = clamp(
    ((x - startX) * segmentX + (y - startY) * segmentY) / lengthSquared,
    0,
    1,
  );
  const closestX = startX + projection * segmentX;
  const closestY = startY + projection * segmentY;

  return Math.hypot(x - closestX, y - closestY);
}

function getMusicNoteCoverage(x, y, size, glyphScale) {
  const scale = (size * glyphScale) / 24;
  const offset = (size - size * glyphScale) / 2;
  const iconX = (x - offset) / scale;
  const iconY = (y - offset) / scale;
  const circleDistance = Math.abs(Math.hypot(iconX - 8, iconY - 18) - 4) - 1;
  const stemDistance = distanceToSegment(iconX, iconY, 12, 18, 12, 2) - 1;
  const flagDistance = distanceToSegment(iconX, iconY, 12, 2, 19, 6) - 1;
  const signedDistanceInPixels =
    Math.min(circleDistance, stemDistance, flagDistance) * scale;

  return clamp(0.5 - signedDistanceInPixels, 0, 1);
}

function parseHexColor(color) {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function createIconPng(size, { glyphScale, transparentBackground = false }) {
  const [backgroundRed, backgroundGreen, backgroundBlue] =
    parseHexColor(BRAND_VIOLET);
  const channels = transparentBackground ? 4 : 3;
  const rowLength = size * channels + 1;
  const pixels = Buffer.alloc(rowLength * size);

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * rowLength;
    pixels[rowOffset] = 0;

    for (let x = 0; x < size; x += 1) {
      const coverage = getMusicNoteCoverage(x + 0.5, y + 0.5, size, glyphScale);
      const pixelOffset = rowOffset + 1 + x * channels;

      if (transparentBackground) {
        pixels[pixelOffset] = 255;
        pixels[pixelOffset + 1] = 255;
        pixels[pixelOffset + 2] = 255;
        pixels[pixelOffset + 3] = Math.round(coverage * 255);
      } else {
        pixels[pixelOffset] = Math.round(
          backgroundRed + (255 - backgroundRed) * coverage,
        );
        pixels[pixelOffset + 1] = Math.round(
          backgroundGreen + (255 - backgroundGreen) * coverage,
        );
        pixels[pixelOffset + 2] = Math.round(
          backgroundBlue + (255 - backgroundBlue) * coverage,
        );
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = transparentBackground ? 6 : 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    createPngChunk('IHDR', header),
    createPngChunk('IDAT', deflateSync(pixels, { level: 9 })),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(images.length * 16);
  let imageOffset = header.length + directory.length;

  images.forEach(({ buffer, size }, index) => {
    const entryOffset = index * 16;
    directory[entryOffset] = size === 256 ? 0 : size;
    directory[entryOffset + 1] = size === 256 ? 0 : size;
    directory[entryOffset + 2] = 0;
    directory[entryOffset + 3] = 0;
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(buffer.length, entryOffset + 8);
    directory.writeUInt32LE(imageOffset, entryOffset + 12);
    imageOffset += buffer.length;
  });

  return Buffer.concat([
    header,
    directory,
    ...images.map(({ buffer }) => buffer),
  ]);
}

function writeIfChanged(relativePath, content) {
  const outputPath = resolve(outputDirectory, relativePath);
  let existingContent;

  try {
    existingContent = readFileSync(outputPath);
  } catch {
    existingContent = undefined;
  }

  const nextContent = Buffer.isBuffer(content) ? content : Buffer.from(content);

  if (!existingContent?.equals(nextContent)) {
    writeFileSync(outputPath, nextContent);
  }
}

function createSvg(glyphScale, includeBackground) {
  const offset = ((1 - glyphScale) * 24) / 2;
  const background = includeBackground
    ? `  <rect width="24" height="24" fill="${BRAND_VIOLET}" />\n`
    : '';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
    background.trimEnd(),
    `  <g transform="translate(${offset} ${offset}) scale(${glyphScale})" fill="none" stroke="${WHITE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`,
    '    <circle cx="8" cy="18" r="4" />',
    '    <path d="M12 18V2l7 4" />',
    '  </g>',
    '</svg>',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

writeIfChanged('app-icon.svg', createSvg(FULL_ICON_SCALE, true));
writeIfChanged(
  'android-adaptive-foreground.svg',
  createSvg(ADAPTIVE_ICON_SCALE, false),
);

writeIfChanged(
  'app-icon-1024.png',
  createIconPng(1024, { glyphScale: FULL_ICON_SCALE }),
);
writeIfChanged(
  'android-adaptive-foreground-1024.png',
  createIconPng(1024, {
    glyphScale: ADAPTIVE_ICON_SCALE,
    transparentBackground: true,
  }),
);

for (const size of [180, 192, 512]) {
  writeIfChanged(
    `app-icon-${size}.png`,
    createIconPng(size, { glyphScale: FULL_ICON_SCALE }),
  );
}

const faviconImages = [16, 32, 48, 64, 128, 256].map((size) => ({
  buffer: createIconPng(size, { glyphScale: FAVICON_SCALE }),
  size,
}));

for (const { buffer, size } of faviconImages.slice(0, 3)) {
  writeIfChanged(`favicon-${size}.png`, buffer);
}

writeIfChanged('favicon.ico', createIco(faviconImages));

console.log(`Ícones gerados em ${outputDirectory}`);
