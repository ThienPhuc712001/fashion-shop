import { Request, Response, NextFunction } from 'express';

interface ShippingRate {
  carrier: 'ghn' | 'viettel' | 'jnt' | 'express' | 'mock';
  service: string;
  price: number;
  estimated_days: string;
}

interface ShippingAddress {
  province: string;
  district: string;
  ward: string;
  street_address: string;
}

interface CreateShipmentRequest {
  order_id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: ShippingAddress;
  weight_grams: number;
  cod_amount?: number;
}

interface Shipment {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string;
  status: string;
  estimated_delivery?: string;
  label_url?: string;
  raw_response?: any;
}

abstract class ShippingProvider {
  abstract name: string;
  abstract calculateRate(origin: any, destination: ShippingAddress, weight: number, value: number): Promise<ShippingRate[]>;
  abstract createShipment(req: CreateShipmentRequest): Promise<Shipment>;
  abstract getTracking(trackingNumber: string): Promise<any>;
  abstract cancelShipment(shipmentId: string): Promise<void>;
}

class GHNProvider extends ShippingProvider {
  name = 'ghn';
  private token: string;
  private shopId: string;

  constructor() {
    super();
    this.token = process.env.GHN_TOKEN || '';
    this.shopId = process.env.GHN_SHOP_ID || '';
  }

  async calculateRate(origin: any, destination: ShippingAddress, weight: number, value: number): Promise<ShippingRate[]> {
    return [
      { carrier: 'ghn', service: 'standard', price: 30000, estimated_days: '2-3 days' },
      { carrier: 'ghn', service: 'express', price: 50000, estimated_days: '1-2 days' }
    ];
  }

  async createShipment(req: CreateShipmentRequest): Promise<Shipment> {
    return {
      id: `GHN-${Date.now()}`,
      order_id: req.order_id,
      carrier: 'ghn',
      tracking_number: `GHN${Date.now()}`,
      status: 'pending',
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async getTracking(trackingNumber: string): Promise<any> {
    return { status: 'pending', estimated_delivery: '' };
  }

  async cancelShipment(shipmentId: string): Promise<void> {}
}

class ViettelProvider extends ShippingProvider {
  name = 'viettel';
  private token: string;

  constructor() {
    super();
    this.token = process.env.VIETTEL_TOKEN || '';
  }

  async calculateRate(origin: any, destination: ShippingAddress, weight: number, value: number): Promise<ShippingRate[]> {
    return [
      { carrier: 'viettel', service: 'standard', price: 25000, estimated_days: '3-5 days' },
      { carrier: 'viettel', service: 'express', price: 45000, estimated_days: '1-2 days' }
    ];
  }

  async createShipment(req: CreateShipmentRequest): Promise<Shipment> {
    return {
      id: `VT-${Date.now()}`,
      order_id: req.order_id,
      carrier: 'viettel',
      tracking_number: `VT${Date.now()}`,
      status: 'pending',
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async getTracking(trackingNumber: string): Promise<any> {
    return { status: 'pending' };
  }

  async cancelShipment(shipmentId: string): Promise<void> {}
}

class ShippingService {
  private providers: Map<string, ShippingProvider>;

  constructor() {
    this.providers = new Map();
    
    if (process.env.GHN_TOKEN) {
      this.providers.set('ghn', new GHNProvider());
    }
    if (process.env.VIETTEL_TOKEN) {
      this.providers.set('viettel', new ViettelProvider());
    }
    
    if (process.env.NODE_ENV !== 'production') {
      const mockProvider: ShippingProvider = {
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
        cancelShipment: async () => {}
      };
      this.providers.set('mock', mockProvider);
    }
  }

  async getRates(carrier: string, destination: ShippingAddress, weight: number, orderValue: number): Promise<ShippingRate[]> {
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Shipping provider '${carrier}' not configured`);
    }
    return provider.calculateRate(null, destination, weight, orderValue);
  }

  async createShipment(carrier: string, req: CreateShipmentRequest): Promise<Shipment> {
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Shipping provider '${carrier}' not configured`);
    }
    return provider.createShipment(req);
  }

  async track(carrier: string, trackingNumber: string): Promise<any> {
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Shipping provider '${carrier}' not configured`);
    }
    return provider.getTracking(trackingNumber);
  }

  async cancel(carrier: string, shipmentId: string): Promise<void> {
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Shipping provider '${carrier}' not configured`);
    }
    return provider.cancelShipment(shipmentId);
  }

  getAvailableCarriers(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const shippingService = new ShippingService();
export type { ShippingRate, ShippingAddress, CreateShipmentRequest, Shipment };
export default shippingService;
