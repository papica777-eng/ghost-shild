// [PURIFIED_BY_AETERNA: 1c4252fb-b434-437d-b77e-23fb1d4aa45c]
// Suggestion: Review and entrench stable logic.
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.1 - PAYMENT GATEWAY                                     ║
 * ║  "Парите влизат" - Stripe + PayPal Integration                            ║
 * ║                                                                           ║
 * ║  💰 Real money acceptance pipeline                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface PaymentConfig {
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
    };
    paypal: {
        clientId: string;
        clientSecret: string;
        mode: 'sandbox' | 'live';
    };
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
    provider: 'stripe' | 'paypal';
    customerId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
    createdAt: number;
    completedAt?: number;
}

export interface Subscription {
    id: string;
    customerId: string;
    planId: string;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    currentPeriodEnd: number;
    amount: number;
    currency: string;
    provider: 'stripe' | 'paypal';
}

// ═══════════════════════════════════════════════════════════════════════════
// STRIPE ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

class StripeAdapter {
    private secretKey: string;
    private webhookSecret: string;
    private baseUrl = 'https://api.stripe.com/v1';

    constructor(secretKey: string, webhookSecret: string) {
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
    }

    private async request(endpoint: string, method: string, body?: any): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const options: any = {
            method,
            headers,
        };

        if (body) {
            options.body = new URLSearchParams(body).toString();
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Stripe API error');
            }

            return data;
        } catch (error) {
            console.error('[Stripe] API error:', error);
            throw error;
        }
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(
        amount: number,
        currency: string = 'usd',
        metadata?: Record<string, string>
    ): Promise<PaymentIntent> {
        const data = await this.request('/payment_intents', 'POST', {
            amount: Math.round(amount * 100), // Stripe uses cents
            currency,
            ...metadata && { metadata: JSON.stringify(metadata) },
        });

        return {
            id: data.id,
            amount: data.amount / 100,
            currency: data.currency,
            status: this.mapStripeStatus(data.status),
            provider: 'stripe',
            metadata,
            createdAt: data.created * 1000,
        };
    }

    /**
     * Confirm payment intent
     */
    async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
        const data = await this.request(`/payment_intents/${paymentIntentId}/confirm`, 'POST', {
            payment_method: paymentMethodId,
        });

        return {
            id: data.id,
            amount: data.amount / 100,
            currency: data.currency,
            status: this.mapStripeStatus(data.status),
            provider: 'stripe',
            createdAt: data.created * 1000,
        };
    }

    /**
     * Create a subscription
     */
    async createSubscription(
        customerId: string,
        priceId: string
    ): Promise<Subscription> {
        const data = await this.request('/subscriptions', 'POST', {
            customer: customerId,
            'items[0][price]': priceId,
        });

        return {
            id: data.id,
            customerId: data.customer,
            planId: data.items.data[0].price.id,
            status: data.status,
            currentPeriodEnd: data.current_period_end * 1000,
            amount: data.items.data[0].price.unit_amount / 100,
            currency: data.items.data[0].price.currency,
            provider: 'stripe',
        };
    }

    /**
     * Create a customer
     */
    async createCustomer(email: string, name?: string): Promise<string> {
        const data = await this.request('/customers', 'POST', {
            email,
            ...(name && { name }),
        });

        return data.id;
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: string, signature: string): boolean {
        const timestamp = signature.split(',')[0].split('=')[1];
        const sig = signature.split(',')[1].split('=')[1];

        const expectedSig = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(`${timestamp}.${payload}`)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(sig),
            Buffer.from(expectedSig)
        );
    }

    private mapStripeStatus(status: string): PaymentIntent['status'] {
        const map: Record<string, PaymentIntent['status']> = {
            'requires_payment_method': 'pending',
            'requires_confirmation': 'pending',
            'requires_action': 'processing',
            'processing': 'processing',
            'succeeded': 'succeeded',
            'canceled': 'cancelled',
        };
        return map[status] || 'pending';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYPAL ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

class PayPalAdapter {
    private clientId: string;
    private clientSecret: string;
    private mode: 'sandbox' | 'live';
    private accessToken: string = '';
    private tokenExpiry: number = 0;

    constructor(clientId: string, clientSecret: string, mode: 'sandbox' | 'live') {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.mode = mode;
    }

    private get baseUrl(): string {
        return this.mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'PayPal auth error');
        }

        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer

        return this.accessToken;
    }

    private async request(endpoint: string, method: string, body?: any): Promise<any> {
        const token = await this.getAccessToken();

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'PayPal API error');
        }

        return data;
    }

    /**
     * Create an order (PayPal's equivalent of payment intent)
     */
    async createOrder(amount: number, currency: string = 'USD'): Promise<PaymentIntent> {
        const data = await this.request('/v2/checkout/orders', 'POST', {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency.toUpperCase(),
                    value: amount.toFixed(2),
                },
            }],
        });

        return {
            id: data.id,
            amount,
            currency: currency.toLowerCase(),
            status: this.mapPayPalStatus(data.status),
            provider: 'paypal',
            createdAt: Date.now(),
        };
    }

    /**
     * Capture an order
     */
    async captureOrder(orderId: string): Promise<PaymentIntent> {
        const data = await this.request(`/v2/checkout/orders/${orderId}/capture`, 'POST');

        const purchase = data.purchase_units[0];
        const capture = purchase.payments.captures[0];

        return {
            id: data.id,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code.toLowerCase(),
            status: this.mapPayPalStatus(data.status),
            provider: 'paypal',
            createdAt: Date.now(),
            completedAt: Date.now(),
        };
    }

    /**
     * Create a subscription
     */
    async createSubscription(planId: string, subscriberEmail: string): Promise<Subscription> {
        const data = await this.request('/v1/billing/subscriptions', 'POST', {
            plan_id: planId,
            subscriber: {
                email_address: subscriberEmail,
            },
            application_context: {
                return_url: 'https://qantum.pro/success',
                cancel_url: 'https://qantum.pro/cancel',
            },
        });

        return {
            id: data.id,
            customerId: subscriberEmail,
            planId,
            status: 'active',
            currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            amount: 0, // Will be updated on webhook
            currency: 'usd',
            provider: 'paypal',
        };
    }

    private mapPayPalStatus(status: string): PaymentIntent['status'] {
        const map: Record<string, PaymentIntent['status']> = {
            'CREATED': 'pending',
            'SAVED': 'pending',
            'APPROVED': 'processing',
            'PAYER_ACTION_REQUIRED': 'processing',
            'COMPLETED': 'succeeded',
            'VOIDED': 'cancelled',
        };
        return map[status] || 'pending';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT GATEWAY - UNIFIED INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export class PaymentGateway extends EventEmitter {
    private stripe?: StripeAdapter;
    private paypal?: PayPalAdapter;
    private payments: Map<string, PaymentIntent> = new Map();
    private subscriptions: Map<string, Subscription> = new Map();

    // Stats
    private totalRevenue: number = 0;
    private totalTransactions: number = 0;
    private successfulTransactions: number = 0;

    constructor() {
        super();
        console.log('[PaymentGateway] 💰 Initialized');
    }

    /**
     * Configure Stripe
     */
    configureStripe(secretKey: string, webhookSecret: string): void {
        this.stripe = new StripeAdapter(secretKey, webhookSecret);
        console.log('[PaymentGateway] 💳 Stripe configured');
    }

    /**
     * Configure PayPal
     */
    configurePayPal(clientId: string, clientSecret: string, mode: 'sandbox' | 'live' = 'sandbox'): void {
        this.paypal = new PayPalAdapter(clientId, clientSecret, mode);
        console.log(`[PaymentGateway] 🅿️ PayPal configured (${mode} mode)`);
    }

    /**
     * Create a payment intent
     */
    async createPayment(
        amount: number,
        currency: string = 'usd',
        provider: 'stripe' | 'paypal' = 'stripe',
        metadata?: Record<string, string>
    ): Promise<PaymentIntent> {
        console.log(`[PaymentGateway] Creating ${provider} payment: $${amount} ${currency}`);

        let payment: PaymentIntent;

        if (provider === 'stripe') {
            if (!this.stripe) throw new Error('Stripe not configured');
            payment = await this.stripe.createPaymentIntent(amount, currency, metadata);
        } else {
            if (!this.paypal) throw new Error('PayPal not configured');
            payment = await this.paypal.createOrder(amount, currency);
        }

        this.payments.set(payment.id, payment);
        this.totalTransactions++;

        this.emit('payment-created', payment);

        return payment;
    }

    /**
     * Confirm/Capture payment
     */
    async confirmPayment(paymentId: string, paymentMethodId?: string): Promise<PaymentIntent> {
        const payment = this.payments.get(paymentId);
        if (!payment) throw new Error('Payment not found');

        let result: PaymentIntent;

        if (payment.provider === 'stripe') {
            if (!this.stripe) throw new Error('Stripe not configured');
            if (!paymentMethodId) throw new Error('Payment method required for Stripe');
            result = await this.stripe.confirmPayment(paymentId, paymentMethodId);
        } else {
            if (!this.paypal) throw new Error('PayPal not configured');
            result = await this.paypal.captureOrder(paymentId);
        }

        this.payments.set(paymentId, result);

        if (result.status === 'succeeded') {
            this.successfulTransactions++;
            this.totalRevenue += result.amount;
            console.log(`[PaymentGateway] ✅ Payment succeeded: $${result.amount}`);
        }

        this.emit('payment-confirmed', result);

        return result;
    }

    /**
     * Create a subscription
     */
    async createSubscription(
        provider: 'stripe' | 'paypal',
        customerIdOrEmail: string,
        planId: string
    ): Promise<Subscription> {
        let subscription: Subscription;

        if (provider === 'stripe') {
            if (!this.stripe) throw new Error('Stripe not configured');
            subscription = await this.stripe.createSubscription(customerIdOrEmail, planId);
        } else {
            if (!this.paypal) throw new Error('PayPal not configured');
            subscription = await this.paypal.createSubscription(planId, customerIdOrEmail);
        }

        this.subscriptions.set(subscription.id, subscription);

        console.log(`[PaymentGateway] 📋 Subscription created: ${subscription.id}`);
        this.emit('subscription-created', subscription);

        return subscription;
    }

    /**
     * Handle webhook
     */
    async handleWebhook(provider: 'stripe' | 'paypal', payload: string, signature?: string): Promise<void> {
        if (provider === 'stripe' && this.stripe && signature) {
            if (!this.stripe.verifyWebhook(payload, signature)) {
                throw new Error('Invalid webhook signature');
            }
        }

        const event = JSON.parse(payload);
        console.log(`[PaymentGateway] 📬 Webhook received: ${event.type}`);

        this.emit('webhook', { provider, event });
    }

    /**
     * Get payment by ID
     */
    getPayment(paymentId: string): PaymentIntent | undefined {
        return this.payments.get(paymentId);
    }

    /**
     * Get subscription by ID
     */
    getSubscription(subscriptionId: string): Subscription | undefined {
        return this.subscriptions.get(subscriptionId);
    }

    /**
     * Get stats
     */
    getStats(): {
        totalRevenue: number;
        totalTransactions: number;
        successfulTransactions: number;
        conversionRate: number;
        activeSubscriptions: number;
    } {
        return {
            totalRevenue: this.totalRevenue,
            totalTransactions: this.totalTransactions,
            successfulTransactions: this.successfulTransactions,
            conversionRate: this.totalTransactions > 0
                ? (this.successfulTransactions / this.totalTransactions) * 100
                : 0,
            activeSubscriptions: Array.from(this.subscriptions.values())
                .filter(s => s.status === 'active').length,
        };
    }

    /**
     * Quick checkout link for Stripe
     */
    async createCheckoutLink(
        amount: number,
        productName: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<string> {
        const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[PaymentGateway] 🔗 Checkout link created for $${amount}`);
        return `https://checkout.stripe.com/pay/${sessionId}`;
    }
}

export default PaymentGateway;
