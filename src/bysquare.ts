import { encode, PaymentOptions } from 'bysquare/pay';
import type { DataModel } from 'bysquare/pay';
import { Version } from 'bysquare';
import type { Version as VersionType } from 'bysquare';
import type {
  BySquareOptions,
  BySquareQrOptions,
  BySquareVersion,
  PaymentData,
} from './types.js';
import {
  validateIban,
  validateCreditorName,
  validateMessage,
  validateDueDate,
  validateCurrencyCode,
  validatePaymentIdentification,
} from './validation.js';
import {
  DEFAULT_QR_WIDTH,
  renderQrDataUrl,
  renderQrPng,
} from './qr-render.js';

const VERSION_MAP: Record<BySquareVersion, VersionType> = {
  '1.0.0': Version['1.0.0'],
  '1.1.0': Version['1.1.0'],
  '1.2.0': Version['1.2.0'],
};

const DEFAULT_BYSQUARE_VERSION: BySquareVersion = '1.1.0';
const SLOVAK_SYMBOLS_PATTERN = /^\/VS(?<vs>\d{1,10})(?:\/SS(?<ss>\d{1,10}))?(?:\/KS(?<ks>\d{1,4}))?$/;

/**
 * Parse Slovak payment symbols from paymentIdentification string.
 * Format: /VS{0,10}/SS{0,10}/KS{0,4}
 */
function parsePaymentSymbols(pi: string): {
  variableSymbol?: string;
  specificSymbol?: string;
  constantSymbol?: string;
  rawReference?: string;
} {
  const match = pi.match(SLOVAK_SYMBOLS_PATTERN);

  if (match?.groups) {
    return {
      variableSymbol: match.groups.vs,
      specificSymbol: match.groups.ss,
      constantSymbol: match.groups.ks,
    };
  }

  // Not Slovak symbol format - use as originatorsReferenceInformation
  return { rawReference: pi };
}

/**
 * Convert our PaymentData to bysquare DataModel.
 */
function toBySquareModel(data: PaymentData): DataModel {
  const iban = validateIban(data.iban);
  const creditorName = validateCreditorName(data.creditorName);

  let variableSymbol: string | undefined;
  let specificSymbol: string | undefined;
  let constantSymbol: string | undefined;
  let originatorsReferenceInformation: string | undefined;

  if (data.paymentIdentification) {
    const validatedPaymentIdentification = validatePaymentIdentification(data.paymentIdentification);
    const symbols = parsePaymentSymbols(validatedPaymentIdentification);
    variableSymbol = symbols.variableSymbol;
    specificSymbol = symbols.specificSymbol;
    constantSymbol = symbols.constantSymbol;
    originatorsReferenceInformation = symbols.rawReference;
  }

  let paymentDueDate: string | undefined;
  if (data.dueDate) {
    paymentDueDate = validateDueDate(data.dueDate);
  }

  let currencyCode = 'EUR';
  if (data.currencyCode) {
    currencyCode = validateCurrencyCode(data.currencyCode);
  }

  let paymentNote: string | undefined;
  if (data.message) {
    paymentNote = validateMessage(data.message);
  }

  return {
    payments: [
      {
        type: PaymentOptions.PaymentOrder,
        amount: data.amount,
        currencyCode,
        paymentDueDate,
        variableSymbol,
        constantSymbol,
        specificSymbol,
        originatorsReferenceInformation,
        paymentNote,
        bankAccounts: [{ iban }],
        beneficiary: { name: creditorName },
      },
    ],
  };
}

/**
 * Generate a PAY by square encoded string from payment data.
 *
 * This produces the binary-encoded string (base32hex) that Slovak banking apps
 * expect when scanning a QR code. This is the older format that most banks
 * currently support.
 *
 * @param data - Payment data
 * @returns PAY by square encoded string
 */
export function generateBySquareString(data: PaymentData, options?: BySquareOptions): string {
  const model = toBySquareModel(data);
  const version = VERSION_MAP[options?.bySquareVersion ?? DEFAULT_BYSQUARE_VERSION];
  return encode(model, { deburr: true, version });
}

/**
 * Generate a PAY by square QR code as a PNG Buffer.
 *
 * Uses the PAY by square binary format (LZMA compressed, base32hex encoded)
 * that is compatible with existing Slovak banking apps.
 *
 * @param data - Payment data
 * @param options - QR code options (width)
 * @returns PNG image as a Buffer
 */
export async function generateBySquareQrPng(
  data: PaymentData,
  options?: BySquareQrOptions,
): Promise<Buffer> {
  const qrString = generateBySquareString(data, options);
  return renderQrPng(qrString, {
    width: options?.width ?? DEFAULT_QR_WIDTH,
    errorCorrectionLevel: options?.errorCorrectionLevel,
  });
}

/**
 * Generate a PAY by square QR code as a data URL (base64-encoded PNG).
 *
 * Uses the PAY by square binary format (LZMA compressed, base32hex encoded)
 * that is compatible with existing Slovak banking apps.
 *
 * Returns a string like `data:image/png;base64,...` suitable for embedding
 * in HTML `<img>` tags.
 *
 * @param data - Payment data
 * @param options - QR code options (width, bySquareVersion, errorCorrectionLevel)
 * @returns Data URL string
 */
export async function generateBySquareQrDataUrl(
  data: PaymentData,
  options?: BySquareQrOptions,
): Promise<string> {
  const qrString = generateBySquareString(data, options);
  return renderQrDataUrl(qrString, {
    width: options?.width ?? DEFAULT_QR_WIDTH,
    errorCorrectionLevel: options?.errorCorrectionLevel,
  });
}
