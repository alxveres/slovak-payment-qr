import { describe, it, expect } from 'vitest';
import {
  generateBySquareQrBrandedSvg,
  generateBySquareQrBrandedPng,
  generateBySquareQrBrandedDataUrl,
  generateQrBrandedSvg,
  generateQrBrandedPng,
  generateQrBrandedDataUrl,
} from '../src/branded-qr.js';

const TEST_DATA = {
  iban: 'SK6807200002891987426353',
  creditorName: 'Alice Payee',
  amount: 8.59,
  currencyCode: 'EUR',
};

describe('PAY by square branded', () => {
  it('generates SVG with PAY by square branding', async () => {
    const svg = await generateBySquareQrBrandedSvg(TEST_DATA);

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('PAY');
    expect(svg).toContain('by square');
    expect(svg).toContain('data:image/png;base64,');
  });

  it('generates PNG buffer', async () => {
    const png = await generateBySquareQrBrandedPng(TEST_DATA);

    expect(png).toBeInstanceOf(Buffer);
    expect(png.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
  });

  it('generates data URL', async () => {
    const dataUrl = await generateBySquareQrBrandedDataUrl(TEST_DATA);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('respects width option', async () => {
    const svg = await generateBySquareQrBrandedSvg(TEST_DATA, { width: 600 });
    expect(svg).toContain('width="600"');
  });

  it('respects bySquareVersion option', async () => {
    // Should not throw for any version
    const svg10 = await generateBySquareQrBrandedSvg(TEST_DATA, { bySquareVersion: '1.0.0' });
    const svg11 = await generateBySquareQrBrandedSvg(TEST_DATA, { bySquareVersion: '1.1.0' });
    const svg12 = await generateBySquareQrBrandedSvg(TEST_DATA, { bySquareVersion: '1.2.0' });

    expect(svg10).toContain('<svg');
    expect(svg11).toContain('<svg');
    expect(svg12).toContain('<svg');
  });
});

describe('payme branded', () => {
  it('generates SVG with payme branding', async () => {
    const svg = await generateQrBrandedSvg(TEST_DATA, { type: 'p' });

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('payme');
    expect(svg).toContain('data:image/png;base64,');
  });

  it('generates PNG buffer', async () => {
    const png = await generateQrBrandedPng(TEST_DATA, { type: 'p' });

    expect(png).toBeInstanceOf(Buffer);
    expect(png.length).toBeGreaterThan(0);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
  });

  it('generates data URL', async () => {
    const dataUrl = await generateQrBrandedDataUrl(TEST_DATA, { type: 'p' });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe('custom branded template', () => {
  it('uses custom template for PAY by square branded QR', async () => {
    const customTemplate = (qrDataUrl: string, size: number) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 50}">
        <rect width="${size}" height="${size + 50}" fill="#ff0000"/>
        <image href="${qrDataUrl}" x="10" y="10" width="${size - 20}" height="${size - 20}"/>
        <text x="${size / 2}" y="${size + 30}" text-anchor="middle" fill="white">Custom Brand</text>
      </svg>`;

    const svg = await generateBySquareQrBrandedSvg(TEST_DATA, {
      brandedTemplate: customTemplate,
    });

    expect(svg).toContain('Custom Brand');
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).not.toContain('PAY');
    expect(svg).not.toContain('by square');
  });

  it('uses custom template for payme branded QR', async () => {
    const customTemplate = (qrDataUrl: string, size: number) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="#000"/>
        <image href="${qrDataUrl}" x="20" y="20" width="${size - 40}" height="${size - 40}"/>
      </svg>`;

    const svg = await generateQrBrandedSvg(TEST_DATA, {
      type: 'p',
      brandedTemplate: customTemplate,
    });

    expect(svg).toContain('fill="#000"');
    expect(svg).not.toContain('payme');
  });

  it('generates PNG from custom template', async () => {
    const customTemplate = (qrDataUrl: string, size: number) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="white"/>
        <image href="${qrDataUrl}" x="10" y="10" width="${size - 20}" height="${size - 20}"/>
      </svg>`;

    const png = await generateBySquareQrBrandedPng(TEST_DATA, {
      brandedTemplate: customTemplate,
      width: 300,
    });

    expect(png).toBeInstanceOf(Buffer);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
  });
});
