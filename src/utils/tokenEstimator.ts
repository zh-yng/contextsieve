import { ChatMessage, ContextBreakdown, ContextBudgetOption } from '../types';

export const CONTEXT_BUDGET_PRESETS: ContextBudgetOption[] = [
  {
    id: 'compact-2k',
    label: '2,000 Tokens (Demo/Test)',
    tokens: 2000,
    description: 'Ultra-compact budget to quickly test near-full context warnings & pruning.',
  },
  {
    id: 'compact-4k',
    label: '4,000 Tokens (Compact)',
    tokens: 4000,
    description: 'Compact context window ideal for focused, fast-turn interactions.',
  },
  {
    id: 'standard-8k',
    label: '8,000 Tokens (Standard)',
    tokens: 8000,
    description: 'Balanced context budget for standard project workflows.',
  },
  {
    id: 'medium-32k',
    label: '32,000 Tokens (Extended)',
    tokens: 32000,
    description: 'Extended context budget for medium-length transcripts and code blocks.',
  },
  {
    id: 'large-128k',
    label: '128,000 Tokens (Large)',
    tokens: 128000,
    description: 'High capacity for extensive documentation and transcripts.',
  },
  {
    id: 'native-1m',
    label: '1,048,576 Tokens (Gemini 1M Native)',
    tokens: 1048576,
    description: 'Full native 1M token context capacity of Gemini 3.1 Flash Lite.',
  },
];

/**
 * Fast client-side token estimator (heuristic ~4 chars per token for English text & code overhead)
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  // Account for words and special tokens
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Blend char-based and word-based estimation
  const tokenEst = Math.ceil((chars / 3.8 + words * 1.25) / 2);
  return Math.max(1, tokenEst);
}

/**
 * Calculate token breakdown for a given list of messages and system prompt
 */
export function calculateContextBreakdown(
  messages: ChatMessage[],
  systemPrompt: string,
  maxBudget: number
): ContextBreakdown {
  const systemTokens = estimateTokens(systemPrompt);

  let userTokens = 0;
  let modelTokens = 0;
  let activeCount = 0;

  for (const msg of messages) {
    if (msg.isActive) {
      activeCount++;
      const msgTokens = msg.tokens ?? estimateTokens(msg.content);
      if (msg.role === 'user') {
        userTokens += msgTokens;
      } else if (msg.role === 'model') {
        modelTokens += msgTokens;
      }
    }
  }

  const totalTokens = systemTokens + userTokens + modelTokens;
  const usagePercentage = maxBudget > 0 ? (totalTokens / maxBudget) * 100 : 0;

  return {
    systemTokens,
    userTokens,
    modelTokens,
    totalTokens,
    maxTokens: maxBudget,
    usagePercentage: Math.min(100, Math.round(usagePercentage * 10) / 10),
    messageCount: messages.length,
    activeMessageCount: activeCount,
  };
}

/**
 * Sample simulation data to easily fill context for testing near-full behavior
 */
export const SAMPLE_FILL_PAYLOADS = [
  {
    title: '📄 System Architecture & API Spec (Simulated ~800 tokens)',
    tokens: 800,
    role: 'user' as const,
    content: `Here is the comprehensive System Architecture & API Specification for our distributed analytics engine:

### Core Microservices Architecture
1. **Ingress Gateway Service**: Terminating HTTP/3 and TLS 1.3 connections, parsing JSON payload envelopes, enforcing JWT authentication and dynamic rate limits based on client tier (Enterprise: 50,000 req/min, Pro: 5,000 req/min).
2. **Stream Processing Cluster**: Built on Apache Flink and Kafka pipelines with 32 topic partitions. Events are keyed by tenant ID and session hash to ensure strict in-order causal processing.
3. **Storage Tier**: Dual-layer architecture with Hot-tier RocksDB for 24-hour sliding window aggregations, and Cold-tier Parquet columnar stores on Cloud Storage with hourly partition compaction.
4. **Query & Metric Aggregation Engine**: Distributed Presto/Trino cluster running across 8 worker nodes, supporting analytical queries with p99 response times under 250ms for 10M record scans.

### API Endpoints Reference
- \`POST /v2/telemetry/ingest\`: Ingests high-frequency time-series batches with payload checksum validation.
- \`GET /v2/analytics/metrics/rollup\`: Generates multi-dimensional metric rollups across arbitrary dimensions.
- \`DELETE /v2/privacy/gdpr/purge\`: Performs cryptographic erasure across hot and cold partition stores.

Please keep all these architecture constraints and rate limits in mind for subsequent questions!`,
  },
  {
    title: '💻 Full-Stack React & Node TypeScript Codebase (Simulated ~1,500 tokens)',
    tokens: 1500,
    role: 'user' as const,
    content: `Here is our complete TypeScript codebase implementation for review:

\`\`\`typescript
// src/services/orchestrator.ts
import { EventEmitter } from 'events';
import { RedisCluster } from 'ioredis';
import { Logger } from '../utils/logger';

export interface TaskPayload {
  id: string;
  tenantId: string;
  type: 'SYNC' | 'ANALYZE' | 'PURGE';
  priority: number;
  retryCount: number;
  payload: Record<string, unknown>;
  createdAt: number;
}

export class TaskOrchestrator extends EventEmitter {
  private redis: RedisCluster;
  private logger: Logger;
  private isRunning: boolean = false;
  private workerPool: Map<string, Promise<void>> = new Map();

  constructor(redisConfig: { nodes: string[]; keyPrefix: string }) {
    super();
    this.redis = new RedisCluster(redisConfig.nodes, {
      redisOptions: {
        keyPrefix: redisConfig.keyPrefix,
        lazyConnect: true,
      },
    });
    this.logger = new Logger('TaskOrchestrator');
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.info('Connected to Redis Cluster');
      this.isRunning = true;
      this.startPollLoop();
    } catch (err) {
      this.logger.error('Failed to initialize Redis cluster connection', err);
      throw err;
    }
  }

  private async startPollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const item = await this.redis.zpopmin('queue:high_priority', 1);
        if (item && item.length > 0) {
          const task: TaskPayload = JSON.parse(item[0]);
          await this.executeTaskWithRetry(task);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (pollErr) {
        this.logger.warn('Polling error encountered, cooling down...', pollErr);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  private async executeTaskWithRetry(task: TaskPayload): Promise<void> {
    const taskId = task.id;
    this.logger.info(\`Executing task \${taskId} of type \${task.type}\`);
    try {
      // Execute business logic handler
      await this.dispatchToWorker(task);
      this.emit('task:completed', { taskId, status: 'SUCCESS' });
    } catch (error) {
      if (task.retryCount < 3) {
        task.retryCount++;
        const backoff = Math.pow(2, task.retryCount) * 1000;
        await this.redis.zadd('queue:high_priority', Date.now() + backoff, JSON.stringify(task));
        this.logger.warn(\`Retrying task \${taskId} in \${backoff}ms (attempt \${task.retryCount})\`);
      } else {
        await this.redis.lpush('queue:dead_letter', JSON.stringify({ task, error: String(error) }));
        this.emit('task:failed', { taskId, error });
      }
    }
  }

  private async dispatchToWorker(task: TaskPayload): Promise<void> {
    // Simulated heavy worker execution
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;
    await Promise.all(Array.from(this.workerPool.values()));
    await this.redis.quit();
    this.logger.info('Gracefully stopped task orchestrator.');
  }
}
\`\`\`

Please analyze any potential edge cases in error handling, backoff scheduling, and Redis cluster failover handling.`,
  },
  {
    title: '📑 Multi-turn Product Strategy & Requirements (Simulated ~2,200 tokens)',
    tokens: 2200,
    role: 'user' as const,
    content: `Here is our 10-page Product Strategy and Q3-Q4 Execution Roadmap document:

### Executive Summary
Our platform provides enterprise real-time observability across multi-cloud Kubernetes clusters. In Q3 and Q4, we are introducing automated root-cause isolation using generative anomaly synthesis and semantic trace indexing.

### User Personas & JTBD (Jobs To Be Done)
1. **DevOps / Site Reliability Engineers**:
   - *Core Job*: Minimize MTTR (Mean Time To Resolution) during high-severity production incidents.
   - *Frustrations*: Alert fatigue from noisy threshold monitors; fragmented log stores across AWS, GCP, and on-premises datacenters.
2. **Platform Engineering Leads**:
   - *Core Job*: Provide self-service golden paths for 200+ internal developers with automated cost guardrails.
   - *Frustrations*: Unmonitored runaway egress costs and unindexed log floods during debugging sessions.
3. **Security / Compliance Officers**:
   - *Core Job*: Guarantee SOC2 and HIPAA compliance without impeding developer velocity.
   - *Frustrations*: Unredacted PII in debug log streams and unauthorized schema mutations.

### Key Milestones & Deliverables
- **M1 (August 31)**: Dynamic Context Pruning Engine for incident log indexing.
- **M2 (September 30)**: Automated semantic clustering of distributed trace spans.
- **M3 (October 31)**: Cross-cluster federated metric query proxy with eBPF hooks.
- **M4 (December 15)**: General Availability release and SOC2 Type II audit completion.

Please verify this against our engineering capacity and let me know the highest-risk critical path items!`,
  },
];
