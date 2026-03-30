import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import { body } from 'express-validator';
import shippingService from '../services/shipping.service';
import { authenticate } from '../middleware/auth';

// GET /api/shipping/rates?carrier=ghn&weight=1000&province=...
router.get('/rates', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { carrier, weight = 1000, province, district, ward } = req.query;

    if (!carrier) {
      return res.status(400).json({
        success: false,
        error: 'Carrier is required'
      });
    }

    const destination: any = {
      province: province as string,
      district: district as string,
      ward: ward as string,
      street_address: ''
    };

    const weightNum = Number(weight);
    const orderValue = 0;

    const rates = await shippingService.getRates(
      carrier as string,
      destination,
      weightNum,
      orderValue
    );

    res.json({
      success: true,
      data: rates
    });
  } catch (err: any) {
    next(err);
  }
});

// POST /api/shipping/create-shipment (admin)
router.post('/create-shipment', authenticate, [
  body('carrier').isString(),
  body('order_id').isString(),
  body('order_number').isString(),
  body('customer_name').isString(),
  body('phone').isString(),
  body('address').isObject(),
  body('address.province').isString(),
  body('address.district').isString(),
  body('address.ward').isString(),
  body('address.street_address').isString(),
  body('weight_grams').isInt({ min: 1 })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { carrier, order_id, order_number, customer_name, phone, address, weight_grams, cod_amount } = req.body;

    const shipment = await shippingService.createShipment(carrier, {
      order_id,
      order_number,
      customer_name,
      phone,
      address,
      weight_grams,
      cod_amount
    });

    res.status(201).json({
      success: true,
      data: shipment
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipping/track?carrier=ghn&tracking_number=...
router.get('/track', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { carrier, tracking_number } = req.query;

    if (!carrier || !tracking_number) {
      return res.status(400).json({
        success: false,
        error: 'Carrier and tracking_number are required'
      });
    }

    const tracking = await shippingService.track(
      carrier as string,
      tracking_number as string
    );

    res.json({
      success: true,
      data: tracking
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipping/carriers
router.get('/carriers', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: shippingService.getAvailableCarriers()
  });
});

export default router;
