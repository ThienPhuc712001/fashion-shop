class ShippingProvider {
}
class GHNProvider extends ShippingProvider {
    constructor() {
        super();
        this.name = 'ghn';
        this.token = process.env.GHN_TOKEN || '';
        this.shopId = process.env.GHN_SHOP_ID || '';
    }
    async calculateRate(origin, destination, weight, value) {
        return [
            { carrier: 'ghn', service: 'standard', price: 30000, estimated_days: '2-3 days' },
            { carrier: 'ghn', service: 'express', price: 50000, estimated_days: '1-2 days' }
        ];
    }
    async createShipment(req) {
        return {
            id: `GHN-${Date.now()}`,
            order_id: req.order_id,
            carrier: 'ghn',
            tracking_number: `GHN${Date.now()}`,
            status: 'pending',
            estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
    async getTracking(trackingNumber) {
        return { status: 'pending', estimated_delivery: '' };
    }
    async cancelShipment(shipmentId) { }
}
class ViettelProvider extends ShippingProvider {
    constructor() {
        super();
        this.name = 'viettel';
        this.token = process.env.VIETTEL_TOKEN || '';
    }
    async calculateRate(origin, destination, weight, value) {
        return [
            { carrier: 'viettel', service: 'standard', price: 25000, estimated_days: '3-5 days' },
            { carrier: 'viettel', service: 'express', price: 45000, estimated_days: '1-2 days' }
        ];
    }
    async createShipment(req) {
        return {
            id: `VT-${Date.now()}`,
            order_id: req.order_id,
            carrier: 'viettel',
            tracking_number: `VT${Date.now()}`,
            status: 'pending',
            estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
    async getTracking(trackingNumber) {
        return { status: 'pending' };
    }
    async cancelShipment(shipmentId) { }
}
class ShippingService {
    constructor() {
        this.providers = new Map();
        if (process.env.GHN_TOKEN) {
            this.providers.set('ghn', new GHNProvider());
        }
        if (process.env.VIETTEL_TOKEN) {
            this.providers.set('viettel', new ViettelProvider());
        }
        if (process.env.NODE_ENV !== 'production') {
            const mockProvider = {
                name: 'mock',
                calculateRate: async () => [{ carrier: 'ghn', service: 'standard', price: 20000, estimated_days: '3-5 days' }],
                createShipment: async (req) => ({
                    id: `MOCK-${Date.now()}`,
                    order_id: req.order_id,
                    carrier: 'ghn',
                    tracking_number: `MOCK${Date.now()}`,
                    status: 'pending',
                    estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                }),
                getTracking: async () => ({ status: 'pending' }),
                cancelShipment: async () => { }
            };
            this.providers.set('mock', mockProvider);
        }
    }
    async getRates(carrier, destination, weight, orderValue) {
        const provider = this.providers.get(carrier);
        if (!provider) {
            throw new Error(`Shipping provider '${carrier}' not configured`);
        }
        return provider.calculateRate(null, destination, weight, orderValue);
    }
    async createShipment(carrier, req) {
        const provider = this.providers.get(carrier);
        if (!provider) {
            throw new Error(`Shipping provider '${carrier}' not configured`);
        }
        return provider.createShipment(req);
    }
    async track(carrier, trackingNumber) {
        const provider = this.providers.get(carrier);
        if (!provider) {
            throw new Error(`Shipping provider '${carrier}' not configured`);
        }
        return provider.getTracking(trackingNumber);
    }
    async cancel(carrier, shipmentId) {
        const provider = this.providers.get(carrier);
        if (!provider) {
            throw new Error(`Shipping provider '${carrier}' not configured`);
        }
        return provider.cancelShipment(shipmentId);
    }
    getAvailableCarriers() {
        return Array.from(this.providers.keys());
    }
}
export const shippingService = new ShippingService();
export default shippingService;
