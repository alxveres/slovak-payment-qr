import { describe, it, expect } from 'vitest';
import { generatePaymentLink } from '../src/payment-link.js';

describe('generatePaymentLink', () => {
  describe('person-to-person (type /p/)', () => {
    it('generates link with all fields', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Alice Payee',
          amount: 8.59,
          currencyCode: 'EUR',
          dueDate: '20280430',
          message: 'Thank you for lunch',
        },
        { type: 'p' },
      );

      expect(url).toBe(
        'https://payme.sk/2/p/PME?IBAN=SK6807200002891987426353&AM=8.59&CC=EUR&DT=20280430&MSG=Thank+you+for+lunch&CN=Alice+Payee',
      );
    });

    it('generates minimal p2p link (IBAN + CN only)', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Alice Payee',
        },
        { type: 'p' },
      );

      expect(url).toBe(
        'https://payme.sk/2/p/PME?IBAN=SK6807200002891987426353&CN=Alice+Payee',
      );
    });

    it('generates link with amount and currency', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Alice Payee',
          amount: 8.59,
          currencyCode: 'EUR',
        },
        { type: 'p' },
      );

      expect(url).toBe(
        'https://payme.sk/2/p/PME?IBAN=SK6807200002891987426353&AM=8.59&CC=EUR&CN=Alice+Payee',
      );
    });
  });

  describe('e-commerce (type /e/)', () => {
    it('generates e-commerce link matching standard example', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'The Best e-shops ltd',
          amount: 200.30,
          currencyCode: 'EUR',
          paymentIdentification: '/VS2546874464/SS2019568456/KS1118',
          message: 'my e-shop, Kosice',
        },
        { type: 'e' },
      );

      expect(url).toBe(
        'https://payme.sk/2/e/PME?IBAN=SK6807200002891987426353&AM=200.3&CC=EUR&PI=%2FVS2546874464%2FSS2019568456%2FKS1118&MSG=my+e-shop%2C+Kosice&CN=The+Best+e-shops+ltd',
      );
    });

    it('throws if amount is missing for e-commerce', () => {
      expect(() =>
        generatePaymentLink(
          {
            iban: 'SK6807200002891987426353',
            creditorName: 'Shop',
            paymentIdentification: 'QR123',
          },
          { type: 'e' },
        ),
      ).toThrow('Amount is mandatory');
    });

    it('throws if payment identification is missing for e-commerce', () => {
      expect(() =>
        generatePaymentLink(
          {
            iban: 'SK6807200002891987426353',
            creditorName: 'Shop',
            amount: 10,
          },
          { type: 'e' },
        ),
      ).toThrow('Payment identification is mandatory');
    });

    it('throws if payment identification is empty for e-commerce', () => {
      expect(() =>
        generatePaymentLink(
          {
            iban: 'SK6807200002891987426353',
            creditorName: 'Shop',
            amount: 10,
            paymentIdentification: '',
          },
          { type: 'e' },
        ),
      ).toThrow('must not be empty');
    });
  });

  describe('static QR (type /q/)', () => {
    it('generates minimal static QR link matching standard example', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Hope charity',
        },
        { type: 'q' },
      );

      expect(url).toBe(
        'https://payme.sk/2/q/PME?IBAN=SK6807200002891987426353&CN=Hope+charity',
      );
    });

    it('generates static QR with optional message', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'The Best Cafes td',
          message: 'Cafe on the corner Trnava',
        },
        { type: 'q' },
      );

      expect(url).toBe(
        'https://payme.sk/2/q/PME?IBAN=SK6807200002891987426353&MSG=Cafe+on+the+corner+Trnava&CN=The+Best+Cafes+td',
      );
    });
  });

  describe('dynamic QR (type /m/)', () => {
    it('generates dynamic QR link matching standard example', () => {
      const url = generatePaymentLink(
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

      expect(url).toContain('https://payme.sk/2/m/PME?');
      expect(url).toContain('IBAN=SK6807200002891987426353');
      expect(url).toContain('AM=200.3');
      expect(url).toContain('CC=EUR');
      expect(url).toContain('PI=QRab29e346f1d841c8a95a63d857490818');
      expect(url).toContain('CN=The+Best+Cafes+ltd');
      expect(url).toContain('MSG=Cafe+on+the+corner+Zilina');
    });

    it('throws if payment identification is empty for dynamic QR', () => {
      expect(() =>
        generatePaymentLink(
          {
            iban: 'SK6807200002891987426353',
            creditorName: 'The Best Cafes ltd',
            amount: 200.3,
            paymentIdentification: '',
          },
          { type: 'm' },
        ),
      ).toThrow('must not be empty');
    });
  });

  describe('auto-detection', () => {
    it('auto-detects /q/ when only IBAN and CN', () => {
      const url = generatePaymentLink({
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice',
      });

      expect(url).toContain('/2/q/PME?');
    });

    it('auto-detects /m/ when amount + PI present', () => {
      const url = generatePaymentLink({
        iban: 'SK6807200002891987426353',
        creditorName: 'Shop',
        amount: 10,
        paymentIdentification: 'QR123',
      });

      expect(url).toContain('/2/m/PME?');
    });

    it('auto-detects /p/ when amount present but no PI', () => {
      const url = generatePaymentLink({
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice',
        amount: 5,
      });

      expect(url).toContain('/2/p/PME?');
    });

    it('auto-detects /p/ when PI present but no amount', () => {
      const url = generatePaymentLink({
        iban: 'SK6807200002891987426353',
        creditorName: 'Alice',
        paymentIdentification: '/VS1234567890',
      });

      expect(url).toContain('/2/p/PME?');
    });
  });

  describe('options', () => {
    it('uses custom domain', () => {
      const url = generatePaymentLink(
        { iban: 'SK6807200002891987426353', creditorName: 'Alice' },
        { domain: 'pay.example.com', type: 'q' },
      );

      expect(url.startsWith('https://pay.example.com/2/q/')).toBe(true);
    });

    it('uses custom scheme ID', () => {
      const url = generatePaymentLink(
        { iban: 'SK6807200002891987426353', creditorName: 'Alice' },
        { schemeId: 'CUSTOM', type: 'q' },
      );

      expect(url).toContain('/CUSTOM?');
    });
  });

  describe('due date handling', () => {
    it('includes due date for type /p/', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Alice',
          dueDate: '20280430',
        },
        { type: 'p' },
      );

      expect(url).toContain('DT=20280430');
    });

    it('omits due date for type /m/', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Shop',
          amount: 10,
          paymentIdentification: 'QR123',
          dueDate: '20280430',
        },
        { type: 'm' },
      );

      expect(url).not.toContain('DT=');
    });
  });

  describe('URL encoding', () => {
    it('encodes spaces as + in creditor name', () => {
      const url = generatePaymentLink(
        { iban: 'SK6807200002891987426353', creditorName: 'Alice Payee' },
        { type: 'q' },
      );

      expect(url).toContain('CN=Alice+Payee');
    });

    it('encodes slashes in payment identification', () => {
      const url = generatePaymentLink(
        {
          iban: 'SK6807200002891987426353',
          creditorName: 'Shop',
          amount: 10,
          paymentIdentification: '/VS123/SS456/KS0001',
          currencyCode: 'EUR',
        },
        { type: 'e' },
      );

      expect(url).toContain('PI=%2FVS123%2FSS456%2FKS0001');
    });
  });
});
