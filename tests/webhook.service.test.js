import { createWebhook, triggerWebhook, listWebhooks, deleteWebhook } from '../src/services/webhook.service';
import db from '../src/config/database';
describe('Webhook Service', () => {
    let testWebhookId;
    beforeAll(async () => {
        await db.connect();
        await db.createTables();
    });
    afterAll(async () => {
        await db.close();
    });
    describe('createWebhook', () => {
        it('should create a new webhook', async () => {
            const webhook = await createWebhook({
                name: 'Test Webhook',
                url: 'https://example.com/webhook',
                events: ['order.created', 'order.updated'],
                secret: 'test-secret',
            });
            expect(webhook).toHaveProperty('id');
            expect(webhook.name).toBe('Test Webhook');
            expect(webhook.url).toBe('https://example.com/webhook');
            expect(webhook.events).toContain('order.created');
            testWebhookId = webhook.id;
        });
        it('should not create duplicate URL for same events? (if enforced)', async () => {
            // Skip if no duplicate rule
        }).skip;
    });
    describe('listWebhooks', () => {
        it('should list all webhooks', async () => {
            const webhooks = await listWebhooks();
            expect(Array.isArray(webhooks)).toBe(true);
            expect(webhooks.length).toBeGreaterThan(0);
        });
    });
    describe('triggerWebhook', () => {
        it('should prepare webhook payload', async () => {
            const payload = {
                event: 'order.created',
                data: { id: 'order-123', total: 100000 },
            };
            const result = await triggerWebhook(testWebhookId, payload);
            expect(result).toHaveProperty('success');
            // actual HTTP call might be mocked or skipped in tests
        });
        it('should fail for inactive webhook', async () => {
            // If we have a way to deactivate webhook
        }).skip;
    });
    describe('deleteWebhook', () => {
        it('should delete webhook', async () => {
            const success = await deleteWebhook(testWebhookId);
            expect(success).toBe(true);
            const remaining = await listWebhooks();
            expect(remaining.find(w => w.id === testWebhookId)).toBeUndefined();
        });
    });
});
