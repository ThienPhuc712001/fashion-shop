import express from 'express';
const router = express.Router();
import {
  createMomoPayment,
  handleMomoIPN,
  createVNPayPayment,
  handleVNPayIPN
} from '../controllers/payments.controller';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimit';

// Momo
router.post('/momo/create', authenticate, paymentLimiter,
  body('order_id').isString(),
  body('amount').isFloat({ min: 1 }),
  body('order_info').optional().isString(),
  createMomoPayment
);

router.post('/momo/ipn', paymentLimiter, handleMomoIPN);

router.get('/momo/return', (req, res) => {
  res.send(`
    <html>
      <head><title>Payment Result</title></head>
      <body>
        <h1>Payment processing...</h1>
        <script>
          window.location.href = '/payment/success?status=' + (new URLSearchParams(window.location.search).get('resultCode') === '0' ? 'success' : 'failed');
        </script>
      </body>
    </html>
  `);
});

// VNPay
router.post('/vnpay/create', authenticate, paymentLimiter,
  body('order_id').isString(),
  body('amount').isFloat({ min: 1 }),
  createVNPayPayment
);

router.post('/vnpay/ipn', paymentLimiter, handleVNPayIPN);

router.get('/vnpay/return', (req, res) => {
  res.send(`
    <html>
      <head><title>Payment Result</title></head>
      <body>
        <h1>Processing VNPay...</h1>
        <script>
          const params = new URLSearchParams(window.location.search);
          window.location.href = '/payment/success?' + params.toString();
        </script>
      </body>
    </html>
  `);
});

router.get('/success', (req, res) => {
  res.send(`
    <html>
      <head><title>Payment Complete</title></head>
      <body>
        <h1>Payment Complete</h1>
        <p>Thank you for your order! You can close this window and return to the app.</p>
      </body>
    </html>
  `);
});

export default router;
