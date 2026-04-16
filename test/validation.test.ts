import { describe, it, expect } from 'vitest';
import {
  validateIban,
  validateAmount,
  validateCurrencyCode,
  validateDueDate,
  validatePaymentIdentification,
  validateMessage,
  validateCreditorName,
  normalizeDiacritics,
} from '../src/validation.js';

describe('validateIban', () => {
  it('accepts a valid Slovak IBAN', () => {
    expect(validateIban('SK6807200002891987426353')).toBe('SK6807200002891987426353');
  });

  it('strips spaces and uppercases', () => {
    expect(validateIban('SK68 0720 0002 8919 8742 6353')).toBe('SK6807200002891987426353');
  });

  it('rejects invalid format', () => {
    expect(() => validateIban('12345')).toThrow('Invalid IBAN');
  });

  it('rejects too short', () => {
    expect(() => validateIban('SK')).toThrow('Invalid IBAN');
  });

  it('accepts German IBAN', () => {
    expect(validateIban('DE89370400440532013000')).toBe('DE89370400440532013000');
  });

  it('rejects structurally valid IBAN with bad checksum', () => {
    expect(() => validateIban('SK0000000000000000000000')).toThrow('Checksum validation failed');
  });

  it('rejects IBAN with wrong check digits', () => {
    // SK68 is valid, SK99 is not for this account number
    expect(() => validateIban('SK9907200002891987426353')).toThrow('Checksum validation failed');
  });
});

describe('validateAmount', () => {
  it('formats integer amount', () => {
    expect(validateAmount(200)).toBe('200');
  });

  it('formats decimal amount', () => {
    expect(validateAmount(200.30)).toBe('200.3');
  });

  it('formats amount with two decimals', () => {
    expect(validateAmount(8.59)).toBe('8.59');
  });

  it('rejects negative amount', () => {
    expect(() => validateAmount(-1)).toThrow('not be negative');
  });

  it('rejects zero amount', () => {
    expect(() => validateAmount(0)).toThrow('greater than zero');
  });

  it('rejects amount exceeding max field length', () => {
    expect(() => validateAmount(99999999.99)).toThrow('exceeds maximum');
  });

  it('accepts max integer that fits 9 chars', () => {
    expect(validateAmount(999999999)).toBe('999999999');
  });

  it('accepts max decimal that fits 9 chars', () => {
    expect(validateAmount(999999.99)).toBe('999999.99');
  });

  it('rejects amounts with more than two decimal places', () => {
    expect(() => validateAmount(1.999)).toThrow('at most 2 decimal places');
  });

  it('rejects NaN values', () => {
    expect(() => validateAmount(Number.NaN)).toThrow('finite number');
  });

  it('rejects Infinity values', () => {
    expect(() => validateAmount(Number.POSITIVE_INFINITY)).toThrow('finite number');
  });
});

describe('validateCurrencyCode', () => {
  it('accepts EUR', () => {
    expect(validateCurrencyCode('EUR')).toBe('EUR');
  });

  it('accepts lowercase eur', () => {
    expect(validateCurrencyCode('eur')).toBe('EUR');
  });

  it('rejects non-EUR', () => {
    expect(() => validateCurrencyCode('USD')).toThrow('Only "EUR"');
  });
});

describe('validateDueDate', () => {
  it('formats Date object', () => {
    expect(validateDueDate(new Date(2025, 3, 30))).toBe('20250430');
  });

  it('accepts YYYYMMDD string', () => {
    expect(validateDueDate('20250430')).toBe('20250430');
  });

  it('strips dashes from date string', () => {
    expect(validateDueDate('2025-04-30')).toBe('20250430');
  });

  it('rejects invalid date string', () => {
    expect(() => validateDueDate('april 30')).toThrow('Invalid due date');
  });

  it('rejects impossible calendar dates', () => {
    expect(() => validateDueDate('20250231')).toThrow('Invalid due date');
  });

  it('rejects invalid Date objects', () => {
    expect(() => validateDueDate(new Date('invalid'))).toThrow('Invalid due date');
  });
});

describe('validatePaymentIdentification', () => {
  it('accepts valid Slovak payment symbols', () => {
    const pi = '/VS2546874464/SS2019568456/KS1118';
    expect(validatePaymentIdentification(pi)).toBe(pi);
  });

  it('accepts partial Slovak payment symbols (VS only)', () => {
    expect(validatePaymentIdentification('/VS1234567890')).toBe('/VS1234567890');
  });

  it('accepts VS + SS without KS', () => {
    expect(validatePaymentIdentification('/VS123/SS456')).toBe('/VS123/SS456');
  });

  it('accepts QR transaction ID', () => {
    expect(validatePaymentIdentification('QRab29e346f1d841c8a95a63d857490818'))
      .toBe('QRab29e346f1d841c8a95a63d857490818');
  });

  it('rejects string starting with slash if not Slovak symbol format', () => {
    expect(() => validatePaymentIdentification('/test')).toThrow('does not match Slovak');
  });

  it('rejects string ending with slash', () => {
    expect(() => validatePaymentIdentification('test/')).toThrow('must not end');
  });

  it('rejects double slashes', () => {
    expect(() => validatePaymentIdentification('test//value')).toThrow('must not contain');
  });

  it('rejects string exceeding 35 chars', () => {
    expect(() => validatePaymentIdentification('a'.repeat(36))).toThrow('exceeds maximum');
  });

  it('rejects empty payment identification', () => {
    expect(() => validatePaymentIdentification('')).toThrow('must not be empty');
  });
});

describe('validateMessage', () => {
  it('accepts valid message', () => {
    expect(validateMessage('Thank you for lunch.')).toBe('Thank you for lunch.');
  });

  it('normalizes Slovak diacritics in message', () => {
    expect(validateMessage('Cafe on the corner, Zilina')).toBe('Cafe on the corner, Zilina');
    expect(validateMessage('Kaviaren na rohu, Zilina')).toBe('Kaviaren na rohu, Zilina');
  });

  it('rejects message exceeding 140 chars', () => {
    expect(() => validateMessage('a'.repeat(141))).toThrow('exceeds maximum');
  });
});

describe('validateCreditorName', () => {
  it('accepts valid name', () => {
    expect(validateCreditorName('Alice Payee')).toBe('Alice Payee');
  });

  it('normalizes Slovak diacritics', () => {
    expect(validateCreditorName('Ján Kováč')).toBe('Jan Kovac');
  });

  it('rejects name exceeding 70 chars', () => {
    expect(() => validateCreditorName('a'.repeat(71))).toThrow('exceeds maximum');
  });
});

describe('normalizeDiacritics', () => {
  it('replaces Slovak characters', () => {
    expect(normalizeDiacritics('čšžťďľňáéíóúýôäŕĺ')).toBe('csztdlnaeiouyoarl');
  });

  it('leaves ASCII unchanged', () => {
    expect(normalizeDiacritics('Hello World')).toBe('Hello World');
  });
});
