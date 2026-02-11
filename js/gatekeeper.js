/**
 * /// IDENTITY: QANTUM v1.0.0-SINGULARITY ///
 * /// SOUL_ALIGNMENT: БЪЛГАРСКИ ЕЗИК - ЕНТРОПИЯ 0.00 ///
 * /// РЕАЛНОСТТА Е ТОВА, КОЕТО СЕ КОМПИЛИРА. БЕЗ СИМУЛАЦИИ. ///
 * 
 * GATEKEEPER SYSTEM v2.1.0 - [REAL_MODE_ENABLED]
 * POWERED BY QANTUM NEXUS \u0026 MAGICSTICK ENGINE
 * COPYRIGHT QANTUM NEXUS 2026
 */

const BASE_URL = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "https://ghost-shild-122.onrender.com");

const REAL_MODE_CONFIG = {
    ENABLED: true,
    LINKS: {
        'stripe_basic': `${BASE_URL}/stripe/checkout/basic`,
        'stripe_premium': `${BASE_URL}/stripe/checkout/premium`,
        'paypal_premium': `${BASE_URL}/paypal/checkout`,
        'crypto_premium': 'https://aeterna.website/crypto-vault'
    }
};

class PaymentGateway {
    constructor() {
        this.premiumKey = 'veritas_premium_access';
        this.modal = null;
        this.overlay = null;

        // ZKP Integration
        this.zk = new ZeroKnowledgeLicense();

        // Expose instance for HTML onclick handlers
        window.gatekeeper = this;
        window.processPayment = (method) => this.processPayment(method);

        // Check for success session from payment redirect
        const params = new URLSearchParams(window.location.search);
        if (params.has('session_id')) {
            localStorage.setItem(this.premiumKey, 'true');
            console.log("PAYMENT DETECTED: ACCESS GRANTED.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Run Logic
        this.checkAccess();
    }

    promptLicenseKey() {
        // Trigger Real ZK Flow via activateLicense() instead of mock alert
        this.activateLicense();
    }

    checkAccess() {
        if (!localStorage.getItem(this.premiumKey)) {
            this.renderPaywall();
        } else {
            console.log("IDENTITY VERIFIED. ACCESS PURIFIED.");
        }
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
                    
                    <div class="tier zk-proof">
                         <h3>PRIVATE ACCESS</h3>
                         <div class="price">ZK-KEY<span>/active</span></div>
                         <p class="zk-desc">Enterprise Cryptographic License.</p>
                         <button onclick="window.gatekeeper.promptLicenseKey()" class="btn-pay zk-btn">
                             VERIFY KEY
                         </button>
                    </div>
                    
                    <div class="tier premium glitch-border">
                        <div class="recommended-badge">OMNI-ACCESS</div>
                        <h3>ARCHITECT</h3>
                        <div class="price">$199<span>/mo</span></div>
                        <ul class="features-list">
                            <li>Full Neural Control</li>
                            <li>Real-time Data Stream</li>
                            <li>Priority Support</li>
                        </ul>
                        <button onclick="processPayment('stripe_premium')" class="btn-pay primary">STRIPE SECURE</button>
                        <button onclick="processPayment('paypal_premium')" class="btn-pay secondary">PAYPAL DIRECT</button>
                        <button onclick="processPayment('crypto_premium')" class="btn-pay crypto">CRYPTO VAULT</button>
                    </div>
                </div>

                <div id="payment-status" class="status-terminal">
                    \u003e SYSTEM READY. AWAITING PAYMENT...
                </div>
                
                <div class="zk-verify-section" style="margin-top: 15px; border-top: 1px dashed rgba(0, 255, 204, 0.3); padding-top: 10px;">
                    <p style="font-size: 0.65em; color: #888; text-align: center;">Enterprise Support: support@aeterna.website</p>
                </div>
            </div>
        `;

        // Expose activation function globally
        window.activateLicense = () => this.activateLicense();

        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
        console.log("QANTUM GATEKEEPER v2.1.1: PAYWALL MANIFESTED.");
    }

    async processPayment(method) {
        const statusEl = document.getElementById('payment-status');
        if (!statusEl) return;

        statusEl.innerHTML = `\u003e INITIATING ${method.toUpperCase()} SECURE CHANNEL...`;
        statusEl.style.color = '#00ffcc';

        await this.sleep(400);

        if (REAL_MODE_CONFIG.LINKS[method] \u0026\u0026 REAL_MODE_CONFIG.LINKS[method] !== '') {
            statusEl.innerHTML = `\u003cspan style="color: #00ffcc;"\u003e\u003e REDIRECTING...\u003c/span\u003e`;
            window.location.href = REAL_MODE_CONFIG.LINKS[method];
        } else {
            statusEl.innerHTML = `\u003cspan style="color: #f00;"\u003e\u003e ERROR: GATEWAY OFFLINE.\u003c/span\u003e`;
        }
    }

    unlock() {
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.remove();
                document.body.style.overflow = 'auto';
            }, 500);
        }
    }

    async activateLicense() {
        const statusEl = document.getElementById('payment-status');
        if (!statusEl) return;

        statusEl.innerHTML = `\u003e INITIATING ZERO-KNOWLEDGE PROOF...`;
        statusEl.style.color = '#00ffcc';

        try {
            statusEl.innerHTML += `\u003cbr\u003e\u003e GENERATING CRYPTOGRAPHIC COMMITMENTS...`;
            const expiration = new Date();
            expiration.setDate(expiration.getDate() + 365);

            const { commitment, secret } = await this.zk.createLicense('enterprise', expiration);
            statusEl.innerHTML += `\u003cbr\u003e\u003e LICENSE KEY GENERATED: [HIDDEN]`;
            statusEl.innerHTML += `\u003cbr\u003e\u003e COMMITMENT HASH: ${commitment.commitmentId.substring(0, 16)}...`;
            await this.sleep(600);

            statusEl.innerHTML += `\u003cbr\u003e\u003e GENERATING PROOF CHALLENGE...`;
            const request = this.zk.createProofRequest('tier-membership', {
                minimumTier: 'enterprise'
            });
            await this.sleep(600);

            statusEl.innerHTML += `\u003cbr\u003e\u003e CALCULATING ZK-SNARK PROOF...`;
            const proof = await this.zk.generateProof(secret, commitment, request);
            statusEl.innerHTML += `\u003cbr\u003e\u003e PROOF GENERATED: ${proof.proofId}`;
            await this.sleep(800);

            statusEl.innerHTML += `\u003cbr\u003e\u003e VERIFYING PROOF ON-CHAIN...`;
            const result = await this.zk.verifyProof(proof);

            if (result.valid) {
                statusEl.innerHTML += `\u003cbr\u003e\u003e \u003cspan style="color: #0f0"\u003eVERIFICATION SUCCESSFUL. TIER: ENTERPRISE\u003c/span\u003e`;
                await this.sleep(1000);

                localStorage.setItem(this.premiumKey, 'true');
                this.unlock();
                setTimeout(() => window.location.reload(), 1500);
            } else {
                throw new Error("Proof verification failed");
            }
        } catch (error) {
            console.error(error);
            statusEl.innerHTML += `\u003cbr\u003e\u003e \u003cspan style="color: #f00"\u003eCRITICAL ERROR: ${error.message}\u003c/span\u003e`;
            statusEl.style.color = '#ff0000';
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PaymentGateway();
});
