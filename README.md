# payme-qr

Generate QR codes for Slovak bank payments.

Supported formats:
- **PAY by square**: the legacy binary format used by current Slovak banking apps
- **Payment Link Standard v2.0**: the newer URL-based standard from the Slovak Banking Association

| PAY by square | payme (v2.0) | Custom template |
|:---:|:---:|:---:|
| ![PAY by square](examples/pay-by-square-p2p.png) | ![payme](examples/payme-p2p.png) | ![Custom template](examples/custom-branded.png) |

## Installation

```bash
npm install payme-qr
```

Requirements:
- Node.js `>=18`
- ESM environment (`"type": "module"` or native ESM imports)

## Quick Start

```ts
import {
  generateBySquareQrBrandedPng,
  generateBySquareQrDataUrl,
  generatePaymentLink,
} from 'payme-qr'

const paymentData = {
  iban: 'SK6807200002891987426353',
  creditorName: 'Alice Payee',
  amount: 8.59,
  currencyCode: 'EUR',
}

// PAY by square branded QR (works with current Slovak banking apps)
const brandedPng = await generateBySquareQrBrandedPng(paymentData, { width: 400 })

// Plain PAY by square QR (no frame)
const bySquareDataUrl = await generateBySquareQrDataUrl(paymentData)

// Payment Link Standard v2.0 URL
const paymentLink = generatePaymentLink(paymentData)
```

## Public API

### Core Types

| Type | Purpose |
|------|---------|
| `PaymentData` | Shared payment payload input |
| `PaymentLinkOptions` | Payment Link routing/context options |
| `QrRenderOptions` | Width and error-correction settings |
| `BySquareOptions` | PAY by square encoding version |
| `BrandedRenderOptions` | QR render options plus `brandedTemplate` |
| `PaymentLinkQrOptions` | `PaymentLinkOptions & QrRenderOptions` |
| `BySquareQrOptions` | `BySquareOptions & QrRenderOptions` |
| `BrandedPaymentLinkQrOptions` | Payment Link branded options |
| `BrandedBySquareQrOptions` | PAY by square branded options |
| `BrandedTemplate` | Custom SVG frame function |

### Payment Link Standard v2.0

These functions work with the Payment Link URL format.

| Function | Signature | Returns |
|----------|-----------|---------|
| `generatePaymentLink` | `(data, options?: PaymentLinkOptions)` | `string` |
| `generateQrPng` | `(data, options?: PaymentLinkQrOptions)` | `Promise<Buffer>` |
| `generateQrDataUrl` | `(data, options?: PaymentLinkQrOptions)` | `Promise<string>` |

### PAY by square

These functions work with the legacy PAY by square encoding.

| Function | Signature | Returns |
|----------|-----------|---------|
| `generateBySquareString` | `(data, options?: BySquareOptions)` | `string` |
| `generateBySquareQrPng` | `(data, options?: BySquareQrOptions)` | `Promise<Buffer>` |
| `generateBySquareQrDataUrl` | `(data, options?: BySquareQrOptions)` | `Promise<string>` |

### Branded QR Output

These functions render visual frames around the QR code.

Important:
- branded `Svg` functions return **SVG containers that embed a PNG QR image**, not true vector QR module paths
- default branded error correction is **`H`** to improve scan tolerance with visual framing
- custom templates can still produce non-scannable output if they shrink the QR too much or remove quiet zones

| Function | Signature | Returns |
|----------|-----------|---------|
| `generateBySquareQrBrandedSvg` | `(data, options?: BrandedBySquareQrOptions)` | `Promise<string>` |
| `generateBySquareQrBrandedPng` | `(data, options?: BrandedBySquareQrOptions)` | `Promise<Buffer>` |
| `generateBySquareQrBrandedDataUrl` | `(data, options?: BrandedBySquareQrOptions)` | `Promise<string>` |
| `generateQrBrandedSvg` | `(data, options?: BrandedPaymentLinkQrOptions)` | `Promise<string>` |
| `generateQrBrandedPng` | `(data, options?: BrandedPaymentLinkQrOptions)` | `Promise<Buffer>` |
| `generateQrBrandedDataUrl` | `(data, options?: BrandedPaymentLinkQrOptions)` | `Promise<string>` |

Built-in SVG templates exported for reuse:
- `payBySquareSvg(qrDataUrl, size)`
- `paymeSvg(qrDataUrl, size)`

## `PaymentData`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `iban` | `string` | Yes | IBAN, validated with regex + mod-97 checksum |
| `creditorName` | `string` | Yes | Beneficiary name, max 70 chars, Slovak diacritics normalized |
| `amount` | `number` | Depends on format/type | Positive amount, max 2 decimals, max 9 formatted chars |
| `currencyCode` | `string` | No | Only `EUR` is accepted |
| `dueDate` | `string \| Date` | No | Real calendar date only; `YYYYMMDD` or valid `Date` |
| `paymentIdentification` | `string` | Depends on format/type | Max 35 chars; cannot be empty when provided |
| `message` | `string` | No | Max 140 chars, Slovak diacritics normalized |

## Payment Types

For Payment Link generation:

| Type | Use case | Mandatory fields | Optional fields | Auto-detected when |
|------|----------|------------------|-----------------|--------------------|
| `/p/` | Person-to-person | `IBAN`, `CN` | `AM`, `CC`, `DT`, `PI`, `MSG` | Amount present but no PI |
| `/q/` | Static QR / donation | `IBAN`, `CN` | `AM`, `CC`, `PI`, `MSG` | Only IBAN + CN |
| `/m/` | Dynamic merchant QR | `IBAN`, `CN`, `AM`, `CC`, `PI` | `MSG` | Amount + non-empty PI |
| `/e/` | E-commerce | `IBAN`, `CN`, `AM`, `CC`, `PI` | `MSG` | Must be specified explicitly |

Notes:
- `/m/` and `/e/` are non-editable payment orders in the banking app
- `/p/` and `/q/` are editable
- `dueDate` is included only for `/p/`

## Slovak Payment Symbols

You can pass Slovak payment symbols inside `paymentIdentification`:

```ts
paymentIdentification: '/VS2546874464/SS2019568456/KS1118'
paymentIdentification: '/VS1234567890'
paymentIdentification: 'QRab29e346f1d841c8a95a63d857490818'
```

Rules:
- symbol payloads must be ordered as `/VS.../SS.../KS...`
- malformed symbol payloads are rejected
- non-symbol identifiers are preserved as free-form references where supported

## Validation Behavior

The library validates inputs before generating output:

- **IBAN**: regex + ISO 13616 mod-97 checksum
- **Amount**: must be finite, positive, and have **at most 2 decimal places**
- **Currency**: only `EUR`
- **Due date**: must be a real calendar date
- **Payment identification**: max 35 chars, non-empty, no `//`, no trailing slash
- **Message / creditor name**: Slovak diacritics normalized before length checks

## Examples

### Branded PAY by square QR

```ts
import { generateBySquareQrBrandedPng } from 'payme-qr'
import { writeFileSync } from 'node:fs'

const png = await generateBySquareQrBrandedPng(
  {
    iban: 'SK6807200002891987426353',
    creditorName: 'Alice Payee',
    amount: 8.59,
    currencyCode: 'EUR',
    message: 'Thank you for lunch',
  },
  {
    width: 400,
    bySquareVersion: '1.1.0',
  },
)

writeFileSync('payment-qr.png', png)
```

![PAY by square branded](examples/pay-by-square-p2p.png)

### Branded payme QR

```ts
import { generateQrBrandedPng } from 'payme-qr'

const png = await generateQrBrandedPng(
  {
    iban: 'SK6807200002891987426353',
    creditorName: 'Alice Payee',
    amount: 8.59,
    currencyCode: 'EUR',
  },
  {
    type: 'p',
    width: 400,
  },
)
```

![payme branded](examples/payme-p2p.png)

### Custom Templates

Override the built-in brand frame with your own SVG template function:

```ts
import { generateBySquareQrBrandedPng } from 'payme-qr'
import type { BrandedTemplate } from 'payme-qr'

const myTemplate: BrandedTemplate = (qrDataUrl, size) => {
  const height = size + 60

  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${height}">
      <rect width="${size}" height="${height}" rx="16" fill="#1e293b"/>
      <rect x="12" y="12" width="${size - 24}" height="${size - 24}" rx="8" fill="white"/>
      <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="20" y="20" width="${size - 40}" height="${size - 40}"/>
      <text x="${size / 2}" y="${size + 35}" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16">
        My Custom Brand
      </text>
    </svg>`
}

const png = await generateBySquareQrBrandedPng(
  {
    iban: 'SK6807200002891987426353',
    creditorName: 'Alice Payee',
    amount: 8.59,
    currencyCode: 'EUR',
  },
  {
    width: 400,
    brandedTemplate: myTemplate,
  },
)
```

![Custom branded](examples/custom-branded.png)

Custom template guardrails:
- keep a visible quiet zone around the QR code
- avoid shrinking the QR area too aggressively
- prefer `errorCorrectionLevel: 'H'` for branded output
- remember the template receives a **PNG QR data URL**, not vector modules

### PAY by square Version Compatibility

```ts
// Maximum compatibility with older apps
await generateBySquareQrPng(data, { bySquareVersion: '1.0.0' })

// Default
await generateBySquareQrPng(data, { bySquareVersion: '1.1.0' })

// Newest spec
await generateBySquareQrPng(data, { bySquareVersion: '1.2.0' })
```

### E-commerce With Slovak Payment Symbols

```ts
import { generateBySquareQrBrandedPng } from 'payme-qr'

const png = await generateBySquareQrBrandedPng(
  {
    iban: 'SK6807200002891987426353',
    creditorName: 'The Best e-shops ltd',
    amount: 200.30,
    currencyCode: 'EUR',
    paymentIdentification: '/VS2546874464/SS2019568456/KS1118',
    message: 'my e-shop, Kosice',
  },
  {
    width: 400,
  },
)
```

### Embed In HTML

```ts
const dataUrl = await generateBySquareQrBrandedDataUrl({
  iban: 'SK6807200002891987426353',
  creditorName: 'Alice Payee',
  amount: 15,
})

const html = `<img src="${dataUrl}" alt="Payment QR code" />`
```

## Standard Reference

**PAY by square**
- binary format: tab-separated data -> CRC32 -> LZMA1 compression -> base32hex
- generated via [`bysquare`](https://www.npmjs.com/package/bysquare)

**Payment Link Standard v2.0**
- URL format: `https://payme.sk/2/{type}/PME?{query}`
- supported currency: EUR only

## License

MIT
