/**
 * BACKPACK.JS - Neural Persistence Simulation
 */
document.addEventListener('DOMContentLoaded', () => {
    const log = document.getElementById('memoryLog');
    const thoughts = [
        "> Syncing neural anchors...",
        "> Context vector optimized.",
        "> Memory fragment #882 restored.",
        "> Archival retrieval successful.",
        "> Pathway latency: 0.04ms",
        "> Stability protocol: ACTIVE",
        "> Ingesting new sensory data...",
        "> Encoding successful."
    ];

    let i = 0;
    setInterval(() => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = thoughts[i % thoughts.length];
        log.appendChild(entry);

        if (log.children.length > 5) {
            log.removeChild(log.children[0]);
        }

        i++;
    }, 3000);
});
