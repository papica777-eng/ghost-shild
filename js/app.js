/**
 * VERITAS APP — PRODUCTION v3.0.0
 * O(1) checkout initiation. No trial. No simulation.
 * 
 * GATEKEEPER PROTOCOL:
 *   Access restricted to paying entities only.
 *   No trial. No simulation. Production only.
 */

// ═══ STRIPE CHECKOUT REDIRECTS ═══
// O(1) — Direct redirect to backend Stripe session
function initiateCheckout(tier) {
    const endpoints = {
        basic: API_BASE_URL + '/stripe/checkout/basic',
        premium: API_BASE_URL + '/stripe/checkout/premium'
    };

    const url = endpoints[tier];
    if (!url) {
        console.error('[GATEKEEPER] Invalid tier:', tier);
        return;
    }

    console.log('[GATEKEEPER] Initiating Stripe checkout:', tier.toUpperCase());

    // Store the selected tier for post-payment reference
    localStorage.setItem('veritas_tier', tier);
    localStorage.setItem('veritas_provider', 'stripe');

    // Redirect to backend → Stripe Checkout
    window.location.href = url;
}

// ═══ PAYPAL CHECKOUT REDIRECTS ═══
// O(1) — Direct redirect to backend PayPal order creation
function initiatePayPalCheckout(tier) {
    const validTiers = ['basic', 'premium'];
    if (!validTiers.includes(tier)) {
        console.error('[GATEKEEPER] Invalid PayPal tier:', tier);
        return;
    }

    console.log('[GATEKEEPER] Initiating PayPal checkout:', tier.toUpperCase());

    localStorage.setItem('veritas_tier', tier);
    localStorage.setItem('veritas_provider', 'paypal');

    // Redirect to backend → PayPal Order → PayPal Approve
    window.location.href = API_BASE_URL + '/paypal/checkout?plan=' + tier;
}

// ═══ SMOOTH SCROLL FOR ANCHOR LINKS ═══
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Nav background on scroll
    var nav = document.querySelector('.nav');
    if (nav) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(3,3,8,0.95)';
                nav.style.borderBottomColor = 'rgba(0,255,204,0.15)';
            } else {
                nav.style.background = 'rgba(3,3,8,0.85)';
                nav.style.borderBottomColor = 'rgba(255,255,255,0.06)';
            }
        });
    }

    console.log('[VERITAS] v3.0.0 — PRODUCTION ACTIVE');
    console.log('[VERITAS] Entropy: 0.00 — No simulation. No fluff.');
});
