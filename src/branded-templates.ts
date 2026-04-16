/**
 * SVG templates for branded QR code frames.
 *
 * Based on the official visual identity:
 * - PAY by square: Blue border, light blue inner border, "PAY by square" text + card icon
 * - payme: White rounded card, "payme" text with tilde/smile underneath
 */

/**
 * Generate SVG for the PAY by square branded frame.
 *
 * Layout: Blue outer border -> lighter blue inner border -> white background -> QR code
 * Bottom: "PAY by square" text with card icon
 *
 * @param qrDataUrl - Base64 data URL of the QR code PNG
 * @param size - Overall image size in pixels
 */
export function payBySquareSvg(qrDataUrl: string, size: number = 400): string {
  const padding = Math.round(size * 0.06);
  const innerPadding = Math.round(size * 0.04);
  const bottomBarHeight = Math.round(size * 0.12);
  const totalHeight = size + bottomBarHeight;
  const borderRadius = Math.round(size * 0.04);
  const innerBorderRadius = Math.round(size * 0.03);

  const qrX = padding + innerPadding;
  const qrY = padding + innerPadding;
  const qrSize = size - 2 * (padding + innerPadding);

  const fontSize = Math.round(size * 0.055);
  const textY = size + bottomBarHeight * 0.65;

  // Card icon dimensions
  const iconW = Math.round(size * 0.07);
  const iconH = Math.round(iconW * 0.7);
  const iconX = size - padding - iconW - 4;
  const iconY = Math.round(textY - iconH * 0.6);
  const iconR = Math.round(iconW * 0.12);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}">
  <!-- Blue background -->
  <rect width="${size}" height="${totalHeight}" rx="${borderRadius}" fill="#1a56db"/>

  <!-- Lighter blue inner border -->
  <rect x="${padding}" y="${padding}" width="${size - 2 * padding}" height="${size - 2 * padding}"
        rx="${innerBorderRadius}" fill="#4b83f0" opacity="0.4"/>

  <!-- White QR background -->
  <rect x="${padding + innerPadding / 2}" y="${padding + innerPadding / 2}"
        width="${size - 2 * padding - innerPadding}" height="${size - 2 * padding - innerPadding}"
        rx="${Math.round(innerBorderRadius * 0.6)}" fill="white"/>

  <!-- QR code image -->
  <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>

  <!-- PAY by square text -->
  <text x="${padding + 4}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" fill="white">
    <tspan font-weight="bold" fill="#4ade80">PAY</tspan>
    <tspan fill="white"> by square</tspan>
  </text>

  <!-- Card icon -->
  <rect x="${iconX}" y="${iconY}" width="${iconW}" height="${iconH}" rx="${iconR}" fill="none" stroke="white" stroke-width="1.5"/>
  <rect x="${iconX}" y="${iconY + iconH * 0.25}" width="${iconW}" height="${iconH * 0.15}" fill="white" opacity="0.6"/>
</svg>`;
}

/**
 * Generate SVG for the payme branded frame.
 *
 * Layout: Blue background -> white rounded card -> QR code
 * Bottom: "payme" text with tilde/smile
 *
 * @param qrDataUrl - Base64 data URL of the QR code PNG
 * @param size - Overall image size in pixels
 */
export function paymeSvg(qrDataUrl: string, size: number = 400): string {
  const outerPadding = Math.round(size * 0.06);
  const innerPadding = Math.round(size * 0.06);
  const bottomBarHeight = Math.round(size * 0.12);
  const totalHeight = size + bottomBarHeight;
  const outerRadius = Math.round(size * 0.05);
  const cardRadius = Math.round(size * 0.04);

  const cardX = outerPadding;
  const cardY = outerPadding;
  const cardW = size - 2 * outerPadding;
  const cardH = size - outerPadding + bottomBarHeight * 0.3;

  const qrX = outerPadding + innerPadding;
  const qrY = outerPadding + innerPadding;
  const qrSize = size - 2 * (outerPadding + innerPadding);

  const fontSize = Math.round(size * 0.07);
  const textX = size / 2;
  const textY = size - outerPadding + bottomBarHeight * 0.1;

  // Tilde/smile under "payme"
  const smileY = textY + Math.round(fontSize * 0.3);
  const smileW = Math.round(fontSize * 1.2);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}">
  <!-- Blue background -->
  <rect width="${size}" height="${totalHeight}" rx="${outerRadius}" fill="#1a56db"/>

  <!-- White card -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}"
        rx="${cardRadius}" fill="white"/>

  <!-- QR code image -->
  <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>

  <!-- payme text -->
  <text x="${textX}" y="${textY}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#1a1a1a">payme</text>

  <!-- Smile/tilde curve -->
  <path d="M ${textX - smileW / 2} ${smileY} Q ${textX} ${smileY + Math.round(fontSize * 0.35)} ${textX + smileW / 2} ${smileY}"
        fill="none" stroke="#1a1a1a" stroke-width="${Math.max(2, Math.round(size * 0.006))}" stroke-linecap="round"/>
</svg>`;
}
