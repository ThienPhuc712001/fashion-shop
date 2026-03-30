import crypto from 'crypto';
import querystring from 'querystring';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
// Helper: Generate Momo signature
const generateMomoSignature = (params, secretKey) => {
    const rawSignature = [
        'accessKey=' + params.accessKey,
        'amount=' + params.amount,
        'extraData=' + (params.extraData || ''),
        'ipnUrl=' + params.ipnUrl,
        'orderId=' + params.orderId,
        'orderInfo=' + params.orderInfo,
        'partnerCode=' + params.partnerCode,
        'redirectUrl=' + params.redirectUrl,
        'requestId=' + params.requestId,
        'requestType=' + params.requestType
    ].join('&') + secretKey;
    return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
};
// Helper: Generate VNPay signature
const generateVNPaySignature = (params, secretKey) => {
    const sortedKeys = Object.keys(params).sort();
    const rawData = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    return crypto.createHmac('sha512', secretKey).update(rawData).digest('hex');
};
export const createMomoPayment = async (req, res, next) => {
    try {
        const { order_id, amount, order_info } = req.body;
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;
        if (!partnerCode || !accessKey || !secretKey) {
            throw new AppError('Payment configuration missing', 500);
        }
        // Verify order exists and belongs to user
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        const userId = req.userId;
        if (order.user_id !== userId) {
            throw new AppError('Not authorized', 403);
        }
        // Prepare request
        const requestId = crypto.randomBytes(16).toString('hex');
        const amountStr = Math.round(Number(amount)).toString();
        const params = {
            partnerCode,
            accessKey,
            requestId,
            amount: amountStr,
            orderId: order.order_number, // Momo yêu cầu orderId là số, dùng order_number
            orderInfo: order_info || `Payment for order ${order.order_number}`,
            redirectUrl,
            ipnUrl,
            requestType: 'captureWallet',
            extraData: Buffer.from(JSON.stringify({ order_id })).toString('base64') // store internal order_id
        };
        const signature = generateMomoSignature(params, secretKey);
        // Build URL
        const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
        const queryString = querystring.stringify(Object.assign(Object.assign({}, params), { signature }));
        res.json({
            success: true,
            data: {
                payment_url: `${endpoint}?${queryString}`,
                order_id: order.id,
                order_number: order.order_number
            }
        });
    }
    catch (err) {
        next(err);
    }
};
export const handleMomoIPN = async (req, res, next) => {
    try {
        const data = req.body;
        const secretKey = process.env.MOMO_SECRET_KEY;
        // Verify signature
        const receivedSignature = data.signature;
        delete data.signature;
        const rawSignature = [
            'accessKey=' + data.accessKey,
            'amount=' + data.amount,
            'extraData=' + (data.extraData || ''),
            'message=' + (data.message || ''),
            'orderId=' + data.orderId,
            'orderInfo=' + data.orderInfo,
            'partnerCode=' + data.partnerCode,
            'requestId=' + data.requestId,
            'responseTime=' + data.responseTime,
            'resultCode=' + data.resultCode,
            'transId=' + data.transId
        ].join('&') + secretKey;
        const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
        if (receivedSignature !== expectedSignature) {
            throw new AppError('Invalid signature', 400);
        }
        // Extract our internal order_id from extraData
        let internalOrderId = null;
        if (data.extraData) {
            try {
                const extra = JSON.parse(Buffer.from(data.extraData, 'base64').toString());
                internalOrderId = extra.order_id;
            }
            catch (e) { }
        }
        if (!internalOrderId) {
            throw new AppError('Missing order_id in extraData', 400);
        }
        // Update order payment status
        const orderStatus = data.resultCode === 0 ? 'completed' : 'failed';
        await db.run(`UPDATE orders 
       SET payment_status = ?, 
           payment_gateway = 'momo',
           payment_gateway_txn_id = ?,
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [orderStatus, data.transId, orderStatus === 'completed' ? 'paid' : 'pending', internalOrderId]);
        // Respond with 200 OK to acknowledge
        res.json({
            partnerCode: data.partnerCode,
            orderId: data.orderId,
            requestId: data.requestId,
            resultCode: data.resultCode,
            message: data.message
        });
    }
    catch (err) {
        next(err);
    }
};
export const createVNPayPayment = async (req, res, next) => {
    try {
        const { order_id, amount } = req.body;
        const tmnCode = process.env.VNPAY_TMN_CODE;
        const hashSecret = process.env.VNPAY_HASH_SECRET;
        const vnpayUrl = process.env.VNPAY_URL;
        const returnUrl = process.env.VNPAY_RETURN_URL;
        const ipnUrl = process.env.VNPAY_IPN_URL;
        if (!tmnCode || !hashSecret || !vnpayUrl || !returnUrl || !ipnUrl) {
            throw new AppError('VNPay configuration incomplete', 500);
        }
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        const userId = req.userId;
        if (order.user_id !== userId) {
            throw new AppError('Not authorized', 403);
        }
        const now = new Date();
        const vnp_OrderInfo = `Thanh toan don hang ${order.order_number}`;
        const vnp_TransactionNo = crypto.randomBytes(8).toString('hex');
        const vnp_IpAddr = req.ip || '127.0.0.1';
        const params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Amount: Math.round(Number(amount) * 100), // VNPay uses smallest unit
            vnp_CurrCode: 'VND',
            vnp_TxnRef: order.order_number,
            vnp_OrderInfo: vnp_OrderInfo,
            vnp_OrderType: 'other',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: vnp_IpAddr,
            vnp_CreateDate: now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
            vnp_IpnUrl: ipnUrl
        };
        // Sort and generate signature
        const signature = generateVNPaySignature(params, hashSecret);
        const paymentUrl = `${vnpayUrl}/vnppay-payment/vnpay/payment.vnet?${querystring.stringify(Object.assign(Object.assign({}, params), { vnp_SecureHash: signature }))}`;
        // Store transaction reference in order (optional)
        await db.run('UPDATE orders SET payment_gateway_txn_id = ?, status = ?, payment_status = ? WHERE id = ?', [vnp_TransactionNo, 'pending', 'pending', order_id]);
        res.json({
            success: true,
            data: {
                payment_url: paymentUrl,
                order_id: order.id,
                order_number: order.order_number
            }
        });
    }
    catch (err) {
        next(err);
    }
};
export const handleVNPayIPN = async (req, res, next) => {
    try {
        const data = req.body;
        const hashSecret = process.env.VNPAY_HASH_SECRET;
        const vnp_SecureHash = data.vnp_SecureHash;
        delete data.vnp_SecureHash;
        delete data.vnp_SecureHashType;
        const signature = generateVNPaySignature(data, hashSecret);
        if (signature !== vnp_SecureHash) {
            throw new AppError('Invalid VNPay signature', 400);
        }
        const orderNumber = data.vnp_TxnRef;
        const transactionNo = data.vnp_TransactionNo;
        const responseCode = data.vnp_ResponseCode;
        // Find order by order_number
        const order = await db.get('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        const isSuccess = responseCode === '00';
        const status = isSuccess ? 'paid' : 'failed';
        await db.run(`UPDATE orders 
       SET payment_status = ?, 
           payment_gateway = 'vnpay',
           payment_gateway_txn_id = ?,
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [status, transactionNo, isSuccess ? 'paid' : 'pending', order.id]);
        // Return RspCode=00 for VNPay to confirm receipt
        res.json({
            RspCode: '00',
            Message: 'Confirmed'
        });
    }
    catch (err) {
        next(err);
    }
};
