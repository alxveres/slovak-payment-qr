/**
 * Payment types as defined in the Payment Link Standard v2.0, section 3.3.2.
 *
 * - `p` - person-to-person payment
 * - `q` - static QR code at POI (small merchants, donations)
 * - `m` - dynamic QR code at POI (large merchants, non-editable)
 * - `e` - e-commerce
 */
export type PaymentType = 'p' | 'q' | 'm' | 'e';

/**
 * Payment data to encode into a Payment Link / QR code.
 * Based on Payment Link Standard v2.0, section 3.4.
 */
export interface PaymentData {
  /** International Bank Account Number. Required. Max 34 chars. Validated with mod-97 checksum. */
  iban: string;

  /** Beneficiary name of the payment recipient. Required. Max 70 chars. */
  creditorName: string;

  /**
   * Amount in EUR. Float with max 2 decimal places.
   * Field length limited to 9 characters (e.g. max 999999.99 with decimals, or 999999999 as integer).
   */
  amount?: number;

  /** Currency code (ISO 4217). Only "EUR" is valid in v2. Defaults to "EUR" when amount is provided. */
  currencyCode?: string;

  /** Due date. Only used for type /p/. Format YYYYMMDD or a Date object. */
  dueDate?: string | Date;

  /**
   * Payment identification (EndToEndId). Max 35 chars.
   * For Slovak payment symbols use format: /VS{1,10}/SS{1,10}/KS{1,4}
   * or a non-symbol free-form identifier such as a QR transaction ID.
   */
  paymentIdentification?: string;

  /** Message for recipient. Max 140 chars. Slovak diacritics normalized automatically. */
  message?: string;
}

/**
 * PAY by square specification version.
 * - `'1.0.0'` - Original spec (2013). Widest compatibility.
 * - `'1.1.0'` - Added beneficiary name/address fields (2015). Good compatibility.
 * - `'1.2.0'` - Beneficiary name required (2025). Newest, some apps may not support it yet.
 */
export type BySquareVersion = '1.0.0' | '1.1.0' | '1.2.0';

/**
 * QR error correction level.
 * - `'L'` - ~7% recovery
 * - `'M'` - ~15% recovery (default, per Payment Link Standard v2.0 section 5.3)
 * - `'Q'` - ~25% recovery
 * - `'H'` - ~30% recovery
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * A custom SVG template function for branded QR codes.
 * Receives the QR code as a data URL and the image size, returns an SVG string.
 */
export type BrandedTemplate = (qrDataUrl: string, size: number) => string;

/** Payment Link routing and context options. */
export interface PaymentLinkOptions {
  /**
   * Payment type. If omitted, auto-detected from provided fields:
   * - amount + paymentIdentification -> 'm' (dynamic QR)
   * - only IBAN + creditorName (no amount, no PI) -> 'q' (static QR)
   * - otherwise -> 'p' (person-to-person)
   */
  type?: PaymentType;

  /** Payment Link domain. Default: "payme.sk" */
  domain?: string;

  /** Payment Link Scheme ID. Default: "PME" */
  schemeId?: string;
}

/** Shared QR bitmap rendering options. */
export interface QrRenderOptions {
  /** QR code image width in pixels. Default: 300. */
  width?: number;

  /**
   * QR error correction level. Default: "M" for plain QR rendering.
   * For branded QR codes with visual frames, consider using "H".
   */
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

/** PAY by square encoding options. */
export interface BySquareOptions {
  /**
   * PAY by square specification version. Default: "1.1.0".
   * Use "1.0.0" for maximum compatibility with older banking apps.
   */
  bySquareVersion?: BySquareVersion;
}

/** Additional options for branded QR rendering. */
export interface BrandedRenderOptions extends QrRenderOptions {
  /**
   * Custom SVG template function for branded QR code generation.
   * When provided, overrides the default PAY by square or payme template.
   */
  brandedTemplate?: BrandedTemplate;
}

/** Options for plain Payment Link QR rendering. */
export type PaymentLinkQrOptions = PaymentLinkOptions & QrRenderOptions;

/** Options for plain PAY by square QR rendering. */
export type BySquareQrOptions = BySquareOptions & QrRenderOptions;

/** Options for branded Payment Link QR rendering. */
export type BrandedPaymentLinkQrOptions = PaymentLinkOptions & BrandedRenderOptions;

/** Options for branded PAY by square QR rendering. */
export type BrandedBySquareQrOptions = BySquareOptions & BrandedRenderOptions;
