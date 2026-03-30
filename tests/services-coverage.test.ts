import { jest } from '@jest/globals';

// Mock database module before importing services
const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
  close: jest.fn(),
  exec: jest.fn(),
};

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: mockDb,
}));

// Now import services
import * as Payment from '../src/services/payment.service';
import * as Email from '../src/services/email.service';
import * as Search from '../src/services/search.service';
import * as Metrics from '../src/services/metrics.service';
import * as Webhook from '../src/services/webhook.service';
import * as ShippingTax from '../src/services/shipping-tax.service';

describe('Service Coverage Boost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Service', () => {
    it('createMomoPayment', async () => {
      const result = await Payment.createMomoPayment({
        id: 'oid1',
        order_number: 'ORD001',
        total: 100000,
        user: { email: 't@t.com', full_name: 'T' },
      } as any);
      expect(result).toHaveProperty('payUrl');
    });

    it('verifyMomoPayment success', async () => {
      const result = await Payment.verifyMomoPayment({ resultCode: '0' } as any);
      expect(result.success).toBe(true);
    });

    it('verifyMomoPayment failure', async () => {
      const result = await Payment.verifyMomoPayment({ resultCode: '100' } as any);
      expect(result.success).toBe(false);
    });

    it('createVNPayPayment', async () => {
      const result = await Payment.createVNPayPayment({
        id: 'oid1',
        order_number: 'ORD001',
        total: 100000,
      } as any);
      expect(result).toHaveProperty('paymentUrl');
    });

    it('verifyVNPayPayment success', async () => {
      const result = await Payment.verifyVNPayPayment({ vnp_ResponseCode: '00' } as any);
      expect(result.success).toBe(true);
    });
  });

  describe('Email Service', () => {
    it('sendOrderConfirmation', async () => {
      const result = await Email.sendOrderConfirmation({
        order_number: 'ORD001',
        total: 100000,
        user: { email: 't@t.com', full_name: 'T' },
        items: [],
      } as any);
      expect(result.to).toBe('t@t.com');
    });

    it('sendPasswordReset', async () => {
      const result = await Email.sendPasswordReset({ email: 't@t.com' } as any, 'token');
      expect(result.to).toBe('t@t.com');
    });

    it('sendPromotionalEmail', async () => {
      const result = await Email.sendPromotionalEmail({ email: 't@t.com' } as any, 'Subj', 'Body');
      expect(result.subject).toBe('Subj');
    });
  });

  describe('Search Service', () => {
    it('searchProducts', async () => {
      mockDb.all.mockResolvedValue([{ id: '1', name: 'Test', base_price: 100000 }]);
      const result = await Search.searchProducts('q', { limit: 5 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('searchAutocomplete', async () => {
      mockDb.all.mockResolvedValue([{ text: 'áo', type: 'product' }]);
      const result = await Search.searchAutocomplete('q');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Metrics Service', () => {
    it('getSystemMetrics', async () => {
      const result = await Metrics.getSystemMetrics();
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
    });

    it('getRequestMetrics', async () => {
      const result = await Metrics.getRequestMetrics();
      expect(result.totalRequests).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('resetMetrics', async () => {
      await Metrics.resetMetrics();
      const result = await Metrics.getRequestMetrics();
      expect(result.totalRequests).toBe(0);
    });
  });

  describe('Webhook Service', () => {
    it('createWebhook', async () => {
      mockDb.run.mockReturnValue({ lastID: 1, changes: 1 });
      const result = await Webhook.createWebhook({
        name: 'Test',
        url: 'https://ex.com',
        events: ['order.created'],
        secret: 'sec',
      } as any);
      expect(result.id).toBeDefined();
    });

    it('listWebhooks', async () => {
      mockDb.all.mockResolvedValue([{ id: '1' }]);
      const result = await Webhook.listWebhooks();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deleteWebhook', async () => {
      mockDb.run.mockReturnValue({ changes: 1 });
      const result = await Webhook.deleteWebhook('id1');
      expect(result).toBe(true);
    });
  });

  describe('ShippingTax Service', () => {
    it('calculateShippingFee standard', async () => {
      const result = await ShippingTax.calculateShippingFee({
        subtotal: 1000000,
        shipping_address: { province: 'Hanoi' },
      }, 'standard');
      expect(typeof result).toBe('number');
    });

    it('getShippingMethods', async () => {
      const result = await ShippingTax.getShippingMethods({ province: 'Hanoi' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('calculateTax 10%', async () => {
      const result = await ShippingTax.calculateTax(1000000, 'VND');
      expect(result).toBe(100000);
    });
  });
});
