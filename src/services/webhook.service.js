class WebhookService {
    constructor() {
        this.subscriptions = [];
    }
    async loadSubscriptions() {
        this.subscriptions = [];
    }
    async trigger(eventType, payload) {
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            timestamp: new Date(),
            payload
        };
        const activeSubs = this.subscriptions.filter(s => s.is_active && s.events.includes(eventType));
        for (const sub of activeSubs) {
            try {
                await this.sendWebhook(sub, event);
            }
            catch (err) {
                console.error(`Webhook failed for ${sub.url}:`, err.message);
            }
        }
    }
    async sendWebhook(subscription, event) {
        const payload = JSON.stringify(event);
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'FashionShop-Webhook/1.0',
            'X-Event-Type': event.type,
            'X-Event-ID': event.id
        };
        if (subscription.secret) {
            const crypto = await import('crypto');
            const hmac = crypto.createHmac('sha256', subscription.secret);
            hmac.update(payload);
            headers['X-Webhook-Signature'] = hmac.digest('hex');
        }
        const response = await fetch(subscription.url, {
            method: 'POST',
            headers,
            body: payload,
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        subscription.last_triggered_at = new Date();
    }
    async subscribe(url, events, secret) {
        const sub = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            events,
            secret,
            is_active: true
        };
        this.subscriptions.push(sub);
        return sub;
    }
    async unsubscribe(subscriptionId) {
        this.subscriptions = this.subscriptions.filter(s => s.id !== subscriptionId);
    }
    async listSubscriptions() {
        return this.subscriptions;
    }
}
const webhookService = new WebhookService();
export const initWebhooks = async () => {
    await webhookService.loadSubscriptions();
    console.log('🔗 Webhook service initialized');
};
export default webhookService;
