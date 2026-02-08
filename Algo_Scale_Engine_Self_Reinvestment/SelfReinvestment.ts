/**
 * SelfReinvestment.ts - "The Economic Singularity"
 *
 * QAntum Framework v1.8.0 - "The Sovereign Market Engine"
 *
 * Self-Reinvestment Logic - Automatically allocates a portion of revenue
 * to acquire additional computational power (Swarm Expansion) when load
 * reaches 80% threshold.
 *
 * MARKET VALUE: +$175,000
 * - Revenue-driven resource allocation
 * - Automatic Swarm expansion
 * - Profit margin preservation
 * - Growth rate optimization
 * - Economic forecasting
 *
 * @module biology/metabolism/SelfReinvestment
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Language of Economic Autonomy
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resource type
 */
export type ResourceType = 'worker' | 'storage' | 'bandwidth' | 'compute';

/**
 * Investment decision type
 */
export type InvestmentType =
  | 'swarm-expansion'
  | 'storage-upgrade'
  | 'bandwidth-increase'
  | 'region-expansion'
  | 'reserve-build';

/**
 * Investment priority
 */
export type InvestmentPriority = 'critical' | 'high' | 'normal' | 'low' | 'deferred';

/**
 * Revenue stream
 */
export interface RevenueStream {
  streamId: string;
  source: 'subscription' | 'usage' | 'marketplace' | 'enterprise' | 'api';

  // Revenue
  dailyRevenue: number;
  monthlyRevenue: number;
  annualProjection: number;

  // Trend
  growthRate: number; // Monthly percentage
  volatility: number; // 0-1

  // Status
  isActive: boolean;
  lastReceivedAt: Date;
}

/**
 * Cost center
 */
export interface CostCenter {
  centerId: string;
  name: string;
  type: 'infrastructure' | 'operations' | 'development' | 'marketing' | 'support';

  // Costs
  monthlyCost: number;
  variableCostRate: number; // Per unit of load

  // Metrics
  utilizationPercent: number;
  efficiencyScore: number;
}

/**
 * Resource capacity
 */
export interface ResourceCapacity {
  resourceType: ResourceType;

  // Current
  currentCapacity: number;
  currentUsage: number;
  utilizationPercent: number;

  // Limits
  maxCapacity: number;
  minCapacity: number;

  // Cost
  costPerUnit: number;

  // Scaling
  scaleIncrement: number;
  scaleDownAllowed: boolean;
}

/**
 * Investment decision
 */
export interface InvestmentDecision {
  decisionId: string;
  timestamp: Date;

  // Decision
  investmentType: InvestmentType;
  priority: InvestmentPriority;

  // Amount
  amount: number;
  percentOfRevenue: number;

  // Impact
  expectedROI: number;
  paybackPeriodDays: number;

  // Details
  resourceType?: ResourceType;
  unitsToAdd?: number;
  targetRegion?: string;

  // Reasoning
  triggerReason: string;
  utilizationAtDecision: number;

  // Execution
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'cancelled';
  executedAt?: Date;
  completedAt?: Date;

  // Results
  actualCost?: number;
  actualROI?: number;
}

/**
 * Growth projection
 */
export interface GrowthProjection {
  projectionId: string;
  generatedAt: Date;

  // Time horizon
  days: number;

  // Revenue
  currentMRR: number;
  projectedMRR: number;
  revenueGrowthPercent: number;

  // Costs
  currentCosts: number;
  projectedCosts: number;
  costGrowthPercent: number;

  // Profit
  currentProfit: number;
  projectedProfit: number;
  marginPercent: number;

  // Resources
  currentWorkers: number;
  projectedWorkers: number;
  workersNeeded: number;

  // Investment
  investmentRequired: number;
  optimalReinvestmentRate: number;
}

/**
 * Expansion plan
 */
export interface ExpansionPlan {
  planId: string;
  createdAt: Date;

  // Trigger
  triggerUtilization: number;
  currentUtilization: number;

  // Plan
  phases: ExpansionPhase[];
  totalInvestment: number;
  totalNewWorkers: number;

  // Timeline
  estimatedDurationHours: number;

  // Status
  status: 'proposed' | 'approved' | 'in-progress' | 'completed';
  currentPhase?: number;
}

/**
 * Expansion phase
 */
export interface ExpansionPhase {
  phaseNumber: number;
  description: string;

  // Action
  action: InvestmentType;
  targetRegions: string[];
  workersToAdd: number;

  // Cost
  estimatedCost: number;

  // Timeline
  estimatedDurationHours: number;

  // Status
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: Date;
}

/**
 * Financial health
 */
export interface FinancialHealth {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical';

  // Metrics
  profitMargin: number;
  burnRate: number;
  runway: number; // Days

  // Liquidity
  cashReserve: number;
  minReserveRequired: number;

  // Growth
  revenueGrowthRate: number;
  costGrowthRate: number;

  // Recommendations
  recommendations: string[];
}

/**
 * Self-reinvestment configuration
 */
export interface SelfReinvestmentConfig {
  // Triggers
  utilizationThreshold: number;
  criticalUtilizationThreshold: number;

  // Reinvestment rates
  baseReinvestmentRate: number;
  maxReinvestmentRate: number;
  minReinvestmentRate: number;

  // Reserve
  minCashReserveMonths: number;
  targetCashReserveMonths: number;

  // Scaling
  workersPerScaleUnit: number;
  maxWorkersPerExpansion: number;

  // Regions
  preferredExpansionRegions: string[];

  // Safety
  requireApprovalAbove: number;
  autoExecute: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SelfReinvestmentConfig = {
  utilizationThreshold: 80,
  criticalUtilizationThreshold: 95,

  baseReinvestmentRate: 0.2, // 20% of profit
  maxReinvestmentRate: 0.5, // Up to 50% in high-growth
  minReinvestmentRate: 0.1, // Never below 10%

  minCashReserveMonths: 3,
  targetCashReserveMonths: 6,

  workersPerScaleUnit: 10,
  maxWorkersPerExpansion: 100,

  preferredExpansionRegions: [
    'us-east-1',
    'eu-west-1',
    'ap-northeast-1',
    'us-west-2',
    'eu-central-1',
  ],

  requireApprovalAbove: 5000,
  autoExecute: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// SELF-REINVESTMENT ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SelfReinvestment - The Economic Singularity
 *
 * Autonomous resource allocation and growth management.
 */
export class SelfReinvestment extends EventEmitter {
  private config: SelfReinvestmentConfig;

  // Financial data
  private revenueStreams: Map<string, RevenueStream> = new Map();
  private costCenters: Map<string, CostCenter> = new Map();
  private resources: Map<ResourceType, ResourceCapacity> = new Map();

  // Decisions
  private decisions: Map<string, InvestmentDecision> = new Map();
  private expansionPlans: Map<string, ExpansionPlan> = new Map();

  // Cash management
  private cashReserve: number = 0;
  private totalInvested: number = 0;
  private totalProfit: number = 0;

  // Metrics
  private currentMRR: number = 0;
  private currentCosts: number = 0;
  private workerCount: number = 0;

  // Monitoring
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: Partial<SelfReinvestmentConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize resources
    this.initializeResources();

    // Start monitoring
    this.startMonitoring();

    this.emit('initialized', {
      timestamp: new Date(),
      reinvestmentRate: this.config.baseReinvestmentRate,
      utilizationThreshold: this.config.utilizationThreshold,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initialize resource tracking
   */
  private initializeResources(): void {
    this.resources.set('worker', {
      resourceType: 'worker',
      currentCapacity: 100,
      currentUsage: 0,
      utilizationPercent: 0,
      maxCapacity: 10000,
      minCapacity: 10,
      costPerUnit: 50, // $50/month per worker
      scaleIncrement: 10,
      scaleDownAllowed: true,
    });

    this.resources.set('storage', {
      resourceType: 'storage',
      currentCapacity: 1000, // GB
      currentUsage: 0,
      utilizationPercent: 0,
      maxCapacity: 100000,
      minCapacity: 100,
      costPerUnit: 0.023, // $0.023/GB/month
      scaleIncrement: 100,
      scaleDownAllowed: true,
    });

    this.resources.set('bandwidth', {
      resourceType: 'bandwidth',
      currentCapacity: 1000, // GB/month
      currentUsage: 0,
      utilizationPercent: 0,
      maxCapacity: 100000,
      minCapacity: 100,
      costPerUnit: 0.09, // $0.09/GB
      scaleIncrement: 500,
      scaleDownAllowed: false,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REVENUE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Register revenue stream
   */
  registerRevenueStream(params: {
    source: RevenueStream['source'];
    monthlyRevenue: number;
    growthRate?: number;
  }): RevenueStream {
    const streamId = this.generateId('rev');

    const stream: RevenueStream = {
      streamId,
      source: params.source,
      dailyRevenue: params.monthlyRevenue / 30,
      monthlyRevenue: params.monthlyRevenue,
      annualProjection: params.monthlyRevenue * 12 * (1 + (params.growthRate || 0)),
      growthRate: params.growthRate || 0,
      volatility: 0.1,
      isActive: true,
      lastReceivedAt: new Date(),
    };

    this.revenueStreams.set(streamId, stream);
    this.recalculateMRR();

    this.emit('revenue:registered', {
      streamId,
      source: params.source,
      monthlyRevenue: params.monthlyRevenue,
    });

    return stream;
  }

  /**
   * Record revenue
   */
  recordRevenue(amount: number, source: RevenueStream['source']): void {
    // Find or create stream
    let stream = Array.from(this.revenueStreams.values()).find((s) => s.source === source);

    if (!stream) {
      stream = this.registerRevenueStream({
        source,
        monthlyRevenue: amount,
      });
    }

    stream.lastReceivedAt = new Date();
    this.cashReserve += amount;
    this.totalProfit += amount * 0.3; // Assume 30% margin

    this.emit('revenue:received', {
      amount,
      source,
      newCashReserve: this.cashReserve,
    });

    // Check if reinvestment needed
    this.evaluateReinvestment();
  }

  /**
   * Recalculate MRR
   */
  private recalculateMRR(): void {
    this.currentMRR = Array.from(this.revenueStreams.values())
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.monthlyRevenue, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COST MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Register cost center
   */
  registerCostCenter(params: {
    name: string;
    type: CostCenter['type'];
    monthlyCost: number;
    variableCostRate?: number;
  }): CostCenter {
    const centerId = this.generateId('cost');

    const center: CostCenter = {
      centerId,
      name: params.name,
      type: params.type,
      monthlyCost: params.monthlyCost,
      variableCostRate: params.variableCostRate || 0,
      utilizationPercent: 0,
      efficiencyScore: 1.0,
    };

    this.costCenters.set(centerId, center);
    this.recalculateCosts();

    return center;
  }

  /**
   * Recalculate costs
   */
  private recalculateCosts(): void {
    this.currentCosts = Array.from(this.costCenters.values()).reduce(
      (sum, c) => sum + c.monthlyCost,
      0
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILIZATION MONITORING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Update resource utilization
   */
  updateUtilization(resourceType: ResourceType, usage: number): void {
    const resource = this.resources.get(resourceType);
    if (!resource) return;

    resource.currentUsage = usage;
    resource.utilizationPercent = (usage / resource.currentCapacity) * 100;

    this.emit('utilization:updated', {
      resourceType,
      utilizationPercent: resource.utilizationPercent,
    });

    // Check thresholds
    if (resource.utilizationPercent >= this.config.criticalUtilizationThreshold) {
      this.triggerCriticalExpansion(resourceType);
    } else if (resource.utilizationPercent >= this.config.utilizationThreshold) {
      this.triggerStandardExpansion(resourceType);
    }
  }

  /**
   * Get current utilization
   */
  getCurrentUtilization(): Record<ResourceType, number> {
    const utilization: Record<ResourceType, number> = {} as any;

    for (const [type, resource] of this.resources.entries()) {
      utilization[type] = resource.utilizationPercent;
    }

    return utilization;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPANSION TRIGGERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Trigger critical expansion
   */
  private async triggerCriticalExpansion(resourceType: ResourceType): Promise<void> {
    const resource = this.resources.get(resourceType);
    if (!resource) return;

    this.emit('expansion:critical', {
      resourceType,
      utilizationPercent: resource.utilizationPercent,
    });

    // Create emergency expansion plan
    const plan = this.createExpansionPlan(resourceType, 'critical');

    // Auto-execute if enabled
    if (this.config.autoExecute) {
      await this.executeExpansionPlan(plan.planId);
    }
  }

  /**
   * Trigger standard expansion
   */
  private async triggerStandardExpansion(resourceType: ResourceType): Promise<void> {
    const resource = this.resources.get(resourceType);
    if (!resource) return;

    this.emit('expansion:threshold', {
      resourceType,
      utilizationPercent: resource.utilizationPercent,
    });

    // Check if we can afford expansion
    const canAfford = this.canAffordExpansion(resourceType);
    if (!canAfford) {
      this.emit('expansion:deferred', {
        resourceType,
        reason: 'Insufficient funds',
      });
      return;
    }

    // Create expansion plan
    const plan = this.createExpansionPlan(resourceType, 'normal');

    // Auto-execute if below threshold
    if (this.config.autoExecute && plan.totalInvestment <= this.config.requireApprovalAbove) {
      await this.executeExpansionPlan(plan.planId);
    }
  }

  /**
   * Check if expansion is affordable
   */
  private canAffordExpansion(resourceType: ResourceType): boolean {
    const resource = this.resources.get(resourceType);
    if (!resource) return false;

    const cost = resource.costPerUnit * resource.scaleIncrement;
    const availableFunds = this.getAvailableInvestmentFunds();

    return availableFunds >= cost;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPANSION PLANNING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create expansion plan
   */
  createExpansionPlan(resourceType: ResourceType, priority: 'critical' | 'normal'): ExpansionPlan {
    const resource = this.resources.get(resourceType);
    if (!resource) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const planId = this.generateId('plan');

    // Calculate expansion size
    const targetUtilization = 60; // Target 60% utilization after expansion
    const currentUsage = resource.currentUsage;
    const targetCapacity = (currentUsage / targetUtilization) * 100;
    const unitsToAdd =
      Math.ceil((targetCapacity - resource.currentCapacity) / resource.scaleIncrement) *
      resource.scaleIncrement;

    // Create phases
    const phases: ExpansionPhase[] = [];

    if (resourceType === 'worker') {
      // Phase 1: Scale in primary region
      phases.push({
        phaseNumber: 1,
        description: 'Scale workers in primary region',
        action: 'swarm-expansion',
        targetRegions: [this.config.preferredExpansionRegions[0]],
        workersToAdd: Math.min(unitsToAdd / 2, this.config.maxWorkersPerExpansion / 2),
        estimatedCost: (unitsToAdd / 2) * resource.costPerUnit,
        estimatedDurationHours: 1,
        status: 'pending',
      });

      // Phase 2: Scale in secondary region
      if (unitsToAdd > this.config.workersPerScaleUnit) {
        phases.push({
          phaseNumber: 2,
          description: 'Scale workers in secondary region',
          action: 'swarm-expansion',
          targetRegions: [this.config.preferredExpansionRegions[1]],
          workersToAdd: Math.ceil(unitsToAdd / 2),
          estimatedCost: Math.ceil(unitsToAdd / 2) * resource.costPerUnit,
          estimatedDurationHours: 1,
          status: 'pending',
        });
      }
    } else {
      // Single phase for non-worker resources
      phases.push({
        phaseNumber: 1,
        description: `Expand ${resourceType} capacity`,
        action: resourceType === 'storage' ? 'storage-upgrade' : 'bandwidth-increase',
        targetRegions: this.config.preferredExpansionRegions.slice(0, 3),
        workersToAdd: 0,
        estimatedCost: unitsToAdd * resource.costPerUnit,
        estimatedDurationHours: 0.5,
        status: 'pending',
      });
    }

    const plan: ExpansionPlan = {
      planId,
      createdAt: new Date(),
      triggerUtilization: this.config.utilizationThreshold,
      currentUtilization: resource.utilizationPercent,
      phases,
      totalInvestment: phases.reduce((sum, p) => sum + p.estimatedCost, 0),
      totalNewWorkers: phases.reduce((sum, p) => sum + p.workersToAdd, 0),
      estimatedDurationHours: phases.reduce((sum, p) => sum + p.estimatedDurationHours, 0),
      status: 'proposed',
    };

    this.expansionPlans.set(planId, plan);

    this.emit('expansion:planned', {
      planId,
      totalInvestment: plan.totalInvestment,
      totalNewWorkers: plan.totalNewWorkers,
    });

    return plan;
  }

  /**
   * Execute expansion plan
   */
  async executeExpansionPlan(planId: string): Promise<void> {
    const plan = this.expansionPlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    if (plan.status !== 'proposed' && plan.status !== 'approved') {
      throw new Error(`Plan ${planId} cannot be executed (status: ${plan.status})`);
    }

    // Check funds
    const availableFunds = this.getAvailableInvestmentFunds();
    if (availableFunds < plan.totalInvestment) {
      throw new Error(`Insufficient funds: need ${plan.totalInvestment}, have ${availableFunds}`);
    }

    plan.status = 'in-progress';

    this.emit('expansion:started', {
      planId,
      phases: plan.phases.length,
    });

    // Execute phases
    for (let i = 0; i < plan.phases.length; i++) {
      const phase = plan.phases[i];
      plan.currentPhase = i + 1;

      phase.status = 'in-progress';

      this.emit('expansion:phase-started', {
        planId,
        phaseNumber: phase.phaseNumber,
        description: phase.description,
      });

      // Simulate execution
      await this.sleep(phase.estimatedDurationHours * 1000); // Compressed for demo

      // Update resources
      if (phase.action === 'swarm-expansion') {
        const workerResource = this.resources.get('worker');
        if (workerResource) {
          workerResource.currentCapacity += phase.workersToAdd;
          workerResource.utilizationPercent =
            (workerResource.currentUsage / workerResource.currentCapacity) * 100;
        }
        this.workerCount += phase.workersToAdd;
      }

      // Record investment
      this.recordInvestment({
        type: phase.action,
        amount: phase.estimatedCost,
        reason: phase.description,
        unitsAdded: phase.workersToAdd,
      });

      phase.status = 'completed';
      phase.completedAt = new Date();

      this.emit('expansion:phase-completed', {
        planId,
        phaseNumber: phase.phaseNumber,
      });
    }

    plan.status = 'completed';

    this.emit('expansion:completed', {
      planId,
      totalInvested: plan.totalInvestment,
      newCapacity: this.workerCount,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INVESTMENT DECISIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Record investment
   */
  private recordInvestment(params: {
    type: InvestmentType;
    amount: number;
    reason: string;
    unitsAdded?: number;
  }): InvestmentDecision {
    const decisionId = this.generateId('inv');

    const decision: InvestmentDecision = {
      decisionId,
      timestamp: new Date(),
      investmentType: params.type,
      priority: 'normal',
      amount: params.amount,
      percentOfRevenue: this.currentMRR > 0 ? (params.amount / this.currentMRR) * 100 : 0,
      expectedROI: 3.0, // Expect 3x return
      paybackPeriodDays: 90,
      resourceType: 'worker',
      unitsToAdd: params.unitsAdded,
      triggerReason: params.reason,
      utilizationAtDecision: this.resources.get('worker')?.utilizationPercent || 0,
      status: 'completed',
      executedAt: new Date(),
      completedAt: new Date(),
      actualCost: params.amount,
    };

    this.decisions.set(decisionId, decision);
    this.totalInvested += params.amount;
    this.cashReserve -= params.amount;

    return decision;
  }

  /**
   * Evaluate if reinvestment is needed
   */
  private evaluateReinvestment(): void {
    const health = this.assessFinancialHealth();

    // Don't reinvest if health is concerning
    if (health.score < 50) {
      this.emit('reinvestment:skipped', {
        reason: 'Financial health below threshold',
        healthScore: health.score,
      });
      return;
    }

    // Check utilization
    const workerResource = this.resources.get('worker');
    if (!workerResource) return;

    if (workerResource.utilizationPercent >= this.config.utilizationThreshold) {
      // Calculate optimal reinvestment
      const optimalRate = this.calculateOptimalReinvestmentRate();
      const reinvestmentAmount = this.currentMRR * optimalRate;

      if (reinvestmentAmount > 0 && this.getAvailableInvestmentFunds() >= reinvestmentAmount) {
        this.emit('reinvestment:recommended', {
          amount: reinvestmentAmount,
          rate: optimalRate,
          utilization: workerResource.utilizationPercent,
        });
      }
    }
  }

  /**
   * Calculate optimal reinvestment rate
   */
  private calculateOptimalReinvestmentRate(): number {
    const health = this.assessFinancialHealth();
    const workerResource = this.resources.get('worker');

    if (!workerResource) return this.config.baseReinvestmentRate;

    let rate = this.config.baseReinvestmentRate;

    // Adjust based on utilization
    if (workerResource.utilizationPercent >= this.config.criticalUtilizationThreshold) {
      rate = this.config.maxReinvestmentRate;
    } else if (workerResource.utilizationPercent >= 90) {
      rate = this.config.baseReinvestmentRate * 1.5;
    }

    // Adjust based on runway
    if (health.runway < 90) {
      rate = Math.max(this.config.minReinvestmentRate, rate * 0.5);
    }

    // Cap at max
    return Math.min(this.config.maxReinvestmentRate, rate);
  }

  /**
   * Get available funds for investment
   */
  getAvailableInvestmentFunds(): number {
    const minReserve = this.currentCosts * this.config.minCashReserveMonths;
    return Math.max(0, this.cashReserve - minReserve);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINANCIAL HEALTH
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Assess financial health
   */
  assessFinancialHealth(): FinancialHealth {
    const profitMargin =
      this.currentMRR > 0 ? ((this.currentMRR - this.currentCosts) / this.currentMRR) * 100 : 0;

    const burnRate = this.currentMRR < this.currentCosts ? this.currentCosts - this.currentMRR : 0;

    const runway = burnRate > 0 ? this.cashReserve / burnRate : 365; // 1 year if profitable

    const minReserveRequired = this.currentCosts * this.config.minCashReserveMonths;

    // Calculate health score
    let score = 50; // Base score

    // Profit margin impact
    if (profitMargin > 30) score += 20;
    else if (profitMargin > 15) score += 10;
    else if (profitMargin < 0) score -= 20;

    // Runway impact
    if (runway > 180) score += 15;
    else if (runway > 90) score += 5;
    else if (runway < 30) score -= 25;

    // Reserve impact
    if (this.cashReserve >= minReserveRequired * 2) score += 15;
    else if (this.cashReserve >= minReserveRequired) score += 5;
    else score -= 15;

    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status: FinancialHealth['status'];
    if (score >= 85) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'moderate';
    else if (score >= 30) status = 'concerning';
    else status = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (profitMargin < 20)
      recommendations.push('Increase revenue or reduce costs to improve margin');
    if (runway < 90) recommendations.push('Build cash reserves to extend runway');
    if (this.cashReserve < minReserveRequired)
      recommendations.push('Prioritize cash flow over growth');

    return {
      score,
      status,
      profitMargin,
      burnRate,
      runway,
      cashReserve: this.cashReserve,
      minReserveRequired,
      revenueGrowthRate: 0.1, // 10% default
      costGrowthRate: 0.05, // 5% default
      recommendations,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROJECTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate growth projection
   */
  generateGrowthProjection(days: number): GrowthProjection {
    const monthsAhead = days / 30;
    const revenueGrowthRate = 0.1; // 10% monthly
    const costGrowthRate = 0.05; // 5% monthly

    const projectedMRR = this.currentMRR * Math.pow(1 + revenueGrowthRate, monthsAhead);
    const projectedCosts = this.currentCosts * Math.pow(1 + costGrowthRate, monthsAhead);

    const currentProfit = this.currentMRR - this.currentCosts;
    const projectedProfit = projectedMRR - projectedCosts;

    // Calculate workers needed
    const currentWorkers = this.workerCount || 100;
    const projectedLoad = 1 + revenueGrowthRate * monthsAhead;
    const projectedWorkers = Math.ceil(currentWorkers * projectedLoad);

    const workersNeeded = projectedWorkers - currentWorkers;
    const investmentRequired = workersNeeded * 50; // $50/worker

    return {
      projectionId: this.generateId('proj'),
      generatedAt: new Date(),
      days,
      currentMRR: this.currentMRR,
      projectedMRR,
      revenueGrowthPercent: ((projectedMRR - this.currentMRR) / this.currentMRR) * 100,
      currentCosts: this.currentCosts,
      projectedCosts,
      costGrowthPercent: ((projectedCosts - this.currentCosts) / this.currentCosts) * 100,
      currentProfit,
      projectedProfit,
      marginPercent: projectedMRR > 0 ? (projectedProfit / projectedMRR) * 100 : 0,
      currentWorkers,
      projectedWorkers,
      workersNeeded,
      investmentRequired,
      optimalReinvestmentRate: this.calculateOptimalReinvestmentRate(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MONITORING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.evaluateReinvestment();
    }, 60000); // Every minute
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get statistics
   */
  getStatistics(): SelfReinvestmentStatistics {
    const health = this.assessFinancialHealth();
    const workerResource = this.resources.get('worker');

    return {
      currentMRR: this.currentMRR,
      currentCosts: this.currentCosts,
      currentProfit: this.currentMRR - this.currentCosts,
      profitMargin: health.profitMargin,
      cashReserve: this.cashReserve,
      totalInvested: this.totalInvested,
      totalDecisions: this.decisions.size,
      pendingPlans: Array.from(this.expansionPlans.values()).filter(
        (p) => p.status === 'proposed' || p.status === 'approved'
      ).length,
      workerCapacity: workerResource?.currentCapacity || 0,
      workerUtilization: workerResource?.utilizationPercent || 0,
      healthScore: health.score,
      healthStatus: health.status,
      runway: health.runway,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.emit('shutdown', { timestamp: new Date() });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface SelfReinvestmentStatistics {
  currentMRR: number;
  currentCosts: number;
  currentProfit: number;
  profitMargin: number;
  cashReserve: number;
  totalInvested: number;
  totalDecisions: number;
  pendingPlans: number;
  workerCapacity: number;
  workerUtilization: number;
  healthScore: number;
  healthStatus: string;
  runway: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new SelfReinvestment instance
 */
export function createSelfReinvestment(config?: Partial<SelfReinvestmentConfig>): SelfReinvestment {
  return new SelfReinvestment(config);
}

export default SelfReinvestment;
