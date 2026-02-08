// VERITAS - The Universal Validator Logic
// Powered by validator.js

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('validator-input');
    const resultsPanel = document.getElementById('results-panel');
    const resultGrid = document.querySelector('.result-grid');
    const sanitizedOutput = document.getElementById('sanitized-output');
    const charCount = document.getElementById('char-count');
    const copyBtn = document.getElementById('copy-btn');
    const entropyLabel = document.getElementById('entropy-val');

    // Debounce function
    let timeout = null;
    const debounce = (func, wait) => {
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    input.addEventListener('input', debounce((e) => {
        const value = e.target.value.trim();
        validateInput(value);
        updateMetrics(value);
    }, 300));

    input.addEventListener('focus', () => {
        resultsPanel.classList.add('active');
    });

    copyBtn.addEventListener('click', () => {
        const text = sanitizedOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "COPIED TO CLIPBOARD";
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });

    function updateMetrics(value) {
        charCount.textContent = `${value.length} chars`;
        if (value.length > 1000) {
            entropyLabel.className = 'danger';
            entropyLabel.textContent = 'HIGH (Potential Buffer Overflow)';
        } else {
            entropyLabel.className = 'safe';
            entropyLabel.textContent = 'SAF';
        }
    }

    function validateInput(value) {
        // Clear previous results
        resultGrid.innerHTML = '';

        if (!value) {
            resultGrid.innerHTML = '<div class="pill pending">Awaiting Input...</div>';
            sanitizedOutput.textContent = '// Enter input above';
            return;
        }

        // Access the global validator object (ensure script loaded)
        // The validator.js library usually exposes itself as `validator` globally in browser context
        // Try accessing window.validator, or fallback if loaded differently.
        const v = window.validator;

        if (!v) {
            resultGrid.innerHTML = '<div class="pill invalid">ERROR: Core Lib Missing</div>';
            return;
        }

        const checks = [
            { label: 'EMAIL', check: v.isEmail },
            { label: 'URL', check: v.isURL },
            { label: 'IP ADDRESS', check: v.isIP },
            { label: 'S.W.I.F.T CODE', check: v.isBIC }, // Business Identifier Code
            { label: 'CREDIT CARD', check: v.isCreditCard },
            { label: 'CRYPTOCURRENCY', check: (val) => v.isBtcAddress(val) || v.isEthereumAddress && v.isEthereumAddress(val) }, // Helper if avail
            { label: 'UUID', check: v.isUUID },
            { label: 'JWT TOKEN', check: v.isJWT },
            { label: 'MAC ADDRESS', check: v.isMACAddress },
            { label: 'PORT', check: v.isPort },
            { label: 'JSON', check: v.isJSON },
            { label: 'BASE64', check: v.isBase64 },
            { label: 'HEX COLOR', check: v.isHexColor },
            { label: 'SEMVER', check: v.isSemVer }
        ];

        let validCount = 0;

        checks.forEach(item => {
            let isValid = false;
            try {
                isValid = item.check(value);
            } catch (e) {
                isValid = false;
            }

            if (isValid) {
                validCount++;
                addPill(item.label, true);
            }
        });

        // If nothing matched, show generic string
        if (validCount === 0) {
            addPill('UNKNOWN FORMAT', false);
            addPill('POSSIBLE MASKING', false);
        }

        // Sanitization
        let clean = v.trim(value);
        if (v.escape) clean = v.escape(clean);
        sanitizedOutput.textContent = clean;
    }

    function addPill(label, isValid) {
        const div = document.createElement('div');
        div.className = `pill ${isValid ? 'valid' : 'invalid'}`;
        div.innerHTML = `<span>${label}</span> <span>${isValid ? '✓' : '⚠'}</span>`;
        resultGrid.appendChild(div);
    }
});
