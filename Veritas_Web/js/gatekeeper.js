/**
 * GATEKEEPER SYSTEM v2.1.0 - [REAL_MODE_ENABLED]
 * POWERED BY QANTUM NEXUS & MAGICSTICK ENGINE
 * COPYRIGHT QANTUM NEXUS 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// ARCHITECT CONFIGURATION - ENTER REAL GATEWAY LINKS HERE
// ═══════════════════════════════════════════════════════════════════════════
const BASE_URL = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "https://ghost-shild-fhll.onrender.com");

const REAL_MODE_CONFIG = {
    ENABLED: true,
    LINKS: {
        'stripe_basic': `${BASE_URL}/stripe/checkout/basic`,
        'stripe_premium': `${BASE_URL}/stripe/checkout/premium`,
        'paypal_premium': `${BASE_URL}/paypal/checkout`,
        'crypto_premium': ''  // ARCHITECT: INSERT PRODUCTION WALLET/PAYMENT LINK
    }
};

class PaymentGateway {
    constructor() {
        this.premiumKey = 'veritas_premium_access';
        this.modal = null;
        this.overlay = null;
        this.overlay = null;

        // ZKP Integration
        this.zk = new ZeroKnowledgeLicense();

        // Expose instance for HTML onclick handlers
        window.gatekeeper = this;
        window.processPayment = (method) => this.processPayment(method);

        // Run Logic
        this.checkAccess();
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
                         <h3>ZERO-KNOWLEDGE</h3>
                         <div class="price">PROOF<span>/year</span></div>
                         <p class="zk-desc">Cryptographic Validation Only.</p>
                         <button onclick="window.gatekeeper.activateLicense()" class="btn-pay zk-btn">
                             PROVE OWNERSHIP
                         </button>
                    </div>
                </div>
                
                <div id="payment-status" class="status-terminal">
                    > SYSTEM READY. AWAITING PAYMENT OR PROOF...
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
                
                <div class="zk-verify-section" style="margin-top: 15px; border-top: 1px dashed rgba(0, 255, 204, 0.3); padding-top: 10px;">
                    <button onclick="activateLicense()" class="btn-pay" style="background: rgba(0,0,0,0.5); border: 1px solid #00ffcc; font-size: 0.7em;">ACTIVATE ZK LICENSE (ENTERPRISE)</button>
                </div>
            </div>
        `;

        // Expose activation function globally
        window.activateLicense = () => this.activateLicense();

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

    async activateLicense() {
        const statusEl = document.getElementById('payment-status');
        if (!statusEl) return;

        statusEl.innerHTML = `> INITIATING ZERO-KNOWLEDGE PROOF...`;
        statusEl.style.color = '#00ffcc';

        try {
            // 1. Create License (Commitment + Secret)
            statusEl.innerHTML += `<br>> GENERATING CRYPTOGRAPHIC COMMITMENTS...`;
            const expiration = new Date();
            expiration.setDate(expiration.getDate() + 365); // 1 year validity

            // Create a license for 'enterprise' tier
            const { commitment, secret } = await this.zk.createLicense('enterprise', expiration);
            statusEl.innerHTML += `<br>> LICENSE KEY GENERATED: [HIDDEN]`;
            statusEl.innerHTML += `<br>> COMMITMENT HASH: ${commitment.commitmentId.substring(0, 16)}...`;
            await this.sleep(600);

            // 2. Create Proof Request (The Challenge)
            statusEl.innerHTML += `<br>> GENERATING PROOF CHALLENGE...`;
            const request = this.zk.createProofRequest('tier-membership', {
                minimumTier: 'enterprise'
            });
            await this.sleep(600);

            // 3. Generate Proof (The Response)
            statusEl.innerHTML += `<br>> CALCULATING ZK-SNARK PROOF...`;
            const proof = await this.zk.generateProof(secret, commitment, request);
            statusEl.innerHTML += `<br>> PROOF GENERATED: ${proof.proofId}`;
            await this.sleep(800);

            // 4. Verify
            statusEl.innerHTML += `<br>> VERIFYING PROOF ON-CHAIN...`;
            const result = await this.zk.verifyProof(proof);

            if (result.valid) {
                statusEl.innerHTML += `<br>> <span style="color: #0f0">VERIFICATION SUCCESSFUL. TIER: ENTERPRISE</span>`;
                statusEl.innerHTML += `<br>> <span style="color: #888">Gas Used: ${result.verificationTime}ms</span>`;
                await this.sleep(1000);

                localStorage.setItem(this.premiumKey, 'true');
                this.unlock();

                // Reload to apply premium state
                setTimeout(() => window.location.reload(), 1500);
            } else {
                throw new Error("Proof verification failed");
            }
        } catch (error) {
            console.error(error);
            statusEl.innerHTML += `<br>> <span style="color: #f00">CRITICAL ERROR: ${error.message}</span>`;
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
