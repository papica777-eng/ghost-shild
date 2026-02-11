// ═══════════════════════════════════════════════════════════════════════════════
//  QANTUM NEXUS - Portal Engine v2.0.0
//  O(1) initialization | Zero dependencies | Production-only
// ═══════════════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ─── Particle Background ───────────────────────────────────────────────────
    const gridBg = document.querySelector('.grid-background');
    if (gridBg) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 8}s;
                animation-duration: ${6 + Math.random() * 10}s;
            `;
            gridBg.appendChild(particle);
        }
    }

    // ─── Card Glow Tracking ────────────────────────────────────────────────────
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0,255,255,0.12), transparent 50%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.background = 'none';
            }
        });
    });

    // ─── Stat counter animation ────────────────────────────────────────────────
    const animateCounter = (el, target) => {
        const isNumber = !isNaN(parseFloat(target));
        if (!isNumber) return;

        const num = parseFloat(target);
        const isFloat = target.includes('.');
        const suffix = target.replace(/[\d.]/g, '');
        let current = 0;
        const step = num / 40;
        const interval = setInterval(() => {
            current += step;
            if (current >= num) {
                current = num;
                clearInterval(interval);
            }
            el.textContent = (isFloat ? current.toFixed(2) : Math.floor(current)) + suffix;
        }, 30);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNums = entry.target.querySelectorAll('.stat-num');
                statNums.forEach(el => {
                    const target = el.textContent.trim();
                    animateCounter(el, target);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }

    // ─── Scroll Reveal Cards ───────────────────────────────────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.08}s`;
        revealObserver.observe(card);
    });

    // ─── Portal Status Heartbeat ───────────────────────────────────────────────
    const pulseLabel = document.querySelector('.pulse-label');
    if (pulseLabel) {
        const statuses = ['ALL SYSTEMS ONLINE', 'ENTROPY: 0.00', 'NEXUS ACTIVE'];
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % statuses.length;
            pulseLabel.style.opacity = '0';
            setTimeout(() => {
                pulseLabel.textContent = statuses[idx];
                pulseLabel.style.opacity = '1';
            }, 300);
        }, 4000);
    }

    // ─── Console Identity ──────────────────────────────────────────────────────
    console.log('%c⚛️ QANTUM NEXUS v2.0.0', 'color:#00f0ff;font-size:18px;font-weight:900;');
    console.log('%c→ Portal Engine LIVE | Entropy: 0.00 | Products: 8', 'color:#888;');
    console.log('%c→ Architect: Dimitar Prodromov', 'color:#888;');

})();
