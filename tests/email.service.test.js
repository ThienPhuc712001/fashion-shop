import { sendOrderConfirmation, sendPasswordReset, sendPromotionalEmail } from '../src/services/email.service';
describe('Email Service', () => {
    const mockOrder = {
        order_number: 'ORD-001',
        total: 100000,
        user: { full_name: 'Test User', email: 'test@example.com' },
        items: [
            { product_name: 'Test Product', quantity: 2, subtotal: 200000 },
        ],
    };
    const mockResetToken = 'reset-token-123';
    describe('sendOrderConfirmation', () => {
        it('should prepare order confirmation email data', async () => {
            const result = await sendOrderConfirmation(mockOrder);
            expect(result).toHaveProperty('to', mockOrder.user.email);
            expect(result.subject).toContain('xác nhận');
            expect(result.html).toContain(mockOrder.order_number);
        });
    });
    describe('sendPasswordReset', () => {
        it('should prepare password reset email', async () => {
            const result = await sendPasswordReset(mockOrder.user, mockResetToken);
            expect(result).toHaveProperty('to', mockOrder.user.email);
            expect(result.html).toContain(mockResetToken);
        });
    });
    describe('sendPromotionalEmail', () => {
        it('should prepare promotional email', async () => {
            const result = await sendPromotionalEmail(mockOrder.user, 'Khuyến mãi đặc biệt', 'Nội dung khuyến mãi');
            expect(result).toHaveProperty('to', mockOrder.user.email);
            expect(result.subject).toBe('Khuyến mãi đặc biệt');
        });
    });
});
