import type {
  BrandedBySquareQrOptions,
  BrandedPaymentLinkQrOptions,
  ErrorCorrectionLevel,
  PaymentData,
} from './types.js';
import { generateBySquareString } from './bysquare.js';
import { generatePaymentLink } from './payment-link.js';
import { payBySquareSvg, paymeSvg } from './branded-templates.js';
import {
  DEFAULT_BRANDED_QR_ERROR_CORRECTION,
  DEFAULT_BRANDED_QR_WIDTH,
  renderQrDataUrl,
  renderSvgToPng,
} from './qr-render.js';

const INTERNAL_QR_SCALE = 2;

async function brandedQrDataUrl(
  content: string,
  size: number,
  ecLevel: ErrorCorrectionLevel,
): Promise<string> {
  return renderQrDataUrl(content, {
    width: size * INTERNAL_QR_SCALE,
    errorCorrectionLevel: ecLevel,
    margin: 1,
  });
}

export async function generateBySquareQrBrandedSvg(
  data: PaymentData,
  options?: BrandedBySquareQrOptions,
): Promise<string> {
  const size = options?.width ?? DEFAULT_BRANDED_QR_WIDTH;
  const ecLevel = options?.errorCorrectionLevel ?? DEFAULT_BRANDED_QR_ERROR_CORRECTION;
  const qrString = generateBySquareString(data, options);
  const qrDataUrl = await brandedQrDataUrl(qrString, size, ecLevel);

  if (options?.brandedTemplate) {
    return options.brandedTemplate(qrDataUrl, size);
  }

  return payBySquareSvg(qrDataUrl, size);
}

export async function generateBySquareQrBrandedPng(
  data: PaymentData,
  options?: BrandedBySquareQrOptions,
): Promise<Buffer> {
  const size = options?.width ?? DEFAULT_BRANDED_QR_WIDTH;
  const svg = await generateBySquareQrBrandedSvg(data, options);
  return renderSvgToPng(svg, size);
}

export async function generateBySquareQrBrandedDataUrl(
  data: PaymentData,
  options?: BrandedBySquareQrOptions,
): Promise<string> {
  const png = await generateBySquareQrBrandedPng(data, options);
  return `data:image/png;base64,${png.toString('base64')}`;
}

export async function generateQrBrandedSvg(
  data: PaymentData,
  options?: BrandedPaymentLinkQrOptions,
): Promise<string> {
  const size = options?.width ?? DEFAULT_BRANDED_QR_WIDTH;
  const ecLevel = options?.errorCorrectionLevel ?? DEFAULT_BRANDED_QR_ERROR_CORRECTION;
  const url = generatePaymentLink(data, options);
  const qrDataUrl = await brandedQrDataUrl(url, size, ecLevel);

  if (options?.brandedTemplate) {
    return options.brandedTemplate(qrDataUrl, size);
  }

  return paymeSvg(qrDataUrl, size);
}

export async function generateQrBrandedPng(
  data: PaymentData,
  options?: BrandedPaymentLinkQrOptions,
): Promise<Buffer> {
  const size = options?.width ?? DEFAULT_BRANDED_QR_WIDTH;
  const svg = await generateQrBrandedSvg(data, options);
  return renderSvgToPng(svg, size);
}

export async function generateQrBrandedDataUrl(
  data: PaymentData,
  options?: BrandedPaymentLinkQrOptions,
): Promise<string> {
  const png = await generateQrBrandedPng(data, options);
  return `data:image/png;base64,${png.toString('base64')}`;
}
