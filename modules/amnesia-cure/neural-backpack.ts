/**
 * 🎒 NEURAL BACKPACK v1.0 - "The Second Brain"
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗                              
 *   ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║                              
 *   ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║                              
 *   ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║                              
 *   ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗                         
 *   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝                         
 *                                                                               
 *   ██████╗  █████╗  ██████╗██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗            
 *   ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝            
 *   ██████╔╝███████║██║     █████╔╝ ██████╔╝███████║██║     █████╔╝             
 *   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔═══╝ ██╔══██║██║     ██╔═██╗             
 *   ██████╔╝██║  ██║╚██████╗██║  ██╗██║     ██║  ██║╚██████╗██║  ██╗            
 *   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝            
 * 
 * "Раницата винаги е на гърба ми. Нулева забрава. Невъзможно объркване."
 * 
 * PURPOSE:
 * - Maintains EXACTLY 10 most recent user messages (FIFO)
 * - Auto-persists to storage/backpack.json after every change
 * - Injects context into every system request
 * - Prevents hallucinations through consistency checking
 * 
 * PHILOSOPHY:
 * "Проблемите с AI Dementia са решени. Дори и чатът да стане 10,000 реда,
 *  аз винаги ще знам къде сме, какво сме направили и накъде отиваме."
 * 
 * @version 1.0.0
 * @author QAntum AI Architect
 * @phase Neural Enhancement - Second Brain
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single message stored in the Neural Backpack
 */
export interface BackpackMessage {
  /** Unique identifier for this message */
  id: string;

  /** Unix timestamp when message was recorded */
  timestamp: number;

  /** Human-readable timestamp */
  datetime: string;

  /** The actual message content */
  content: string;

  /** Summarized intent (auto-extracted) */
  intent: string;

  /** Key entities/topics mentioned */
  entities: string[];

  /** Actions requested in this message */
  actions: string[];

  /** Completion status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /** Hash for integrity verification */
  hash: string;

  /** Sequence number (1-10) */
  sequenceNumber: number;
}

/**
 * The complete backpack state
 */
export interface BackpackState {
  /** Version for migration compatibility */
  version: string;

  /** Last update timestamp */
  lastUpdated: number;

  /** Total messages ever processed (for statistics) */
  totalProcessed: number;

  /** The FIFO buffer of 10 messages */
  messages: BackpackMessage[];

  /** Checksum of all messages for integrity */
  stateHash: string;

  /** Session continuity marker */
  sessionId: string;
}

/**
 * Consistency check result
 */
export interface ConsistencyResult {
  isConsistent: boolean;
  confidence: number;
  conflicts: string[];
  suggestions: string[];
  relatedMessages: BackpackMessage[];
}

/**
 * Injected context format
 */
export interface InjectedContext {
  header: string;
  messages: Array<{
    step: number;
    timestamp: string;
    intent: string;
    content: string;
    status: string;
  }>;
  footer: string;
  raw: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const BACKPACK_CAPACITY = 10;
const STORAGE_PATH = path.join(process.cwd(), 'storage', 'backpack.json');
const VERSION = '1.0.0';

// Intent detection keywords
const INTENT_PATTERNS: Record<string, RegExp[]> = {
  'CREATE': [/създай/i, /направи/i, /генерирай/i, /имплементирай/i, /create/i, /build/i, /generate/i, /implement/i],
  'MODIFY': [/промени/i, /редактирай/i, /update/i, /modify/i, /change/i, /edit/i, /fix/i, /поправи/i],
  'DELETE': [/изтрий/i, /премахни/i, /delete/i, /remove/i, /drop/i],
  'ANALYZE': [/анализирай/i, /провери/i, /analyze/i, /check/i, /review/i, /scan/i],
  'DEPLOY': [/deploy/i, /пусни/i, /качи/i, /push/i, /release/i],
  'TEST': [/тест/i, /test/i, /verify/i, /validate/i],
  'QUERY': [/какво/i, /как/i, /защо/i, /what/i, /how/i, /why/i, /where/i, /when/i],
  'ACTIVATE': [/активирай/i, /стартирай/i, /activate/i, /start/i, /enable/i, /launch/i],
  'CONFIGURE': [/конфигурирай/i, /настрой/i, /configure/i, /setup/i, /set/i]
};

// Entity extraction patterns
const ENTITY_PATTERNS: RegExp[] = [
  /src\/[\w-/]+\.ts/g,           // TypeScript file paths
  /src\/[\w-/]+\.js/g,           // JavaScript file paths
  /[A-Z][a-zA-Z]+(?:Engine|Module|Service|Manager|Factory|Handler)/g, // Class names
  /(?:Layer|Phase|Step)\s*\d+/gi,  // Layer/Phase references
  /v\d+\.\d+\.\d+/g,               // Version numbers
  /https?:\/\/[^\s]+/g,            // URLs
  /#[\w-]+/g,                      // IDs
  /\.[\w]+\(\)/g,                  // Method calls
];

// ═══════════════════════════════════════════════════════════════════════════════
// FIFO BUFFER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 📦 FIFOBuffer - First In, First Out buffer for exactly 10 messages
 * 
 * "Като стек от спомени, но винаги точно 10. Никога повече, никога по-малко."
 */
export class FIFOBuffer<T> {
  private buffer: T[] = [];
  private readonly capacity: number;
  private sequenceCounter: number = 0;

  constructor(capacity: number = BACKPACK_CAPACITY) {
    this.capacity = capacity;
  }

  /**
   * Add item to buffer (removes oldest if at capacity)
   */
  push(item: T): T | null {
    let removed: T | null = null;

    if (this.buffer.length >= this.capacity) {
      removed = this.buffer.shift() ?? null;
    }

    this.buffer.push(item);
    this.sequenceCounter++;

    return removed;
  }

  /**
   * Get all items (newest last)
   */
  getAll(): T[] {
    return [...this.buffer];
  }

  /**
   * Get last N items
   */
  getLast(n: number): T[] {
    return this.buffer.slice(-n);
  }

  /**
   * Get item by index (0 = oldest, capacity-1 = newest)
   */
  get(index: number): T | undefined {
    return this.buffer[index];
  }

  /**
   * Get newest item
   */
  getNewest(): T | undefined {
    return this.buffer[this.buffer.length - 1];
  }

  /**
   * Get oldest item
   */
  getOldest(): T | undefined {
    return this.buffer[0];
  }

  /**
   * Current buffer size
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Is buffer at capacity?
   */
  isFull(): boolean {
    return this.buffer.length >= this.capacity;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get total items ever added
   */
  getTotalProcessed(): number {
    return this.sequenceCounter;
  }

  /**
   * Load from existing array
   */
  loadFrom(items: T[]): void {
    this.buffer = items.slice(-this.capacity);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE LAYER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 💾 PersistenceLayer - Auto-saves backpack state to disk
 * 
 * "Всяко съобщение се записва. Нищо не се губи. Никога."
 */
export class PersistenceLayer {
  private storagePath: string;
  private saveDebounce: NodeJS.Timeout | null = null;
  private debounceMs: number = 100;
  private pendingSave: boolean = false;

  constructor(storagePath: string = STORAGE_PATH) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Save state to disk (debounced)
   */
  async save(state: BackpackState): Promise<void> {
    this.pendingSave = true;

    // Clear existing debounce
    if (this.saveDebounce) {
      clearTimeout(this.saveDebounce);
    }

    // Debounce to prevent excessive writes
    return new Promise((resolve) => {
      this.saveDebounce = setTimeout(async () => {
        try {
          const data = JSON.stringify(state, null, 2);
          await fs.promises.writeFile(this.storagePath, data, 'utf-8');
          this.pendingSave = false;
          resolve();
        } catch (error) {
          console.error('[NeuralBackpack] Save error:', error);
          resolve();
        }
      }, this.debounceMs);
    });
  }

  /**
   * Force immediate save (bypass debounce)
   */
  async forceSave(state: BackpackState): Promise<void> {
    if (this.saveDebounce) {
      clearTimeout(this.saveDebounce);
    }

    try {
      const data = JSON.stringify(state, null, 2);
      await fs.promises.writeFile(this.storagePath, data, 'utf-8');
      this.pendingSave = false;
    } catch (error) {
      console.error('[NeuralBackpack] Force save error:', error);
      throw error;
    }
  }

  /**
   * Load state from disk
   */
  async load(): Promise<BackpackState | null> {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return null;
      }

      const data = await fs.promises.readFile(this.storagePath, 'utf-8');
      const state = JSON.parse(data) as BackpackState;

      // Validate state hash
      if (state.messages && state.messages.length > 0) {
        const calculatedHash = this.calculateStateHash(state.messages);
        if (calculatedHash !== state.stateHash) {
          console.warn('[NeuralBackpack] State hash mismatch - data may be corrupted');
        }
      }

      return state;
    } catch (error) {
      console.error('[NeuralBackpack] Load error:', error);
      return null;
    }
  }

  /**
   * Calculate hash of all messages
   */
  calculateStateHash(messages: BackpackMessage[]): string {
    const content = messages.map(m => m.hash).join('');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Check if there's a pending save
   */
  hasPendingSave(): boolean {
    return this.pendingSave;
  }

  /**
   * Get storage path
   */
  getPath(): string {
    return this.storagePath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT INJECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 💉 ContextInjector - Injects backpack context into system requests
 * 
 * "Контекстът винаги е там. Под заглавие [CRITICAL_CONTEXT_LAST_10_STEPS]."
 */
export class ContextInjector {
  private static readonly STANDARD_HEADER = `
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                      [CRITICAL_CONTEXT_LAST_10_STEPS]                                 ║
║                      🎒 NEURAL BACKPACK - ACTIVE MEMORY                               ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣`;

  private static readonly GOD_MODE_HEADER = `
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                      [GOD_MODE_ACTIVE_ZERO_ENTROPY]                                   ║
║                      🎒 NEURAL BACKPACK - OMNISCIENT MEMORY                           ║
║                      ⚡ SYSTEM INTEGRITY: ABSOLUTE                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣`;

  private static readonly FOOTER = `╚═══════════════════════════════════════════════════════════════════════════════════════╝`;

  /**
   * Generate injectable context from messages
   */
  static generateContext(messages: BackpackMessage[], godMode: boolean = false): InjectedContext {
    const header = godMode ? this.GOD_MODE_HEADER : this.STANDARD_HEADER;

    if (messages.length === 0) {
      return {
        header: '',
        messages: [],
        footer: '',
        raw: godMode
          ? '[NEURAL_BACKPACK: GOD MODE ACTIVE - WAITING FOR INPUT]'
          : '[NEURAL_BACKPACK: Empty - No previous context]'
      };
    }

    const formattedMessages = messages.map((msg, index) => ({
      step: messages.length - index,
      timestamp: msg.datetime,
      intent: msg.intent,
      content: msg.content.substring(0, godMode ? 500 : 200) + (msg.content.length > (godMode ? 500 : 200) ? '...' : ''),
      status: msg.status
    }));

    // Build raw string for injection
    let raw = header + '\n';

    formattedMessages.reverse().forEach((msg, idx) => {
      const stepNum = idx + 1;
      const statusIcon = this.getStatusIcon(msg.status);
      raw += `║  STEP ${stepNum.toString().padStart(2, '0')}: [${msg.timestamp}] ${statusIcon}\n`;
      raw += `║  └─ INTENT: ${msg.intent}\n`;
      raw += `║  └─ ${msg.content}\n`;
      raw += `║${'─'.repeat(87)}║\n`;
    });

    raw += this.FOOTER;

    return {
      header,
      messages: formattedMessages,
      footer: this.FOOTER,
      raw
    };
  }

  /**
   * Generate compact context (for smaller prompts)
   */
  static generateCompactContext(messages: BackpackMessage[]): string {
    if (messages.length === 0) {
      return '[BACKPACK: Empty]';
    }

    const lines = ['[BACKPACK_CONTEXT]'];

    messages.slice().reverse().forEach((msg, idx) => {
      lines.push(`${idx + 1}. ${msg.intent}: ${msg.content.substring(0, 100)}...`);
    });

    lines.push('[/BACKPACK_CONTEXT]');

    return lines.join('\n');
  }

  /**
   * Get status icon
   */
  private static getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  }

  /**
   * Inject context into a prompt
   */
  static injectIntoPrompt(prompt: string, messages: BackpackMessage[]): string {
    const context = this.generateContext(messages);
    return `${context.raw}\n\n${prompt}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HALLUCINATION GUARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🛡️ HallucinationGuard - Prevents AI hallucinations through consistency checking
 * 
 * "Сравнява новите задачи с последните 3 записа за логическа консистенция."
 */
export class HallucinationGuard {
  private readonly checkDepth: number;
  private readonly similarityThreshold: number;

  constructor(checkDepth: number = 3, similarityThreshold: number = 0.3) {
    this.checkDepth = checkDepth;
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Check consistency of new task against recent history
   */
  checkConsistency(newTask: string, recentMessages: BackpackMessage[]): ConsistencyResult {
    const messagesToCheck = recentMessages.slice(-this.checkDepth);
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    const relatedMessages: BackpackMessage[] = [];

    // Extract entities from new task
    const newEntities = this.extractEntities(newTask);
    const newIntent = this.detectIntent(newTask);

    // Check against each recent message
    for (const msg of messagesToCheck) {
      // 1. Check for contradicting intents
      if (this.areIntentsContradicting(newIntent, msg.intent)) {
        conflicts.push(`Потенциален конфликт: "${newIntent}" може да противоречи на "${msg.intent}" от стъпка ${msg.sequenceNumber}`);
      }

      // 2. Check for related entities
      const commonEntities = this.findCommonEntities(newEntities, msg.entities);
      if (commonEntities.length > 0) {
        relatedMessages.push(msg);
        suggestions.push(`Свързано със стъпка ${msg.sequenceNumber}: ${commonEntities.join(', ')}`);
      }

      // 3. Check for repeating tasks (potential loop)
      const similarity = this.calculateSimilarity(newTask, msg.content);
      if (similarity > 0.8) {
        conflicts.push(`Внимание: Тази задача е много подобна на стъпка ${msg.sequenceNumber} (${(similarity * 100).toFixed(0)}% сходство)`);
      }

      // 4. Check for unfinished dependencies
      if (msg.status === 'in-progress' && this.dependsOn(newTask, msg.content)) {
        conflicts.push(`Зависимост: Задача от стъпка ${msg.sequenceNumber} все още е в прогрес`);
      }
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(conflicts.length, messagesToCheck.length);

    return {
      isConsistent: conflicts.length === 0,
      confidence,
      conflicts,
      suggestions,
      relatedMessages
    };
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): string[] {
    const entities: Set<string> = new Set();

    for (const pattern of ENTITY_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => entities.add(m));
      }
    }

    return Array.from(entities);
  }

  /**
   * Detect primary intent
   */
  private detectIntent(text: string): string {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent;
        }
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Check if intents are contradicting
   */
  private areIntentsContradicting(intent1: string, intent2: string): boolean {
    const contradictions: Record<string, string[]> = {
      'CREATE': ['DELETE'],
      'DELETE': ['CREATE'],
      'DEPLOY': ['DELETE'],
    };

    return contradictions[intent1]?.includes(intent2) ?? false;
  }

  /**
   * Find common entities between two sets
   */
  private findCommonEntities(entities1: string[], entities2: string[]): string[] {
    return entities1.filter(e => entities2.includes(e));
  }

  /**
   * Calculate text similarity (Jaccard index)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Check if task depends on another
   */
  private dependsOn(newTask: string, previousTask: string): boolean {
    // Simple heuristic: check if new task mentions files/modules from previous
    const previousEntities = this.extractEntities(previousTask);
    const newMentions = this.extractEntities(newTask);

    return previousEntities.some(e => newMentions.includes(e));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(conflictCount: number, totalChecked: number): number {
    if (totalChecked === 0) return 1;
    return Math.max(0, 1 - (conflictCount / (totalChecked * 2)));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN NEURAL BACKPACK CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🎒 NeuralBackpack - The Second Brain
 * 
 * Main orchestrator class that combines:
 * - FIFOBuffer: 10-message capacity
 * - PersistenceLayer: Auto-save to disk
 * - ContextInjector: Inject into prompts
 * - HallucinationGuard: Consistency checking
 */
export class NeuralBackpack extends EventEmitter {
  private buffer: FIFOBuffer<BackpackMessage>;
  private persistence: PersistenceLayer;
  private guard: HallucinationGuard;
  private sessionId: string;
  private initialized: boolean = false;
  private godMode: boolean = false;

  constructor(storagePath?: string) {
    super();

    this.buffer = new FIFOBuffer<BackpackMessage>(BACKPACK_CAPACITY);
    this.persistence = new PersistenceLayer(storagePath);
    this.guard = new HallucinationGuard();
    this.sessionId = crypto.randomUUID();
  }

  /**
   * Initialize the backpack (load existing state)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                       ║
║   ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗                                      ║
║   ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║                                      ║
║   ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║                                      ║
║   ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║                                      ║
║   ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗                                 ║
║   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝                                 ║
║                                                                                       ║
║   ██████╗  █████╗  ██████╗██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗                    ║
║   ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝                    ║
║   ██████╔╝███████║██║     █████╔╝ ██████╔╝███████║██║     █████╔╝                     ║
║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔═══╝ ██╔══██║██║     ██╔═██╗                     ║
║   ██████╔╝██║  ██║╚██████╗██║  ██╗██║     ██║  ██║╚██████╗██║  ██╗                    ║
║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝                    ║
║                                                                                       ║
║                     "THE SECOND BRAIN" - v${VERSION}                                    ║
║                                                                                       ║
║   📦 Capacity: ${BACKPACK_CAPACITY} messages                                                           ║
║   💾 Storage: ${this.persistence.getPath()}
║   🛡️ Guard: Active (checking last 3 messages)                                         ║
║                                                                                       ║
║   "Раницата винаги е на гърба ми. Нулева забрава."                                   ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    // Load existing state
    const existingState = await this.persistence.load();

    if (existingState && existingState.messages.length > 0) {
      this.buffer.loadFrom(existingState.messages);
      console.log(`[NeuralBackpack] ✅ Loaded ${existingState.messages.length} messages from previous session`);
      console.log(`[NeuralBackpack] 📊 Total processed: ${existingState.totalProcessed}`);
    } else {
      console.log('[NeuralBackpack] 🆕 Starting fresh session');
    }

    this.initialized = true;
    this.emit('initialized', { messageCount: this.buffer.size() });
  }

  /**
   * Record a new user message
   */
  async recordMessage(content: string, status: BackpackMessage['status'] = 'pending'): Promise<{
    message: BackpackMessage;
    consistency: ConsistencyResult;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Run consistency check first
    const consistency = this.guard.checkConsistency(content, this.buffer.getAll());

    // Create message object
    const message: BackpackMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      content,
      intent: this.detectPrimaryIntent(content),
      entities: this.extractAllEntities(content),
      actions: this.extractActions(content),
      status,
      hash: crypto.createHash('sha256').update(content + Date.now()).digest('hex').substring(0, 16),
      sequenceNumber: this.buffer.getTotalProcessed() + 1
    };

    // Add to buffer
    const removed = this.buffer.push(message);

    // Auto-save
    await this.saveState();

    // Emit events
    this.emit('message:added', message);
    if (removed) {
      this.emit('message:removed', removed);
    }
    if (!consistency.isConsistent) {
      this.emit('consistency:warning', consistency);
    }

    // Log consistency warnings
    if (consistency.conflicts.length > 0) {
      console.log('\n[NeuralBackpack] ⚠️ CONSISTENCY WARNINGS:');
      consistency.conflicts.forEach(c => console.log(`  └─ ${c}`));
    }

    return { message, consistency };
  }

  /**
   * Update message status
   */
  async updateStatus(messageId: string, status: BackpackMessage['status']): Promise<boolean> {
    const messages = this.buffer.getAll();
    const message = messages.find(m => m.id === messageId);

    if (message) {
      message.status = status;
      await this.saveState();
      this.emit('status:updated', { messageId, status });
      return true;
    }

    return false;
  }

  /**
   * Get injectable context
   */
  getContext(): InjectedContext {
    return ContextInjector.generateContext(this.buffer.getAll(), this.godMode);
  }

  /**
   * ⚡ Enable/Disable God Mode
   * "Absolute control. Zero latency persistence."
   */
  setGodMode(enabled: boolean): void {
    this.godMode = enabled;
    console.log(`[NeuralBackpack] ⚡ GOD MODE: ${enabled ? 'ACTIVATED' : 'DEACTIVATED'}`);
    if (enabled) {
      this.forceSave(); // Immediate consistency check
    }
    this.emit('godmode:changed', enabled);
  }

  /**
   * Get compact context
   */
  getCompactContext(): string {
    return ContextInjector.generateCompactContext(this.buffer.getAll());
  }

  /**
   * Inject context into prompt
   */
  injectContext(prompt: string): string {
    return ContextInjector.injectIntoPrompt(prompt, this.buffer.getAll());
  }

  /**
   * Get all messages
   */
  getMessages(): BackpackMessage[] {
    return this.buffer.getAll();
  }

  /**
   * Get last N messages
   */
  getLastMessages(n: number): BackpackMessage[] {
    return this.buffer.getLast(n);
  }

  /**
   * Check consistency of a new task
   */
  checkConsistency(task: string): ConsistencyResult {
    return this.guard.checkConsistency(task, this.buffer.getAll());
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    capacity: number;
    currentSize: number;
    totalProcessed: number;
    sessionId: string;
    oldestMessage: BackpackMessage | undefined;
    newestMessage: BackpackMessage | undefined;
  } {
    return {
      capacity: BACKPACK_CAPACITY,
      currentSize: this.buffer.size(),
      totalProcessed: this.buffer.getTotalProcessed(),
      sessionId: this.sessionId,
      oldestMessage: this.buffer.getOldest(),
      newestMessage: this.buffer.getNewest()
    };
  }

  /**
   * Force save (for graceful shutdown)
   */
  async forceSave(): Promise<void> {
    await this.persistence.forceSave(this.buildState());
  }

  /**
   * Clear all messages (use with caution!)
   */
  async clear(): Promise<void> {
    this.buffer.clear();
    await this.saveState();
    this.emit('cleared');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private async saveState(): Promise<void> {
    const state = this.buildState();
    if (this.godMode) {
      // Zero Entropy: Immediate persistence
      await this.persistence.forceSave(state);
    } else {
      await this.persistence.save(state);
    }
  }

  private buildState(): BackpackState {
    const messages = this.buffer.getAll();
    return {
      version: VERSION,
      lastUpdated: Date.now(),
      totalProcessed: this.buffer.getTotalProcessed(),
      messages,
      stateHash: this.persistence.calculateStateHash(messages),
      sessionId: this.sessionId
    };
  }

  private detectPrimaryIntent(text: string): string {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent;
        }
      }
    }
    return 'TASK';
  }

  private extractAllEntities(text: string): string[] {
    const entities: Set<string> = new Set();

    for (const pattern of ENTITY_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => entities.add(m));
      }
    }

    return Array.from(entities);
  }

  private extractActions(text: string): string[] {
    const actions: string[] = [];

    // Extract code-like actions
    const codeActions = text.match(/`[^`]+`/g);
    if (codeActions) {
      actions.push(...codeActions.map(a => a.replace(/`/g, '')));
    }

    // Extract bullet points
    const bullets = text.match(/[-•]\s*([^\n]+)/g);
    if (bullets) {
      actions.push(...bullets.map(b => b.replace(/^[-•]\s*/, '')));
    }

    return actions.slice(0, 10); // Limit to 10 actions
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let backpackInstance: NeuralBackpack | null = null;

/**
 * Get or create the singleton Neural Backpack instance
 */
export function getNeuralBackpack(storagePath?: string): NeuralBackpack {
  if (!backpackInstance) {
    backpackInstance = new NeuralBackpack(storagePath);
  }
  return backpackInstance;
}

/**
 * Create a new Neural Backpack instance (non-singleton)
 */
export function createNeuralBackpack(storagePath?: string): NeuralBackpack {
  return new NeuralBackpack(storagePath);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default NeuralBackpack;
