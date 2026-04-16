const IBAN_PATTERN = /^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{1,30}$/;

/**
 * Slovak diacritics to ASCII mapping for normalization.
 */
const DIACRITICS_MAP: Record<string, string> = {
  'á': 'a', 'ä': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'í': 'i',
  'ĺ': 'l', 'ľ': 'l', 'ň': 'n', 'ó': 'o', 'ô': 'o', 'ŕ': 'r',
  'š': 's', 'ť': 't', 'ú': 'u', 'ý': 'y', 'ž': 'z',
  'Á': 'A', 'Ä': 'A', 'Č': 'C', 'Ď': 'D', 'É': 'E', 'Í': 'I',
  'Ĺ': 'L', 'Ľ': 'L', 'Ň': 'N', 'Ó': 'O', 'Ô': 'O', 'Ŕ': 'R',
  'Š': 'S', 'Ť': 'T', 'Ú': 'U', 'Ý': 'Y', 'Ž': 'Z',
};

/**
 * Normalize Slovak diacritics to ASCII equivalents.
 */
export function normalizeDiacritics(input: string): string {
  return input.replace(/[^\x00-\x7F]/g, (char) => DIACRITICS_MAP[char] ?? char);
}

/**
 * Perform ISO 13616 mod-97 IBAN checksum validation.
 * Returns true if the IBAN checksum is valid.
 */
function isValidIbanChecksum(iban: string): boolean {
  // Move the first 4 characters to the end
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericStr = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      // A-Z -> 10-35
      numericStr += (code - 55).toString();
    } else {
      numericStr += char;
    }
  }

  // Calculate mod 97 using string-based arithmetic (handles large numbers)
  let remainder = 0;
  for (const digit of numericStr) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }

  return remainder === 1;
}

/**
 * Validate and normalize IBAN. Strips spaces, uppercases, validates pattern and checksum.
 */
export function validateIban(iban: string): string {
  const normalized = iban.replace(/\s/g, '').toUpperCase();
  if (!IBAN_PATTERN.test(normalized)) {
    throw new Error(
      `Invalid IBAN "${iban}". Must match pattern [A-Z]{2}[0-9]{2}[a-zA-Z0-9]{1,30}.`
    );
  }
  if (!isValidIbanChecksum(normalized)) {
    throw new Error(
      `Invalid IBAN "${iban}". Checksum validation failed (mod-97).`
    );
  }
  return normalized;
}

/**
 * Validate and format amount. Returns string with dot decimal separator, max 2 decimals.
 * Field length is limited to 9 characters per the spec (max value depends on decimal places:
 * up to 999999.99 with decimals, or 999999999 as integer).
 */
export function validateAmount(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error(`Amount must be a finite number. Got: ${amount}`);
  }
  if (amount < 0) {
    throw new Error(`Amount must not be negative. Got: ${amount}`);
  }
  if (amount === 0) {
    throw new Error(`Amount must be greater than zero.`);
  }

  if (Math.round(amount * 100) !== amount * 100) {
    throw new Error(`Amount must have at most 2 decimal places. Got: ${amount}`);
  }

  const result = amount.toFixed(2).replace(/\.?0+$/, '') || '0';

  if (result.length > 9) {
    throw new Error(`Amount "${result}" exceeds maximum field length of 9 characters.`);
  }

  return result;
}

/**
 * Validate currency code. Only "EUR" is valid in v2.
 */
export function validateCurrencyCode(cc: string): string {
  const normalized = cc.toUpperCase();
  if (normalized !== 'EUR') {
    throw new Error(`Invalid currency code "${cc}". Only "EUR" is supported in v2.`);
  }
  return normalized;
}

/**
 * Validate and format due date. Returns YYYYMMDD string.
 */
export function validateDueDate(date: string | Date): string {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `Invalid due date "${String(date)}". Must be a valid Date object.`
      );
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // String: must be YYYYMMDD
  const dateStr = date.replace(/[-/]/g, '');
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error(
      `Invalid due date "${date}". Must be in YYYYMMDD format or a Date object.`
    );
  }

  const year = Number.parseInt(dateStr.slice(0, 4), 10);
  const month = Number.parseInt(dateStr.slice(4, 6), 10);
  const day = Number.parseInt(dateStr.slice(6, 8), 10);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new Error(`Invalid due date "${date}". Must be a real calendar date.`);
  }

  return dateStr;
}

/**
 * Pattern for Slovak payment symbols: /VS{0,10}/SS{0,10}/KS{0,4}
 * All parts are optional but when present must follow this format.
 */
const SK_PAYMENT_SYMBOLS_PATTERN = /^\/VS\d{0,10}(\/SS\d{0,10})?(\/KS\d{0,4})?$/;

/**
 * Validate payment identification. Max 35 chars, no '//' (double slashes).
 * Leading '/' is allowed for Slovak payment symbol format (/VS.../SS.../KS...).
 * Must not end with '/'.
 */
export function validatePaymentIdentification(pi: string): string {
  if (pi.length === 0) {
    throw new Error(`Payment identification must not be empty.`);
  }
  if (pi.length > 35) {
    throw new Error(`Payment identification exceeds maximum length of 35 characters.`);
  }
  if (pi.includes('//')) {
    throw new Error(
      `Payment identification must not contain '//'. Got: "${pi}"`
    );
  }
  if (pi.endsWith('/')) {
    throw new Error(
      `Payment identification must not end with '/'. Got: "${pi}"`
    );
  }
  // Allow leading '/' only for Slovak payment symbol format
  if (pi.startsWith('/') && !SK_PAYMENT_SYMBOLS_PATTERN.test(pi)) {
    throw new Error(
      `Payment identification starts with '/' but does not match Slovak payment symbol format (/VS.../SS.../KS...). Got: "${pi}"`
    );
  }
  return pi;
}

/**
 * Validate message. Max 140 chars. Normalizes Slovak diacritics to ASCII.
 */
export function validateMessage(msg: string): string {
  const normalized = normalizeDiacritics(msg);
  if (normalized.length > 140) {
    throw new Error(`Message exceeds maximum length of 140 characters. Got: ${normalized.length}`);
  }
  return normalized;
}

/**
 * Validate creditor name. Max 70 chars. Normalizes Slovak diacritics.
 */
export function validateCreditorName(name: string): string {
  const normalized = normalizeDiacritics(name);
  if (normalized.length > 70) {
    throw new Error(
      `Creditor name exceeds maximum length of 70 characters. Got: ${normalized.length}`
    );
  }
  return normalized;
}
