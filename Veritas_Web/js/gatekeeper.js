/**
 * GATEKEEPER SYSTEM v2.1.0 - [REAL_MODE_ENABLED]
 * POWERED BY QANTUM NEXUS & MAGICSTICK ENGINE
 * COPYRIGHT QANTUM NEXUS 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// ARCHITECT CONFIGURATION - ENTER REAL GATEWAY LINKS HERE
// ═══════════════════════════════════════════════════════════════════════════
const REAL_MODE_CONFIG = {
    ENABLED: true,
    LINKS: {
        'stripe_basic': (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL + '/stripe/checkout/basic' : ''),   // ARCHITECT: INSERT PRODUCTION STRIPE LINK
        'stripe_premium': (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL + '/stripe/checkout/premium' : ''), // ARCHITECT: INSERT PRODUCTION STRIPE LINK
        'paypal_premium': (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL + '/paypal/checkout' : ''), // ARCHITECT: INSERT PRODUCTION PAYPAL LINK
        'crypto_premium': ''  // ARCHITECT: INSERT PRODUCTION WALLET/PAYMENT LINK
    }
};

class PaymentGateway {
    constructor() {
        this.premiumKey = 'veritas_premium_access';
        this.modal = null;
        this.overlay = null;
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.premiumKey)) {
            this.renderPaywall();
        } else {
            console.log("IDENTITY VERIFIED. ACCESS PURIFIED.");
        }

        window.processPayment = (method) => this.processPayment(method);
        window.simulatePayment = (method) => this.processPayment(method);
    }

    renderPaywall() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'paywall-overlay';
        this.overlay.innerHTML = `
            <div class="paywall-modal">
                <div class="modal-header">
                    <div class="warning-icon">🔒</div>
                    <h2>SYSTEM LOCK: PAYMENT REQUIRED</h2>
                    <p>Access restricted to paying entities only. No trial. No simulation.</p>
                </div>
                
                <div class="pricing-tiers">
                    <div class="tier standard">
                        <h3>OPERATOR</h3>
                        <div class="price">$49.99<span>/mo</span></div>
                        <button onclick="processPayment('stripe_basic')" class="btn-pay">PAY VIA STRIPE</button>
                    </div>
                    
                    <div class="tier premium glitch-border">
                        <div class="recommended-badge">OMNI-ACCESS</div>
                        <h3>ARCHITECT</h3>
                        <div class="price">$199<span>/mo</span></div>
                        <ul>
                            <li>Full Neural Control</li>
                            <li>Real-time Data Stream</li>
                            <li>Priority Support</li>
                        </ul>
                        <button onclick="processPayment('stripe_premium')" class="btn-pay primary">STRIPE SECURE</button>
                        <button onclick="processPayment('paypal_premium')" class="btn-pay secondary">PAYPAL DIRECT</button>
                        <button onclick="processPayment('crypto_premium')" class="btn-pay crypto">CRYPTO VAULT</button>
                    </div>
                </div>

                <div class="terminal-status" id="payment-status">
                    > AWAITING SETTLEMENT...
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    }

    async processPayment(method) {
        const statusEl = document.getElementById('payment-status');
        if (!statusEl) return;

        statusEl.innerHTML = `> ESTABLISHING SECURE GATEWAY FOR ${method.toUpperCase()}...`;
        await this.sleep(800);

        if (REAL_MODE_CONFIG.LINKS[method] && REAL_MODE_CONFIG.LINKS[method] !== '') {
            statusEl.innerHTML = `<span style="color: #00ffcc;">> REDIRECTING TO SECURE CHECKOUT...</span>`;
            await this.sleep(1200);
            window.location.href = REAL_MODE_CONFIG.LINKS[method];
        } else {
            statusEl.innerHTML = `<span style="color: #f00;">> ERROR: GATEWAY NOT CONFIGURED BY ARCHITECT.</span>`;
            statusEl.style.borderColor = '#f00';
            console.error(`Missing production link for: ${method}`);
        }
    }

    unlock() {
        // This is only called after a manual storage update or successful return from payment
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.remove();
                document.body.style.overflow = 'auto';
            }, 500);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PaymentGateway();
});
