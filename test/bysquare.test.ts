import { describe, it, expect } from 'vitest';
import {
  generateBySquareString,
  generateBySquareQrPng,
  generateBySquareQrDataUrl,
} from '../src/bysquare.js';

describe('generateBySquareString', () => {
  it('generates a non-empty encoded string', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
      amount: 8.59,
      currencyCode: 'EUR',
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Default version 1.1.0 -> header starts with "04"
    expect(result.startsWith('04')).toBe(true);
  });

  it('generates v1.0.0 encoded string when specified', () => {
    const result = generateBySquareString(
      {
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice Payee',
        amount: 8.59,
        currencyCode: 'EUR',
      },
      { bySquareVersion: '1.0.0' },
    );

    expect(result.startsWith('00')).toBe(true);
  });

  it('generates v1.1.0 encoded string when specified', () => {
    const result = generateBySquareString(
      {
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice Payee',
        amount: 8.59,
        currencyCode: 'EUR',
      },
      { bySquareVersion: '1.1.0' },
    );

    expect(result.startsWith('04')).toBe(true);
  });

  it('generates v1.2.0 encoded string when specified', () => {
    const result = generateBySquareString(
      {
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice Payee',
        amount: 8.59,
        currencyCode: 'EUR',
      },
      { bySquareVersion: '1.2.0' },
    );

    expect(result.startsWith('08')).toBe(true);
  });

  it('generates different strings for different payment data', () => {
    const str1 = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice',
      amount: 10,
    });

    const str2 = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice',
      amount: 20,
    });

    expect(str1).not.toBe(str2);
  });

  it('works with minimal data (IBAN + creditor name only)', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Hope charity',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('works with Slovak payment symbols', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'The Best e-shops ltd',
      amount: 200.30,
      currencyCode: 'EUR',
      paymentIdentification: '/VS2546874464/SS2019568456/KS1118',
      message: 'my e-shop, Kosice',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('rejects malformed Slovak symbol payloads', () => {
    expect(() =>
      generateBySquareString({
        iban: 'SK6807200002891987426353',
        creditorName: 'Shop',
        amount: 100,
        paymentIdentification: '/VS123/ABC',
      }),
    ).toThrow();
  });

  it('rejects out-of-order Slovak symbol payloads', () => {
    expect(() =>
      generateBySquareString({
        iban: 'SK6807200002891987426353',
        creditorName: 'Shop',
        amount: 100,
        paymentIdentification: '/KS1118/VS1',
      }),
    ).toThrow();
  });

  it('works with non-symbol payment identification', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Shop',
      amount: 100,
      paymentIdentification: 'QRab29e346f1d841c8a95a63d857490818',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('works with due date', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
      amount: 8.59,
      dueDate: '20280430',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('works with Date object for due date', () => {
    const result = generateBySquareString({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
      amount: 8.59,
      dueDate: new Date(2028, 3, 30),
    });

    expect(result.length).toBeGreaterThan(0);
  });
});

describe('generateBySquareQrPng', () => {
  it('returns a Buffer with PNG data', async () => {
    const buffer = await generateBySquareQrPng({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
      amount: 8.59,
      currencyCode: 'EUR',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });
});

describe('generateBySquareQrDataUrl', () => {
  it('returns a data URL string', async () => {
    const dataUrl = await generateBySquareQrDataUrl({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
      amount: 8.59,
      currencyCode: 'EUR',
    });

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('works with full payment data', async () => {
    const dataUrl = await generateBySquareQrDataUrl({
      iban: 'SK6807200002891987426353',
      creditorName: 'The Best Cafes ltd',
      amount: 200.30,
      currencyCode: 'EUR',
      paymentIdentification: '/VS2546874464/SS2019568456/KS1118',
      message: 'Cafe on the corner Zilina',
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
