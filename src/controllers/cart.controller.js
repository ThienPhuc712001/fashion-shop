import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
// Helper: Get cart session record by token (creates if not exists)
const getOrCreateCartSession = async (sessionToken, userId) => {
    let cartSession;
    if (sessionToken) {
        cartSession = await db.get('SELECT * FROM cart_sessions WHERE session_token = ?', [sessionToken]);
    }
    if (!cartSession && userId) {
        cartSession = await db.get('SELECT * FROM cart_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
    }
    if (!cartSession) {
        // Create new session
        const newId = uuidv4();
        const newToken = uuidv4();
        await db.run('INSERT INTO cart_sessions (id, user_id, session_token) VALUES (?, ?, ?)', [newId, userId, newToken]);
        cartSession = { id: newId, session_token: newToken, user_id: userId };
    }
    return cartSession;
};
export const getCart = async (req, res, next) => {
    var _a;
    try {
        const userId = req.userId || null;
        const sessionToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.cart_session) || req.headers['x-cart-token'];
        const cartSession = await getOrCreateCartSession(sessionToken, userId);
        // Get cart items using cart_session.id (NOT token)
        const cartItems = await db.all(`SELECT ci.*, 
              pv.sku, pv.size, pv.color_name, pv.color_hex, pv.stock_quantity,
              p.name as product_name, p.slug as product_slug,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.cart_session_id = ?`, [cartSession.id]);
        // Calculate subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
        res.json({
            success: true,
            data: {
                cart_session: cartSession.session_token,
                items: cartItems,
                subtotal,
                item_count: cartItems.length
            }
        });
    }
    catch (err) {
        next(err);
    }
};
export const addToCart = async (req, res, next) => {
    var _a;
    try {
        const { variant_id, quantity = 1 } = req.body;
        const userId = req.userId || null;
        const sessionToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.cart_session) || req.headers['x-cart-token'];
        if (!variant_id) {
            throw new AppError('Variant ID is required', 400);
        }
        // Check variant exists and has stock
        const variant = await db.get('SELECT * FROM product_variants WHERE id = ? AND is_available = 1', [variant_id]);
        if (!variant) {
            throw new AppError('Variant not available', 404);
        }
        if (variant.stock_quantity < quantity) {
            throw new AppError(`Only ${variant.stock_quantity} items in stock`, 400);
        }
        // Get or create cart session
        const cartSession = await getOrCreateCartSession(sessionToken, userId);
        // Check if item already in cart
        const existingItem = await db.get('SELECT * FROM cart_items WHERE cart_session_id = ? AND variant_id = ?', [cartSession.id, variant_id]);
        if (existingItem) {
            // Update quantity
            const newQty = existingItem.quantity + quantity;
            if (newQty > variant.stock_quantity) {
                throw new AppError(`Cannot add more. Only ${variant.stock_quantity} items in stock`, 400);
            }
            await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existingItem.id]);
        }
        else {
            // Get product base price
            const product = await db.get('SELECT base_price FROM products WHERE id = (SELECT product_id FROM product_variants WHERE id = ?)', [variant_id]);
            const base_price = (product === null || product === void 0 ? void 0 : product.base_price) || 0;
            const price_snapshot = variant.price_adjustment + base_price;
            // Add new item using cartSession.id
            await db.run('INSERT INTO cart_items (id, cart_session_id, variant_id, quantity, price_snapshot) VALUES (?, ?, ?, ?, ?)', [uuidv4(), cartSession.id, variant_id, quantity, price_snapshot]);
        }
        res.status(201).json({
            success: true,
            message: 'Item added to cart'
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateCartItem = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.userId || null;
        const sessionToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.cart_session) || req.headers['x-cart-token'];
        if (!quantity || quantity < 1) {
            throw new AppError('Quantity must be at least 1', 400);
        }
        const cartSession = await getOrCreateCartSession(sessionToken, userId);
        // Get item and check stock
        const item = await db.get(`SELECT ci.*, pv.stock_quantity 
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.id = ? AND ci.cart_session_id = ?`, [id, cartSession.id]);
        if (!item) {
            throw new AppError('Cart item not found', 404);
        }
        if (quantity > item.stock_quantity) {
            throw new AppError(`Only ${item.stock_quantity} items in stock`, 400);
        }
        await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
        res.json({
            success: true,
            message: 'Cart item updated'
        });
    }
    catch (err) {
        next(err);
    }
};
export const removeCartItem = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = req.userId || null;
        const sessionToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.cart_session) || req.headers['x-cart-token'];
        const cartSession = await getOrCreateCartSession(sessionToken, userId);
        const result = await db.run('DELETE FROM cart_items WHERE id = ? AND cart_session_id = ?', [id, cartSession.id]);
        if (result.changes === 0) {
            throw new AppError('Cart item not found', 404);
        }
        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    }
    catch (err) {
        next(err);
    }
};
// Create new cart session (for guests)
export const createCartSession = async (req, res, next) => {
    try {
        const userId = req.userId || null;
        const sessionId = uuidv4();
        const sessionToken = uuidv4();
        await db.run('INSERT INTO cart_sessions (id, user_id, session_token) VALUES (?, ?, ?)', [sessionId, userId, sessionToken]);
        // Set cookie (optional, client can use token from response)
        res.cookie('cart_session', sessionToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax'
        });
        res.status(201).json({
            success: true,
            data: {
                session_token: sessionToken,
                expires_in: 7 * 24 * 60 * 60 // seconds
            },
            message: 'Cart session created'
        });
    }
    catch (err) {
        next(err);
    }
};
