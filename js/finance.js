/**
 * FINANCE.JS - Wealth Bridge Simulation
 */
document.addEventListener('DOMContentLoaded', () => {
    const mrr = document.querySelector('.trend.up');
    if (mrr) {
        let base = 175230;
        setInterval(() => {
            base += Math.random() * 10;
            mrr.innerText = `▲ $${base.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }, 3000);
    }
});
