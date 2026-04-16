import type { PaymentData, PaymentLinkOptions, PaymentType } from './types.js';
import {
  validateIban,
  validateAmount,
  validateCurrencyCode,
  validateDueDate,
  validatePaymentIdentification,
  validateMessage,
  validateCreditorName,
} from './validation.js';

const DEFAULT_DOMAIN = 'payme.sk';
const DEFAULT_SCHEME_ID = 'PME';
const VERSION = '2';

/**
 * Encode a value for use in Payment Link query string.
 * Per the standard: spaces encoded as '+', other special chars as %XX.
 */
function encodeQueryValue(value: string): string {
  // First encode with encodeURIComponent, then replace %20 with +
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/**
 * Auto-detect payment type from provided fields.
 */
function detectType(data: PaymentData): PaymentType {
  const hasAmount = data.amount != null;
  const hasPI = data.paymentIdentification != null && data.paymentIdentification.length > 0;

  // If amount + payment identification present -> dynamic QR
  if (hasAmount && hasPI) {
    return 'm';
  }

  // If only IBAN + CN (no amount, no PI) -> static QR
  if (!hasAmount && !hasPI) {
    return 'q';
  }

  // Default to person-to-person
  return 'p';
}

/**
 * Validate that mandatory fields are present for the given type.
 */
function validateMandatoryFields(data: PaymentData, type: PaymentType): void {
  // IBAN and CN are always mandatory (validated elsewhere)

  if (type === 'm' || type === 'e') {
    if (data.amount == null) {
      throw new Error(`Amount is mandatory for type '${type}'.`);
    }
    if (data.paymentIdentification == null) {
      throw new Error(`Payment identification is mandatory for type '${type}'.`);
    }
    // Currency code defaults to EUR, so no need to require it explicitly
  }
}

/**
 * Generate a Payment Link URL from payment data.
 *
 * @param data - Payment data (IBAN, creditor name, amount, etc.)
 * @param options - Optional settings (type, domain, schemeId)
 * @returns Payment Link URL string
 *
 * @example
 * ```ts
 * const url = generatePaymentLink({
 *   iban: 'SK6807200002891987426353',
 *   creditorName: 'Alice Payee',
 *   amount: 8.59,
 *   currencyCode: 'EUR',
 * });
 * // https://payme.sk/2/p/PME?IBAN=SK6807200002891987426353&AM=8.59&CC=EUR&CN=Alice+Payee
 * ```
 */
export function generatePaymentLink(data: PaymentData, options?: PaymentLinkOptions): string {
  const domain = options?.domain ?? DEFAULT_DOMAIN;
  const schemeId = options?.schemeId ?? DEFAULT_SCHEME_ID;

  // Determine type
  const type = options?.type ?? detectType(data);

  // Validate mandatory fields for the type
  validateMandatoryFields(data, type);

  // Validate and normalize all provided fields
  const iban = validateIban(data.iban);
  const creditorName = validateCreditorName(data.creditorName);

  // Build query parameters in a defined order
  const params: Array<[string, string]> = [];

  params.push(['IBAN', iban]);

  if (data.amount != null) {
    const amount = validateAmount(data.amount);
    params.push(['AM', amount]);
  }

  if (data.amount != null || data.currencyCode != null) {
    const cc = validateCurrencyCode(data.currencyCode ?? 'EUR');
    params.push(['CC', cc]);
  }

  // Due date: only for type /p/, omitted for /m/, /e/, /q/
  if (data.dueDate != null) {
    if (type !== 'p') {
      // Per the standard, DT is omitted for /m/, /e/, /q/
      // We silently skip it rather than throwing
    } else {
      const dt = validateDueDate(data.dueDate);
      params.push(['DT', dt]);
    }
  }

  if (data.paymentIdentification != null) {
    const pi = validatePaymentIdentification(data.paymentIdentification);
    params.push(['PI', encodeQueryValue(pi)]);
  }

  if (data.message != null) {
    const msg = validateMessage(data.message);
    params.push(['MSG', encodeQueryValue(msg)]);
  }

  params.push(['CN', encodeQueryValue(creditorName)]);

  // Build query string - values for PI, MSG, CN are already URL-encoded above
  const queryString = params.map(([key, value]) => `${key}=${value}`).join('&');

  return `https://${domain}/${VERSION}/${type}/${schemeId}?${queryString}`;
}
