import { createPaymentService } from '../services/payment.service';
import db from '../config/database';
const paymentService = createPaymentService({
    momo: {
        merchantId: process.env.MOMO_MERCHANT_ID || 'MOMO_TEST',
        accessKey: process.env.MOMO_ACCESS_KEY || 'access_key',
        secretKey: process.env.MOMO_SECRET_KEY || 'secret_key',
        redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3002/checkout/success',
        notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:9877/api/payment/momo/callback'
    },
    vnpay: {
        tmnCode: process.env.VNP_TMN_CODE || 'VNPAY_TEST',
        hashSecret: process.env.VNP_HASH_SECRET || 'hash_secret',
        redirectUrl: process.env.VNP_REDIRECT_URL || 'http://localhost:3002/checkout/success',
        notifyUrl: process.env.VNP_NOTIFY_URL || 'http://localhost:9877/api/payment/vnpay/callback'
    }
});
// POST /api/payment/create
export const createPayment = async (req, res, next) => {
    try {
        const { orderId, method } = req.body;
        const user = req.user; // from auth middleware
        // Get order
        const order = await db.get(`SELECT o.*, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [orderId]);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Check ownership (if logged in)
        if (user && user.id !== order.user_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const amount = order.total;
        const orderInfo = `Order #${order.order_number}`;
        let paymentUrl = '';
        if (method === 'momo') {
            const result = paymentService.momo.createPayment(orderId, amount, orderInfo);
            paymentUrl = result.paymentUrl;
        }
        else if (method === 'vnpay') {
            const result = paymentService.vnpay.createPayment(orderId, amount, orderInfo);
            paymentUrl = result.paymentUrl;
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }
        // Update order with payment_url if not set
        await db.run(`UPDATE orders SET payment_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'pending'`, [paymentUrl, orderId]);
        res.json({ success: true, data: { paymentUrl } });
    }
    catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment', error: error.message });
    }
};
// Momo callback (notify)
export const momoCallback = async (req, res, next) => {
    try {
        const params = req.body;
        const isValid = paymentService.momo.verifyCallback(params);
        if (!isValid) {
            return res.status(400).send('Invalid signature');
        }
        const { orderId, resultCode, message, transId } = params;
        const status = resultCode === '0' ? 'paid' : 'failed';
        // Update order payment status
        await db.run(`UPDATE orders SET payment_status = ?, payment_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, transId, orderId]);
        // Respond to Momo
        res.send('OK');
    }
    catch (error) {
        console.error('Momo callback error:', error);
        res.status(500).send('Error');
    }
};
// VNPay return (user redirects back)
export const vnpayReturn = async (req, res, next) => {
    try {
        const params = req.query;
        const isValid = paymentService.vnpay.verifyCallback(params);
        if (!isValid) {
            return res.status(400).send('Invalid signature');
        }
        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus, vnp_Amount } = params;
        const orderId = vnp_TxnRef;
        const status = vnp_TransactionStatus === '00' ? 'paid' : 'failed';
        // Update order payment status
        await db.run(`UPDATE orders SET payment_status = ?, payment_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, vnp_TxnRef, orderId]);
        // Redirect to FE success page
        res.redirect(`http://localhost:3002/checkout/success?orderId=${orderId}&payment=${status}`);
    }
    catch (error) {
        console.error('VNPay return error:', error);
        res.status(500).send('Error');
    }
};
// VNPay IPN (callback)
export const vnpayIpn = async (req, res, next) => {
    try {
        const params = req.query;
        const isValid = paymentService.vnpay.verifyCallback(params);
        if (!isValid) {
            return res.status(400).send('Invalid signature');
        }
        const { vnp_TxnRef, vnp_TransactionStatus } = params;
        const orderId = vnp_TxnRef;
        const status = vnp_TransactionStatus === '00' ? 'paid' : 'failed';
        await db.run(`UPDATE orders SET payment_status = ?, payment_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, vnp_TxnRef, orderId]);
        res.send('OK');
    }
    catch (error) {
        console.error('VNPay IPN error:', error);
        res.status(500).send('Error');
    }
};
