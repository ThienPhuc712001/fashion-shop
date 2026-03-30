import express from 'express';
const router = express.Router();
import { listAddresses, getAddress, createAddress, updateAddress, deleteAddress } from '../controllers/addresses.controller';
import { param, body } from 'express-validator';
import { authenticate } from '../middleware/auth';
// Validation
const addressValidation = [
    body('label').optional().isString(),
    body('recipient_name').isString().notEmpty(),
    body('phone').isString().notEmpty(),
    body('province').isString().notEmpty(),
    body('district').isString().notEmpty(),
    body('ward').isString().notEmpty(),
    body('street_address').isString().notEmpty(),
    body('is_default').optional().isBoolean()
];
// All routes require authentication
router.use(authenticate);
// Routes
router.get('/', listAddresses);
router.get('/:id', [param('id').isString()], getAddress);
router.post('/', addressValidation, createAddress);
router.put('/:id', [
    param('id').isString(),
    ...addressValidation
], updateAddress);
router.delete('/:id', [param('id').isString()], deleteAddress);
export default router;
