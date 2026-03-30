class TaxService {
    constructor() {
        this.config = {
            enabled: process.env.TAX_ENABLED === 'true',
            default_rate: Number(process.env.TAX_DEFAULT_RATE) || 10,
            rates_by_province: {}
        };
        // Load province tax rates from env if provided
        // Format: TAX_RATES={"HN":10,"HCM":10,"DN":5}
        if (process.env.TAX_RATES) {
            try {
                this.config.rates_by_province = JSON.parse(process.env.TAX_RATES);
            }
            catch (e) {
                console.warn('Invalid TAX_RATES env var, ignoring');
            }
        }
    }
    /**
     * Calculate tax for an order
     * @param subtotal - Order subtotal (before shipping, after discount)
     * @param provinceCode - Province code (e.g., "HCM", "HN")
     * @returns Tax amount
     */
    calculateTax(subtotal, provinceCode) {
        if (!this.config.enabled) {
            return 0;
        }
        const rate = provinceCode && this.config.rates_by_province[provinceCode]
            ? this.config.rates_by_province[provinceCode]
            : this.config.default_rate;
        const tax = subtotal * (rate / 100);
        return Math.round(tax * 100) / 100; // Round to 2 decimals
    }
    /**
     * Get tax breakdown for display
     */
    getBreakdown(subtotal, provinceCode) {
        const rate = provinceCode && this.config.rates_by_province[provinceCode]
            ? this.config.rates_by_province[provinceCode]
            : this.config.default_rate;
        const amount = this.calculateTax(subtotal, provinceCode);
        return {
            enabled: this.config.enabled,
            rate,
            amount,
            subtotal
        };
    }
    isEnabled() {
        return this.config.enabled;
    }
}
export const taxService = new TaxService();
export default taxService;
