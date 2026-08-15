const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadsRoot = path.join(__dirname, '..', 'uploads');

// A soft, floral-shop-appropriate palette — rotated across products/
// categories/banners so the demo catalog doesn't look monochrome.
const PALETTE = [
  { bg: '#F3D9DF', fg: '#7A2E3B' },
  { bg: '#E7D6C9', fg: '#6B4226' },
  { bg: '#DCE5D3', fg: '#3F5B3A' },
  { bg: '#F6E1C5', fg: '#8A5A2B' },
  { bg: '#E3D4EC', fg: '#5B3E75' },
  { bg: '#F9DCE2', fg: '#9C3B54' },
  { bg: '#D9E7E5', fg: '#2E5C57' },
  { bg: '#F0E4D7', fg: '#7A5C3E' },
];

function paletteFor(index) {
  return PALETTE[index % PALETTE.length];
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Wraps `text` onto a small number of lines that roughly fit `maxCharsPerLine`,
 * breaking on word boundaries. Good enough for centered SVG placeholder labels.
 */
function wrapLabel(text, maxCharsPerLine = 18) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg({ width, height, bg, fg, label }) {
  const lines = wrapLabel(label);
  const fontSize = Math.round(width / 14);
  const lineHeight = fontSize * 1.3;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  const textEls = lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" fill="none" stroke="${fg}" stroke-opacity="0.25" stroke-width="2"/>
  ${textEls}
</svg>`;
}

/**
 * Generates a placeholder SVG and writes it into uploads/<subfolder>/,
 * exactly matching the filename convention and public URL shape the real
 * multer upload flow produces — so seed data and real uploads are
 * indistinguishable to API consumers.
 */
function writePlaceholderImage(subfolder, { label, paletteIndex = 0, width = 900, height = 900 }) {
  const { bg, fg } = paletteFor(paletteIndex);
  const svg = buildSvg({ width, height, bg, fg, label });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.svg`;
  const dir = path.join(uploadsRoot, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), svg, 'utf8');

  return `/uploads/${subfolder}/${filename}`;
}

module.exports = { writePlaceholderImage };
