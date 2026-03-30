import { Router } from 'express';
import { createPayment, momoCallback, vnpayReturn, vnpayIpn } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
// Tạo URL thanh toán (cần auth)
router.post('/create', authenticate, createPayment);
// Momo IPN (callback từ Momo)
router.post('/momo/callback', momoCallback);
// VNPay return (user redirect về FE)
router.get('/vnpay/return', vnpayReturn);
// VNPay IPN (callback từ VNPay)
router.post('/vnpay/ipn', vnpayIpn);
export default router;
