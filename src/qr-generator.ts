import type { PaymentData, PaymentLinkQrOptions } from './types.js';
import { generatePaymentLink } from './payment-link.js';
import {
  DEFAULT_QR_WIDTH,
  renderQrDataUrl,
  renderQrPng,
} from './qr-render.js';

/**
 * Generate a QR code as a PNG Buffer from payment data.
 *
 * The QR code encodes the Payment Link URL and uses error correction level M
 * (15% data restoration) as required by the Payment Link Standard v2.0, section 5.3.
 *
 * @param data - Payment data
 * @param options - QR code options (width, type, domain, schemeId)
 * @returns PNG image as a Buffer
 */
export async function generateQrPng(
  data: PaymentData,
  options?: PaymentLinkQrOptions,
): Promise<Buffer> {
  const url = generatePaymentLink(data, options);
  return renderQrPng(url, {
    width: options?.width ?? DEFAULT_QR_WIDTH,
    errorCorrectionLevel: options?.errorCorrectionLevel,
  });
}

/**
 * Generate a QR code as a data URL (base64-encoded PNG) from payment data.
 *
 * Returns a string like `data:image/png;base64,...` suitable for embedding
 * in HTML `<img>` tags.
 *
 * @param data - Payment data
 * @param options - QR code options (width, type, domain, schemeId, errorCorrectionLevel)
 * @returns Data URL string
 */
export async function generateQrDataUrl(
  data: PaymentData,
  options?: PaymentLinkQrOptions,
): Promise<string> {
  const url = generatePaymentLink(data, options);
  return renderQrDataUrl(url, {
    width: options?.width ?? DEFAULT_QR_WIDTH,
    errorCorrectionLevel: options?.errorCorrectionLevel,
  });
}
