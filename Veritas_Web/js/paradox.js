/**
 * PARADOX.JS - Transcendence Engine Simulation
 */
document.addEventListener('DOMContentLoaded', () => {
    const stateVal = document.querySelector('.state-val');
    const states = [
        "BOTH TRUE AND FALSE",
        "NEITHER TRUE NOR FALSE",
        "STRICTLY TRUE",
        "STRICTLY FALSE",
        "BEYOND LOGIC"
    ];

    if (stateVal) {
        setInterval(() => {
            const randomState = states[Math.floor(Math.random() * states.length)];
            stateVal.innerText = randomState;
        }, 4000);
    }
});
