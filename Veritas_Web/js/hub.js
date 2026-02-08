/**
 * HUB INTERACTIVITY
 * -----------------
 * Handles navigation feedback and minor animations for the QANTUM NEXUS Hub.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("QANTUM NEXUS HUB: ONLINE");
    initHub();
});

function initHub() {
    // Add hover sound effects (simulated)
    const cards = document.querySelectorAll('.module-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            playHoverSound();
            card.style.borderColor = '#ffffff'; // White flash
            setTimeout(() => {
                const isParadox = card.href.includes('paradox');
                card.style.borderColor = isParadox ? '#ff00ff' : '#00ffcc';
            }, 100);
        });
    });

    // Random Glitch Effect on Title
    const title = document.querySelector('h1.glitch');
    if (title) {
        setInterval(() => {
            title.classList.toggle('glitching');
            setTimeout(() => title.classList.remove('glitching'), 200);
        }, 5000);
    }
}

function playHoverSound() {
    // Simplified hover feedback
    // In a real browser without user interaction, audio is blocked, so we skip actual Audio() for now 
    // to avoid console errors. This is just a placeholder hook.
}
