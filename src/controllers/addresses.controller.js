import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
// GET /api/addresses – list user's addresses
export const listAddresses = async (req, res, next) => {
    try {
        const userId = req.userId;
        const addresses = await db.all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
        res.json({ success: true, data: addresses });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/addresses/:id
export const getAddress = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const address = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
        if (!address) {
            throw new AppError('Address not found', 404);
        }
        res.json({ success: true, data: address });
    }
    catch (err) {
        next(err);
    }
};
// POST /api/addresses
export const createAddress = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { label, recipient_name, phone, province, district, ward, street_address, is_default = false } = req.body;
        if (!recipient_name || !phone || !province || !district || !ward || !street_address) {
            throw new AppError('Missing required address fields', 400);
        }
        const addressId = uuidv4();
        // If is_default, unset other defaults for this user
        if (is_default) {
            await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }
        await db.run(`INSERT INTO addresses (
        id, user_id, label, recipient_name, phone, province, district, ward, street_address, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            addressId,
            userId,
            label || null,
            recipient_name,
            phone,
            province,
            district,
            ward,
            street_address,
            is_default ? 1 : 0
        ]);
        const address = await db.get('SELECT * FROM addresses WHERE id = ?', [addressId]);
        res.status(201).json({
            success: true,
            data: address,
            message: 'Address created'
        });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/addresses/:id
export const updateAddress = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { label, recipient_name, phone, province, district, ward, street_address, is_default } = req.body;
        // Verify ownership
        const existing = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) {
            throw new AppError('Address not found', 404);
        }
        const updates = [];
        const values = [];
        if (label !== undefined) {
            updates.push('label = ?');
            values.push(label);
        }
        if (recipient_name !== undefined) {
            updates.push('recipient_name = ?');
            values.push(recipient_name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (province !== undefined) {
            updates.push('province = ?');
            values.push(province);
        }
        if (district !== undefined) {
            updates.push('district = ?');
            values.push(district);
        }
        if (ward !== undefined) {
            updates.push('ward = ?');
            values.push(ward);
        }
        if (street_address !== undefined) {
            updates.push('street_address = ?');
            values.push(street_address);
        }
        if (is_default !== undefined) {
            if (is_default) {
                // Unset other defaults first
                await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?', [userId, id]);
            }
            updates.push('is_default = ?');
            values.push(is_default ? 1 : 0);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`, values);
        const updated = await db.get('SELECT * FROM addresses WHERE id = ?', [id]);
        res.json({
            success: true,
            data: updated,
            message: 'Address updated'
        });
    }
    catch (err) {
        next(err);
    }
};
// DELETE /api/addresses/:id
export const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const result = await db.run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.changes === 0) {
            throw new AppError('Address not found', 404);
        }
        res.json({
            success: true,
            message: 'Address deleted'
        });
    }
    catch (err) {
        next(err);
    }
};
