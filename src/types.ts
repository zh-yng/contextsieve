export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  isActive: boolean; // if false, excluded from context window sent to model
  isPinned?: boolean; // if true, exempt from auto-pruning/summarizing
  isSummarized?: boolean; // if this is an AI-generated summary of past turns
  summarizedMessageIds?: string[]; // IDs of messages replaced by this summary
}

export interface ContextBreakdown {
  systemTokens: number;
  userTokens: number;
  modelTokens: number;
  totalTokens: number;
  maxTokens: number;
  usagePercentage: number;
  messageCount: number;
  activeMessageCount: number;
}

export interface ContextBudgetOption {
  id: string;
  label: string;
  tokens: number;
  description: string;
}

export interface ModelOption {
  id: string;
  name: string;
  maxContextTokens: number;
  description: string;
  isDefault?: boolean;
}

export interface TokenCountResponse {
  totalTokens: number;
  messageTokens?: { id: string; tokens: number }[];
}

export interface SummarizeRequest {
  messages: { role: 'user' | 'model' | 'system'; content: string; id: string }[];
  instruction?: string;
}

export interface SummarizeResponse {
  summary: string;
  originalTokens: number;
  summaryTokens: number;
  tokensSaved: number;
}
