import { Resvg } from '@resvg/resvg-js';
import QRCode from 'qrcode';
import type { ErrorCorrectionLevel } from './types.js';

export const DEFAULT_QR_WIDTH = 300;
export const DEFAULT_BRANDED_QR_WIDTH = 400;
export const DEFAULT_QR_ERROR_CORRECTION: ErrorCorrectionLevel = 'M';
export const DEFAULT_BRANDED_QR_ERROR_CORRECTION: ErrorCorrectionLevel = 'H';

type RenderQrOptions = {
  width: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  margin?: number;
};

export async function renderQrPng(content: string, options: RenderQrOptions): Promise<Buffer> {
  return QRCode.toBuffer(content, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? DEFAULT_QR_ERROR_CORRECTION,
    width: options.width,
    margin: options.margin ?? 2,
    type: 'png',
  });
}

export async function renderQrDataUrl(content: string, options: RenderQrOptions): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? DEFAULT_QR_ERROR_CORRECTION,
    width: options.width,
    margin: options.margin ?? 2,
    type: 'image/png',
  });
}

export function renderSvgToPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });
  return Buffer.from(resvg.render().asPng());
}
