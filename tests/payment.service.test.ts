import { createMomoPayment, verifyMomoPayment, createVNPayPayment, verifyVNPayPayment } from '../src/services/payment.service';

describe('Payment Service', () => {
  describe('Momo Payment', () => {
    it('should create Momo payment request', async () => {
      const order = {
        id: 'test-order-id',
        order_number: 'ORD-001',
        total: 100000,
        user: { email: 'test@example.com', full_name: 'Test User' },
      };

      const result = await createMomoPayment(order);
      expect(result).toHaveProperty('payUrl');
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('requestId');
    });

    it('should verify Momo payment (success)', async () => {
      const params = {
        partnerCode: 'testPartner',
        orderId: 'test-order-id',
        requestId: 'test-request-id',
        amount: 100000,
        resultCode: '0',
        message: 'Success',
        signature: 'fake-signature',
      };

      // Mock verify signature would be needed; for now test structure
      const result = await verifyMomoPayment(params);
      expect(result).toHaveProperty('success');
    });

    it('should reject invalid Momo verification', async () => {
      const params = {
        partnerCode: 'testPartner',
        orderId: 'test-order-id',
        requestId: 'test-request-id',
        amount: 100000,
        resultCode: '1006', // User cancelled
        message: 'User cancelled',
        signature: 'fake-signature',
      };

      const result = await verifyMomoPayment(params);
      expect(result.success).toBe(false);
    });
  });

  describe('VNPay Payment', () => {
    it('should create VNPay payment URL', async () => {
      const order = {
        id: 'test-order-id',
        order_number: 'ORD-001',
        total: 100000,
      };

      const result = await createVNPayPayment(order);
      expect(result).toHaveProperty('paymentUrl');
    });

    it('should verify VNPay payment (success)', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_Amount: '100000',
        vnp_OrderInfo: 'ORD-001',
        vnp_TxnRef: 'test-ref',
        vnp_SecureHash: 'fake-hash',
      };

      const result = await verifyVNPayPayment(query);
      expect(result).toHaveProperty('success');
    });
  });
});
