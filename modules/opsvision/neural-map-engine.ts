/**
 * 🧠 NEURAL MAP ENGINE - Cognitive Anchors System
 * 
 * Creates intelligent, self-learning selectors based on multiple signals:
 * - Semantic meaning (text, labels, aria)
 * - Visual position (relative to viewport, parent, siblings)
 * - DOM structure (AST-like tree analysis)
 * - Historical success/failure patterns
 * 
 * The system learns from every interaction and improves selector
 * reliability over time - becoming smarter with each test run.
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase 81-83
 */

import { Page, ElementHandle, Locator } from 'playwright';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES
// ============================================================
interface CognitiveAnchor {
    id: string;
    name: string;
    type: 'button' | 'input' | 'link' | 'form' | 'container' | 'text' | 'interactive';
    
    // Multi-signal selectors (prioritized)
    selectors: SelectorSignal[];
    
    // Visual fingerprint
    visual: VisualFingerprint;
    
    // Semantic context
    semantic: SemanticContext;
    
    // Learning data
    learning: LearningData;
    
    // Metadata
    createdAt: number;
    lastSeen: number;
    pageUrl: string;
}

interface SelectorSignal {
    type: 'id' | 'testid' | 'aria' | 'text' | 'css' | 'xpath' | 'role' | 'visual';
    selector: string;
    value?: string;         // Alias for selector (backward compatibility)
    confidence: number;     // 0-100
    successRate: number;    // Historical success rate
    lastUsed: number;
    usageCount: number;
}

interface VisualFingerprint {
    // Bounding box (relative to viewport)
    bounds: { x: number; y: number; width: number; height: number };
    
    // Relative position
    relativePosition: {
        nearestLandmark: string;    // "below header", "inside form#login"
        quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        percentFromTop: number;
        percentFromLeft: number;
    };
    
    // Visual characteristics
    colors: { background: string; text: string; border: string };
    fontSize: number;
    isVisible: boolean;
    zIndex: number;
    
    // Screenshot hash for visual comparison
    visualHash?: string;
    
    // Fingerprint data for visual matching
    fingerprint?: string;
}

interface SemanticContext {
    // Text content
    innerText: string;
    placeholderText?: string;
    labelText?: string;
    ariaLabel?: string;
    title?: string;
    
    // Semantic role
    role: string;
    purpose: 'navigation' | 'action' | 'input' | 'display' | 'container';
    
    // Context clues
    nearbyText: string[];
    formContext?: string;
    headingContext?: string;
    
    // Business logic hints
    businessFunction?: string;    // "login", "checkout", "search"
}

interface LearningData {
    totalAttempts: number;
    successfulFinds: number;
    failedFinds: number;
    healingEvents: number;
    
    // Pattern recognition
    failurePatterns: FailurePattern[];
    successPatterns: string[];
    
    // Confidence evolution
    confidenceHistory: Array<{ timestamp: number; confidence: number }>;
    
    // Recommended alternatives
    alternatives: SelectorSignal[];
}

interface FailurePattern {
    timestamp: number;
    selector: string;
    reason: 'not_found' | 'multiple_matches' | 'stale' | 'hidden' | 'detached';
    pageState?: string;
}

interface DOMNode {
    tagName: string;
    id?: string;
    classes: string[];
    attributes: Record<string, string>;
    text: string;
    children: DOMNode[];
    parent?: DOMNode;
    siblings: DOMNode[];
    depth: number;
    index: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
}

interface NeuralMapConfig {
    storageDir: string;
    minConfidence: number;
    maxAlternatives: number;
    learningEnabled: boolean;
    visualFingerprintEnabled: boolean;
    autoHealingEnabled: boolean;
}

// ============================================================
// NEURAL MAP ENGINE
// ============================================================
export class NeuralMapEngine {
    private config: NeuralMapConfig;
    private anchors: Map<string, CognitiveAnchor> = new Map();
    private pageAst: DOMNode | null = null;
    private currentPage: Page | null = null;

    constructor(config: Partial<NeuralMapConfig> = {}) {
        this.config = {
            storageDir: './cognitive-data/anchors',
            minConfidence: 60,
            maxAlternatives: 5,
            learningEnabled: true,
            visualFingerprintEnabled: true,
            autoHealingEnabled: true,
            ...config
        };

        this.loadAnchors();
    }

    /**
     * 🧠 Create a Cognitive Anchor for an element
     */
    async createAnchor(
        page: Page,
        element: ElementHandle | Locator,
        name: string,
        businessFunction?: string
    ): Promise<CognitiveAnchor> {
        this.currentPage = page;
        logger.debug(`🧠 [NEURAL] Creating Cognitive Anchor: ${name}`);

        // Get element handle if Locator
        const handle = 'elementHandle' in element 
            ? await (element as Locator).elementHandle()
            : element as ElementHandle;

        if (!handle) {
            throw new Error('Could not get element handle');
        }

        // Extract all signals
        const selectors = await this.extractSelectorSignals(page, handle);
        const visual = await this.extractVisualFingerprint(page, handle);
        const semantic = await this.extractSemanticContext(page, handle, businessFunction);

        const anchor: CognitiveAnchor = {
            id: this.generateAnchorId(name, page.url()),
            name,
            type: this.determineElementType(semantic),
            selectors,
            visual,
            semantic,
            learning: {
                totalAttempts: 0,
                successfulFinds: 0,
                failedFinds: 0,
                healingEvents: 0,
                failurePatterns: [],
                successPatterns: [],
                confidenceHistory: [{ timestamp: Date.now(), confidence: this.calculateOverallConfidence(selectors) }],
                alternatives: []
            },
            createdAt: Date.now(),
            lastSeen: Date.now(),
            pageUrl: page.url()
        };

        // Store anchor
        this.anchors.set(anchor.id, anchor);
        this.saveAnchors();

        logger.debug(`🧠 [NEURAL] Anchor created with ${selectors.length} selector signals`);
        logger.debug(`   Top selector: ${selectors[0]?.selector} (${selectors[0]?.confidence}% confidence)`);

        return anchor;
    }

    /**
     * 🎯 Find element using Cognitive Anchor (with self-healing)
     */
    async findElement(page: Page, anchorId: string): Promise<ElementHandle | null> {
        const anchor = this.anchors.get(anchorId);
        if (!anchor) {
            logger.warn(`🧠 [NEURAL] Anchor not found: ${anchorId}`);
            return null;
        }

        this.currentPage = page;
        anchor.learning.totalAttempts++;

        // Try selectors in order of confidence
        const sortedSelectors = [...anchor.selectors].sort((a, b) => 
            (b.confidence * b.successRate) - (a.confidence * a.successRate)
        );

        for (const signal of sortedSelectors) {
            try {
                const element = await this.trySelector(page, signal);
                if (element) {
                    // Verify it's the right element using visual fingerprint
                    if (this.config.visualFingerprintEnabled) {
                        const isMatch = await this.verifyVisualMatch(page, element, anchor.visual);
                        if (!isMatch) {
                            logger.debug(`🧠 [NEURAL] Visual mismatch for ${signal.type}, trying next`);
                            continue;
                        }
                    }

                    // Success! Update learning data
                    this.recordSuccess(anchor, signal);
                    return element;
                }
            } catch (error) {
                this.recordFailure(anchor, signal, 'not_found');
            }
        }

        // All selectors failed - try self-healing
        if (this.config.autoHealingEnabled) {
            logger.debug(`🧠 [NEURAL] All selectors failed, initiating self-healing...`);
            return this.selfHeal(page, anchor);
        }

        return null;
    }

    /**
     * 🔮 Smart locator that returns best current selector
     */
    async getSmartLocator(page: Page, anchorId: string): Promise<Locator | null> {
        const anchor = this.anchors.get(anchorId);
        if (!anchor) return null;

        // Get best selector
        const bestSelector = this.getBestSelector(anchor);
        if (!bestSelector) return null;

        return page.locator(bestSelector.selector);
    }

    /**
     * 📊 Get anchor statistics
     */
    getAnchorStats(anchorId: string): object | null {
        const anchor = this.anchors.get(anchorId);
        if (!anchor) return null;

        return {
            name: anchor.name,
            type: anchor.type,
            confidence: this.calculateOverallConfidence(anchor.selectors),
            successRate: anchor.learning.successfulFinds / Math.max(anchor.learning.totalAttempts, 1),
            healingEvents: anchor.learning.healingEvents,
            selectorCount: anchor.selectors.length,
            lastSeen: new Date(anchor.lastSeen).toISOString(),
            businessFunction: anchor.semantic.businessFunction
        };
    }

    /**
     * 🗺️ Build AST-like DOM tree for analysis
     */
    async buildDomAst(page: Page): Promise<DOMNode> {
        logger.debug(`🧠 [NEURAL] Building DOM AST...`);

        const ast = await page.evaluate(() => {
            function buildNode(element: Element, depth: number, index: number): any {
                const rect = element.getBoundingClientRect();
                const computed = window.getComputedStyle(element);
                
                return {
                    tagName: element.tagName.toLowerCase(),
                    id: element.id || undefined,
                    classes: Array.from(element.classList),
                    attributes: Object.fromEntries(
                        Array.from(element.attributes)
                            .filter(a => !['class', 'id', 'style'].includes(a.name))
                            .map(a => [a.name, a.value])
                    ),
                    text: element.textContent?.trim().slice(0, 100) || '',
                    depth,
                    index,
                    boundingBox: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    },
                    isVisible: computed.display !== 'none' && 
                               computed.visibility !== 'hidden' &&
                               rect.width > 0 && rect.height > 0,
                    children: Array.from(element.children)
                        .map((child, i) => buildNode(child, depth + 1, i))
                };
            }

            return buildNode(document.body, 0, 0);
        });

        this.pageAst = ast;
        logger.debug(`🧠 [NEURAL] AST built with ${this.countNodes(ast)} nodes`);
        return ast;
    }

    // ============================================================
    // SELECTOR SIGNAL EXTRACTION
    // ============================================================

    private async extractSelectorSignals(page: Page, element: ElementHandle): Promise<SelectorSignal[]> {
        const signals: SelectorSignal[] = [];

        // Extract all possible selectors
        const selectors = await page.evaluate((el: any) => {
            const result: any = {};

            // ID selector
            if (el.id) {
                result.id = `#${el.id}`;
            }

            // Data-testid
            const testId = el.getAttribute('data-testid') || 
                          el.getAttribute('data-test-id') ||
                          el.getAttribute('data-cy');
            if (testId) {
                result.testid = `[data-testid="${testId}"]`;
            }

            // ARIA label
            const ariaLabel = el.getAttribute('aria-label');
            if (ariaLabel) {
                result.aria = `[aria-label="${ariaLabel}"]`;
            }

            // Role + accessible name
            const role = el.getAttribute('role') || el.tagName.toLowerCase();
            result.role = role;

            // Text content (for buttons, links)
            const text = el.textContent?.trim();
            if (text && text.length < 50) {
                result.text = text;
            }

            // Placeholder
            const placeholder = el.getAttribute('placeholder');
            if (placeholder) {
                result.placeholder = placeholder;
            }

            // Name attribute
            const name = el.getAttribute('name');
            if (name) {
                result.name = name;
            }

            // Build CSS path
            function getCssPath(element: Element): string {
                const path: string[] = [];
                let current: Element | null = element;
                
                while (current && current !== document.body) {
                    let selector = current.tagName.toLowerCase();
                    
                    if (current.id) {
                        selector = `#${current.id}`;
                        path.unshift(selector);
                        break;
                    }
                    
                    if (current.className && typeof current.className === 'string') {
                        const classes = current.className.trim().split(/\s+/).slice(0, 2);
                        if (classes.length > 0) {
                            selector += '.' + classes.join('.');
                        }
                    }
                    
                    // Add nth-child if needed
                    const parent = current.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children);
                        const index = siblings.indexOf(current);
                        if (siblings.filter(s => s.tagName === current!.tagName).length > 1) {
                            selector += `:nth-child(${index + 1})`;
                        }
                    }
                    
                    path.unshift(selector);
                    current = current.parentElement;
                }
                
                return path.join(' > ');
            }

            result.cssPath = getCssPath(el as Element);

            // Build XPath
            function getXPath(element: Element): string {
                const parts: string[] = [];
                let current: Element | null = element;
                
                while (current && current !== document.body) {
                    let part = current.tagName.toLowerCase();
                    
                    if (current.id) {
                        return `//*[@id="${current.id}"]/${parts.reverse().join('/')}`;
                    }
                    
                    const parent = current.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children)
                            .filter(s => s.tagName === current!.tagName);
                        if (siblings.length > 1) {
                            const index = siblings.indexOf(current) + 1;
                            part += `[${index}]`;
                        }
                    }
                    
                    parts.unshift(part);
                    current = current.parentElement;
                }
                
                return '//' + parts.join('/');
            }

            result.xpath = getXPath(el as Element);

            return result;
        }, element);

        // Create signal objects with confidence scores
        if (selectors.testid) {
            signals.push(this.createSignal('testid', selectors.testid, 95));
        }
        if (selectors.id) {
            signals.push(this.createSignal('id', selectors.id, 90));
        }
        if (selectors.aria) {
            signals.push(this.createSignal('aria', selectors.aria, 85));
        }
        if (selectors.role && selectors.text) {
            signals.push(this.createSignal('role', 
                `role=${selectors.role}:has-text("${selectors.text}")`, 80));
        }
        if (selectors.text) {
            signals.push(this.createSignal('text', `text="${selectors.text}"`, 75));
        }
        if (selectors.placeholder) {
            signals.push(this.createSignal('css', 
                `[placeholder="${selectors.placeholder}"]`, 70));
        }
        if (selectors.name) {
            signals.push(this.createSignal('css', `[name="${selectors.name}"]`, 70));
        }
        if (selectors.cssPath) {
            signals.push(this.createSignal('css', selectors.cssPath, 50));
        }
        if (selectors.xpath) {
            signals.push(this.createSignal('xpath', selectors.xpath, 40));
        }

        return signals.sort((a, b) => b.confidence - a.confidence);
    }

    private createSignal(type: SelectorSignal['type'], selector: string, confidence: number): SelectorSignal {
        return {
            type,
            selector,
            confidence,
            successRate: 1.0,
            lastUsed: Date.now(),
            usageCount: 0
        };
    }

    // ============================================================
    // VISUAL FINGERPRINT
    // ============================================================

    private async extractVisualFingerprint(page: Page, element: ElementHandle): Promise<VisualFingerprint> {
        const visual = await page.evaluate((el: any) => {
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            const viewport = { width: window.innerWidth, height: window.innerHeight };

            // Find nearest landmark
            let nearestLandmark = 'page';
            const landmarks = document.querySelectorAll('header, nav, main, footer, form, [role="banner"], [role="main"]');
            for (const landmark of landmarks) {
                if (landmark.contains(el)) {
                    nearestLandmark = landmark.tagName.toLowerCase();
                    if (landmark.id) nearestLandmark += `#${landmark.id}`;
                    break;
                }
            }

            // Determine quadrant
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            let quadrant: string;
            if (centerX < viewport.width / 2) {
                quadrant = centerY < viewport.height / 2 ? 'top-left' : 'bottom-left';
            } else {
                quadrant = centerY < viewport.height / 2 ? 'top-right' : 'bottom-right';
            }
            if (Math.abs(centerX - viewport.width / 2) < viewport.width * 0.2 &&
                Math.abs(centerY - viewport.height / 2) < viewport.height * 0.2) {
                quadrant = 'center';
            }

            return {
                bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                relativePosition: {
                    nearestLandmark,
                    quadrant,
                    percentFromTop: (rect.y / viewport.height) * 100,
                    percentFromLeft: (rect.x / viewport.width) * 100
                },
                colors: {
                    background: computed.backgroundColor,
                    text: computed.color,
                    border: computed.borderColor
                },
                fontSize: parseFloat(computed.fontSize),
                isVisible: computed.display !== 'none' && computed.visibility !== 'hidden',
                zIndex: parseInt(computed.zIndex) || 0
            };
        }, element);

        return visual as VisualFingerprint;
    }

    // ============================================================
    // SEMANTIC CONTEXT
    // ============================================================

    private async extractSemanticContext(
        page: Page, 
        element: ElementHandle,
        businessFunction?: string
    ): Promise<SemanticContext> {
        const semantic: any = await page.evaluate((el: any) => {
            // Get text content
            const innerText = el.textContent?.trim().slice(0, 200) || '';
            const placeholderText = el.getAttribute('placeholder') || undefined;
            const ariaLabel = el.getAttribute('aria-label') || undefined;
            const title = el.getAttribute('title') || undefined;

            // Find associated label
            let labelText: string | undefined;
            if (el.id) {
                const label = document.querySelector(`label[for="${el.id}"]`);
                if (label) labelText = label.textContent?.trim();
            }

            // Get role
            const role = el.getAttribute('role') || el.tagName.toLowerCase();

            // Determine purpose
            let purpose: string = 'display';
            const tag = el.tagName.toLowerCase();
            if (['button', 'a'].includes(tag) || el.matches('input[type="submit"]')) {
                purpose = 'action';
            } else if (['input', 'textarea', 'select'].includes(tag)) {
                purpose = 'input';
            } else if (['nav', 'menu'].includes(tag) || el.matches('[role="navigation"]')) {
                purpose = 'navigation';
            } else if (['div', 'section', 'article', 'form'].includes(tag)) {
                purpose = 'container';
            }

            // Get nearby text for context
            const nearbyText: string[] = [];
            const parent = el.parentElement;
            if (parent) {
                // Previous sibling text
                const prev = (el as HTMLElement).previousElementSibling;
                if (prev?.textContent) nearbyText.push(prev.textContent.trim().slice(0, 50));
                
                // Next sibling text
                const next = (el as HTMLElement).nextElementSibling;
                if (next?.textContent) nearbyText.push(next.textContent.trim().slice(0, 50));
            }

            // Find form context
            const form = el.closest('form');
            const formContext = form?.id || form?.getAttribute('name') || form?.getAttribute('aria-label');

            // Find heading context
            let headingContext: string | undefined;
            const headings = document.querySelectorAll('h1, h2, h3, h4');
            for (const h of headings) {
                const hRect = h.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                if (hRect.top < elRect.top && hRect.top > elRect.top - 200) {
                    headingContext = h.textContent?.trim();
                    break;
                }
            }

            return {
                innerText,
                placeholderText,
                labelText,
                ariaLabel,
                title,
                role,
                purpose,
                nearbyText: nearbyText.filter(Boolean),
                formContext,
                headingContext
            };
        }, element);

        // Add business function
        semantic.businessFunction = businessFunction || this.inferBusinessFunction(semantic);

        return semantic as SemanticContext;
    }

    private inferBusinessFunction(semantic: any): string | undefined {
        const text = [
            semantic.innerText,
            semantic.labelText,
            semantic.placeholderText,
            semantic.ariaLabel
        ].join(' ').toLowerCase();

        const patterns: Record<string, string[]> = {
            'login': ['login', 'sign in', 'signin', 'log in'],
            'register': ['register', 'sign up', 'signup', 'create account'],
            'search': ['search', 'find', 'lookup', 'query'],
            'checkout': ['checkout', 'payment', 'pay', 'purchase', 'buy'],
            'cart': ['cart', 'basket', 'bag', 'add to cart'],
            'profile': ['profile', 'account', 'settings', 'preferences'],
            'navigation': ['menu', 'nav', 'home', 'back'],
            'submit': ['submit', 'send', 'save', 'confirm', 'ok', 'done']
        };

        for (const [func, keywords] of Object.entries(patterns)) {
            if (keywords.some(k => text.includes(k))) {
                return func;
            }
        }

        return undefined;
    }

    // ============================================================
    // SELF-HEALING
    // ============================================================

    private async selfHeal(page: Page, anchor: CognitiveAnchor): Promise<ElementHandle | null> {
        logger.debug(`🩹 [NEURAL] Self-healing anchor: ${anchor.name}`);

        // Strategy 1: Try visual similarity search
        const visualMatch = await this.findByVisualSimilarity(page, anchor);
        if (visualMatch) {
            await this.updateAnchorFromElement(page, anchor, visualMatch, 'visual_similarity');
            return visualMatch;
        }

        // Strategy 2: Try semantic search
        const semanticMatch = await this.findBySemanticContext(page, anchor);
        if (semanticMatch) {
            await this.updateAnchorFromElement(page, anchor, semanticMatch, 'semantic_match');
            return semanticMatch;
        }

        // Strategy 3: Try fuzzy text matching
        if (anchor.semantic.innerText) {
            const textMatch = await this.findByFuzzyText(page, anchor);
            if (textMatch) {
                await this.updateAnchorFromElement(page, anchor, textMatch, 'fuzzy_text');
                return textMatch;
            }
        }

        logger.error(`🩹 [NEURAL] Self-healing failed for: ${anchor.name}`);
        anchor.learning.failedFinds++;
        return null;
    }

    private async findByVisualSimilarity(page: Page, anchor: CognitiveAnchor): Promise<ElementHandle | null> {
        const candidates = await page.evaluate((visual) => {
            const elements = document.querySelectorAll('*');
            const matches: any[] = [];

            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue;

                // Calculate position similarity
                const xDiff = Math.abs(rect.x - visual.bounds.x) / window.innerWidth;
                const yDiff = Math.abs(rect.y - visual.bounds.y) / window.innerHeight;
                const positionScore = 1 - (xDiff + yDiff) / 2;

                // Calculate size similarity
                const widthRatio = Math.min(rect.width, visual.bounds.width) / 
                                   Math.max(rect.width, visual.bounds.width);
                const heightRatio = Math.min(rect.height, visual.bounds.height) / 
                                    Math.max(rect.height, visual.bounds.height);
                const sizeScore = (widthRatio + heightRatio) / 2;

                const totalScore = (positionScore * 0.6 + sizeScore * 0.4);

                if (totalScore > 0.7) {
                    // Get a unique selector
                    let selector = '';
                    if (el.id) selector = `#${el.id}`;
                    else if ((el as any).dataset?.testid) selector = `[data-testid="${(el as any).dataset.testid}"]`;
                    else {
                        const tag = el.tagName.toLowerCase();
                        const idx = Array.from(el.parentElement?.children || []).indexOf(el);
                        selector = `${tag}:nth-child(${idx + 1})`;
                    }

                    matches.push({ selector, score: totalScore });
                }
            }

            return matches.sort((a, b) => b.score - a.score).slice(0, 3);
        }, anchor.visual);

        for (const candidate of candidates) {
            try {
                const element = await page.$(candidate.selector);
                if (element) return element;
            } catch {}
        }

        return null;
    }

    private async findBySemanticContext(page: Page, anchor: CognitiveAnchor): Promise<ElementHandle | null> {
        const { semantic } = anchor;

        // Try various semantic selectors
        const strategies = [
            // By aria-label
            semantic.ariaLabel ? `[aria-label="${semantic.ariaLabel}"]` : null,
            // By label text
            semantic.labelText ? `text="${semantic.labelText}"` : null,
            // By placeholder
            semantic.placeholderText ? `[placeholder="${semantic.placeholderText}"]` : null,
            // By role + text
            semantic.role && semantic.innerText ? 
                `${semantic.role}:has-text("${semantic.innerText.slice(0, 30)}")` : null,
        ].filter(Boolean);

        for (const selector of strategies) {
            try {
                const element = await page.$(selector as string);
                if (element) return element;
            } catch {}
        }

        return null;
    }

    private async findByFuzzyText(page: Page, anchor: CognitiveAnchor): Promise<ElementHandle | null> {
        const targetText = anchor.semantic.innerText.toLowerCase().trim();
        if (!targetText || targetText.length < 3) return null;

        const matches = await page.evaluate((target) => {
            const elements = document.querySelectorAll('button, a, input, [role="button"]');
            const results: any[] = [];

            for (const el of elements) {
                const text = el.textContent?.toLowerCase().trim() || '';
                
                // Simple fuzzy matching (Levenshtein-like)
                let matches = 0;
                const words = target.split(/\s+/);
                for (const word of words) {
                    if (text.includes(word)) matches++;
                }
                const score = matches / words.length;

                if (score > 0.5) {
                    let selector = '';
                    if (el.id) selector = `#${el.id}`;
                    else selector = `:text("${text.slice(0, 30)}")`;
                    
                    results.push({ selector, score });
                }
            }

            return results.sort((a, b) => b.score - a.score).slice(0, 1);
        }, targetText);

        if (matches.length > 0) {
            try {
                return await page.$(matches[0].selector);
            } catch {}
        }

        return null;
    }

    private async updateAnchorFromElement(
        page: Page,
        anchor: CognitiveAnchor,
        element: ElementHandle,
        healingMethod: string
    ): Promise<void> {
        logger.debug(`🩹 [NEURAL] Healed using: ${healingMethod}`);

        // Extract new selectors
        const newSelectors = await this.extractSelectorSignals(page, element);
        const newVisual = await this.extractVisualFingerprint(page, element);

        // Merge selectors (add new ones, don't remove old)
        for (const newSel of newSelectors) {
            const existing = anchor.selectors.find(s => s.selector === newSel.selector);
            if (!existing) {
                anchor.selectors.push(newSel);
            }
        }

        // Update visual fingerprint
        anchor.visual = newVisual;
        anchor.lastSeen = Date.now();
        anchor.learning.healingEvents++;

        // Keep max alternatives
        anchor.selectors = anchor.selectors
            .sort((a, b) => b.confidence * b.successRate - a.confidence * a.successRate)
            .slice(0, this.config.maxAlternatives * 2);

        this.saveAnchors();
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private async trySelector(page: Page, signal: SelectorSignal): Promise<ElementHandle | null> {
        try {
            let element: ElementHandle | null = null;

            switch (signal.type) {
                case 'xpath':
                    element = await page.$(`xpath=${signal.selector}`);
                    break;
                case 'text':
                    element = await page.$(signal.selector);
                    break;
                default:
                    element = await page.$(signal.selector);
            }

            if (element) {
                signal.lastUsed = Date.now();
                signal.usageCount++;
            }

            return element;
        } catch {
            return null;
        }
    }

    private async verifyVisualMatch(
        page: Page,
        element: ElementHandle,
        expected: VisualFingerprint
    ): Promise<boolean> {
        const actual = await this.extractVisualFingerprint(page, element);

        // Check position (allow 20% drift)
        const xDrift = Math.abs(actual.relativePosition.percentFromLeft - 
                                expected.relativePosition.percentFromLeft);
        const yDrift = Math.abs(actual.relativePosition.percentFromTop - 
                                expected.relativePosition.percentFromTop);

        if (xDrift > 20 || yDrift > 20) return false;

        // Check size (allow 50% difference)
        const widthRatio = actual.bounds.width / expected.bounds.width;
        const heightRatio = actual.bounds.height / expected.bounds.height;

        if (widthRatio < 0.5 || widthRatio > 2.0) return false;
        if (heightRatio < 0.5 || heightRatio > 2.0) return false;

        return true;
    }

    private recordSuccess(anchor: CognitiveAnchor, signal: SelectorSignal): void {
        anchor.learning.successfulFinds++;
        anchor.lastSeen = Date.now();

        // Update selector success rate
        const total = signal.usageCount + 1;
        signal.successRate = (signal.successRate * signal.usageCount + 1) / total;
        signal.usageCount = total;

        // Record pattern
        anchor.learning.successPatterns.push(signal.selector);
        if (anchor.learning.successPatterns.length > 20) {
            anchor.learning.successPatterns = anchor.learning.successPatterns.slice(-20);
        }

        // Update confidence history
        anchor.learning.confidenceHistory.push({
            timestamp: Date.now(),
            confidence: this.calculateOverallConfidence(anchor.selectors)
        });

        this.saveAnchors();
    }

    private recordFailure(anchor: CognitiveAnchor, signal: SelectorSignal, reason: string): void {
        // Update selector success rate
        const total = signal.usageCount + 1;
        signal.successRate = (signal.successRate * signal.usageCount) / total;
        signal.usageCount = total;

        // Record failure pattern
        anchor.learning.failurePatterns.push({
            timestamp: Date.now(),
            selector: signal.selector,
            reason: reason as FailurePattern['reason'],
            pageState: this.currentPage?.url()
        });

        // Keep only recent failures
        if (anchor.learning.failurePatterns.length > 50) {
            anchor.learning.failurePatterns = anchor.learning.failurePatterns.slice(-50);
        }
    }

    private calculateOverallConfidence(selectors: SelectorSignal[]): number {
        if (selectors.length === 0) return 0;
        
        // Weighted average of top 3 selectors
        const top3 = selectors.slice(0, 3);
        const weights = [0.5, 0.3, 0.2];
        
        return top3.reduce((sum, sel, i) => 
            sum + (sel.confidence * sel.successRate * (weights[i] || 0.1)), 0);
    }

    private getBestSelector(anchor: CognitiveAnchor): SelectorSignal | null {
        return anchor.selectors.sort((a, b) => 
            (b.confidence * b.successRate) - (a.confidence * a.successRate)
        )[0] || null;
    }

    private determineElementType(semantic: SemanticContext): CognitiveAnchor['type'] {
        if (semantic.purpose === 'input') return 'input';
        if (semantic.purpose === 'action') {
            return semantic.role === 'link' ? 'link' : 'button';
        }
        if (semantic.purpose === 'navigation') return 'link';
        if (semantic.formContext) return 'form';
        if (semantic.purpose === 'container') return 'container';
        return 'interactive';
    }

    private generateAnchorId(name: string, url: string): string {
        const hash = crypto.createHash('md5')
            .update(name + url)
            .digest('hex')
            .slice(0, 8);
        return `anchor_${name.toLowerCase().replace(/\s+/g, '_')}_${hash}`;
    }

    private countNodes(node: DOMNode): number {
        return 1 + (node.children?.reduce((sum, child) => sum + this.countNodes(child), 0) || 0);
    }

    private loadAnchors(): void {
        const filePath = path.join(this.config.storageDir, 'anchors.json');
        try {
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.anchors = new Map(Object.entries(data));
                logger.debug(`🧠 [NEURAL] Loaded ${this.anchors.size} anchors`);
            }
        } catch (error) {
            logger.warn('🧠 [NEURAL] Could not load anchors');
        }
    }

    private saveAnchors(): void {
        const filePath = path.join(this.config.storageDir, 'anchors.json');
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = Object.fromEntries(this.anchors);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('🧠 [NEURAL] Could not save anchors');
        }
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createNeuralMap(config?: Partial<NeuralMapConfig>): NeuralMapEngine {
    return new NeuralMapEngine(config);
}

// Export types
export type { CognitiveAnchor, SelectorSignal, VisualFingerprint, SemanticContext, LearningData };
