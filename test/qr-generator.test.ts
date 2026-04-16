import { describe, it, expect } from 'vitest';
import { generateQrPng, generateQrDataUrl } from '../src/qr-generator.js';

describe('generateQrPng', () => {
  it('returns a Buffer with PNG data', async () => {
    const buffer = await generateQrPng({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it('generates different QR codes for different payment data', async () => {
    const buf1 = await generateQrPng({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice',
    });

    const buf2 = await generateQrPng({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice',
      amount: 100,
    });

    expect(buf1.equals(buf2)).toBe(false);
  });
});

describe('generateQrDataUrl', () => {
  it('returns a data URL string', async () => {
    const dataUrl = await generateQrDataUrl({
      iban: 'SK6807200002891987426353',
      creditorName: 'Alice Payee',
    });

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('generates non-empty base64 content', async () => {
    const dataUrl = await generateQrDataUrl({
      iban: 'SK6807200002891987426353',
      creditorName: 'Hope charity',
    });

    const base64Part = dataUrl.split(',')[1];
    expect(base64Part.length).toBeGreaterThan(0);
  });

  it('works with full payment data', async () => {
    const dataUrl = await generateQrDataUrl(
      {
        iban: 'SK6807200002891987426353',
        creditorName: 'The Best Cafes ltd',
        amount: 200.30,
        currencyCode: 'EUR',
        paymentIdentification: 'QRab29e346f1d841c8a95a63d857490818',
        message: 'Cafe on the corner Zilina',
      },
      { type: 'm' },
    );

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
