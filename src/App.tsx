/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Sliders,
  AlertTriangle,
  Send,
  MessageSquare,
  Bot,
  User,
  PlusCircle,
  HelpCircle,
  Zap,
  Info,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Flame,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Header } from './components/Header';
import { ContextAlertBanner } from './components/ContextAlertBanner';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { ContextInspector } from './components/ContextInspector';
import { ContextOptimizerModal } from './components/ContextOptimizerModal';
import { ContextBudgetModal } from './components/ContextBudgetModal';
import { SystemPromptModal } from './components/SystemPromptModal';
import { RawJsonModal } from './components/RawJsonModal';
import { ChatMessage, ModelOption } from './types';
import {
  calculateContextBreakdown,
  estimateTokens,
  SAMPLE_FILL_PAYLOADS,
} from './utils/tokenEstimator';

const INITIAL_SYSTEM_PROMPT =
  'You are a high-efficiency AI assistant on Gemini Context Studio. Provide clear, direct, and factual responses. When discussing code or architecture, be thorough and highlight key design considerations.';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    role: 'model',
    content: `👋 **Welcome to Gemini Context Studio!**

This application allows you to chat with Gemini while giving you complete visibility and dynamic control over the **Context Window**:

• **Live Token Telemetry**: See real-time token breakdown between System Prompt, User inputs, and Assistant outputs.
• **Near-Capacity Monitoring**: Receive proactive alerts when your context window approaches the capacity limit.
• **Interactive Modification Tools**:
  - ⚡ **AI Context Summarizer**: Compress older turns into dense executive briefings.
  - ✂️ **Sliding Window Pruning**: Keep recent turns while preserving pinned facts.
  - 👁️ **Active Context Toggling**: Exclude verbose messages from context without losing transcript history.
  - ✏️ **Inline Editing**: Trim long code or text directly in the active context window.

*Try asking a question or use the **"Fill Context Simulator"** in the Inspector to test near-full behavior immediately!*`,
    timestamp: Date.now(),
    tokens: 165,
    isActive: true,
    isPinned: true,
  },
];

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite (Default)',
    maxContextTokens: 1048576,
    description: 'Ultra-fast, low-latency Gemini 3.1 model with 1M native context capacity',
    isDefault: true,
  },
];

function cleanErrorMessage(rawError: any): string {
  if (!rawError) return 'An unexpected error occurred.';
  let msg = typeof rawError === 'string' ? rawError : rawError.message || String(rawError);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      return cleanErrorMessage(parsed.error.message);
    }
    if (parsed.message) {
      return cleanErrorMessage(parsed.message);
    }
  } catch {
    // not JSON
  }
  return msg;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('gemini_context_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_MESSAGES;
  });

  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('gemini_system_prompt') || INITIAL_SYSTEM_PROMPT;
  });

  // Default context budget limit for testing near-full behavior: 8,000 tokens
  const [maxBudget, setMaxBudget] = useState<number>(() => {
    const saved = localStorage.getItem('gemini_context_budget');
    return saved ? parseInt(saved, 10) : 8000;
  });

  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('gemini_context_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('gemini_system_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('gemini_context_budget', String(maxBudget));
  }, [maxBudget]);

  // Fetch models from server
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models)) {
          setAvailableModels(data.models);
        }
      })
      .catch((err) => console.log('Using default model configuration:', err));
  }, []);

  // Calculate live breakdown
  const breakdown = calculateContextBreakdown(messages, systemPrompt, maxBudget);
  const remainingTokens = Math.max(0, maxBudget - breakdown.totalTokens);

  // Auto scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Send message to Gemini
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setErrorMessage(null);

    const userTokens = estimateTokens(userText);
    const userMsgId = `user-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      tokens: userTokens,
      isActive: true,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Active context payload to send to model
    const activeContext = updatedMessages
      .filter((m) => m.isActive)
      .map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content,
      }));

    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    const botMsgId = `bot-${Date.now() + 1}`;
    const initialBotMessage: ChatMessage = {
      id: botMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      tokens: 0,
      isActive: true,
    };

    setMessages((prev) => [...prev, initialBotMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: activeContext,
          systemInstruction: systemPrompt,
          model: selectedModel,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                accumulatedText += data.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId
                      ? {
                          ...msg,
                          content: accumulatedText,
                          tokens: estimateTokens(accumulatedText),
                        }
                      : msg
                  )
                );
              }
              if (data.done && data.usage?.candidatesTokenCount) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId
                      ? {
                          ...msg,
                          content: data.fullText || accumulatedText,
                          tokens: data.usage.candidatesTokenCount,
                        }
                      : msg
                  )
                );
              }
            } catch (parseErr) {
              // chunk parse error
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const cleanMsg = cleanErrorMessage(err);
        console.error('Chat error:', cleanMsg);
        setErrorMessage(cleanMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Generation Error**: ${cleanMsg}\n\n*Tip: Try clicking SEND again or optimize context density with Prune/Summarize.*`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // Toggle single message in/out of context window
  const handleToggleActive = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  // Edit message content in context
  const handleEditMessage = (id: string, newContent: string) => {
    const newTokens = estimateTokens(newContent);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: newContent, tokens: newTokens } : m
      )
    );
  };

  // Delete message permanently
  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // AI Smart Summarize a specific range of messages
  const handleSmartSummarizeRange = async (messageIds: string[], instruction?: string) => {
    if (messageIds.length === 0) return;
    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const targetMessages = messages.filter((m) => messageIds.includes(m.id));
      const res = await fetch('/api/summarize-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: targetMessages.map((m) => ({
            role: m.role,
            content: m.content,
            id: m.id,
          })),
          instruction,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to compress context');
      }

      const data = await res.json();
      const summaryText = data.summary;
      const summaryTokens = data.summaryTokens || estimateTokens(summaryText);

      // Create compressed summary item
      const summaryMsg: ChatMessage = {
        id: `summary-${Date.now()}`,
        role: 'model',
        content: `**[Context Window Executive Briefing]**\n\n${summaryText}`,
        timestamp: Date.now(),
        tokens: summaryTokens,
        isActive: true,
        isPinned: true,
        isSummarized: true,
        summarizedMessageIds: messageIds,
      };

      // Mark original target messages as inactive (excluded from context)
      setMessages((prev) => {
        const updated = prev.map((m) =>
          messageIds.includes(m.id) ? { ...m, isActive: false } : m
        );
        // Find insert position: place summary after the last summarized message
        const lastIdx = prev.map((m) => m.id).lastIndexOf(messageIds[messageIds.length - 1]);
        if (lastIdx !== -1) {
          const next = [...updated];
          next.splice(lastIdx + 1, 0, summaryMsg);
          return next;
        }
        return [summaryMsg, ...updated];
      });
    } catch (err: any) {
      const cleanMsg = cleanErrorMessage(err);
      console.error('Summarize error:', cleanMsg);
      setErrorMessage(`Context compression error: ${cleanMsg}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Smart summarize all older turns
  const handleSmartSummarizeAllOlder = async (instruction?: string) => {
    // Collect all unsummarized messages except the last 2 turns
    const older = messages
      .filter((m) => !m.isPinned && !m.isSummarized && m.isActive)
      .slice(0, Math.max(1, messages.length - 2))
      .map((m) => m.id);

    if (older.length > 0) {
      await handleSmartSummarizeRange(older, instruction);
    }
  };

  // Sliding Window Pruning (supports turns and message counts, dynamically adjusting active state)
  const handlePruneOlder = (keepTurnsOrCount: number) => {
    setMessages((prev) => {
      // Find all unpinned messages
      const unpinnedMsgs = prev.filter((m) => !m.isPinned);
      if (unpinnedMsgs.length === 0) return prev;

      // In conversational turns: if keepTurnsOrCount is <= 10, treat as turns (each turn = 2 messages: user + assistant)
      // e.g. keepTurns = 1 -> keep last 2 messages
      // keepTurns = 2 -> keep last 4 messages
      // keepTurns = 4 -> keep last 8 messages
      // If unpinned messages are fewer than countToKeep, keep all unpinned
      const countToKeep = Math.max(1, keepTurnsOrCount <= 10 ? keepTurnsOrCount * 2 : keepTurnsOrCount);

      const keptUnpinned = unpinnedMsgs.slice(Math.max(0, unpinnedMsgs.length - countToKeep));
      const keptIds = new Set(keptUnpinned.map((m) => m.id));

      return prev.map((m) => {
        if (m.isPinned) {
          return { ...m, isActive: true }; // Pinned messages always remain active
        }
        return {
          ...m,
          isActive: keptIds.has(m.id),
        };
      });
    });
  };

  // Batch toggle active by role
  const handleBatchToggleActive = (active: boolean, roleFilter?: 'user' | 'model') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (!roleFilter || m.role === roleFilter) {
          if (!m.isPinned) {
            return { ...m, isActive: active };
          }
        }
        return m;
      })
    );
  };

  // Trim redundant whitespace, code duplicates, and pleasantries
  const handleTrimRedundancies = () => {
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.isActive) return m;
        let cleaned = m.content;
        // Strip common filler opening pleasantries
        cleaned = cleaned.replace(
          /^(Sure!|Certainly!|Of course!|I'd be happy to help with that!|As an AI language model,|Hello!|Hi there!)\s*/i,
          ''
        );
        // Normalize 3+ newlines to 2
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        // Trim trailing whitespace per line
        cleaned = cleaned
          .split('\n')
          .map((line) => line.trimEnd())
          .join('\n');

        const newTokens = estimateTokens(cleaned);
        return {
          ...m,
          content: cleaned,
          tokens: newTokens,
        };
      })
    );
  };

  // Extract memory facts and append to System Prompt
  const handleExtractMemoriesToSystemPrompt = async () => {
    setIsSummarizing(true);
    try {
      const activeMsgs = messages.filter((m) => m.isActive);
      const res = await fetch('/api/extract-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: activeMsgs }),
      });

      if (!res.ok) throw new Error('Memory extraction failed');
      const data = await res.json();
      const memories = data.memories;

      if (memories) {
        const updatedPrompt = `${systemPrompt}\n\n### Extracted Context Memory:\n${memories}`;
        setSystemPrompt(updatedPrompt);
        // Deactivate extracted older messages
        setMessages((prev) =>
          prev.map((m) => (!m.isPinned ? { ...m, isActive: false } : m))
        );
      }
    } catch (err: any) {
      const cleanMsg = cleanErrorMessage(err);
      console.error(cleanMsg);
      setErrorMessage(`Memory extraction error: ${cleanMsg}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Inject simulation test data
  const handleInjectSimulation = (payload: (typeof SAMPLE_FILL_PAYLOADS)[0]) => {
    const newMsg: ChatMessage = {
      id: `sim-${Date.now()}`,
      role: payload.role,
      content: payload.content,
      timestamp: Date.now(),
      tokens: payload.tokens,
      isActive: true,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Trigger reset confirmation modal
  const handleNewChat = () => {
    setIsResetConfirmOpen(true);
  };

  // Confirmed reset: clears chat and restores clean state
  const handleConfirmResetChat = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setMessages(INITIAL_MESSAGES);
    setErrorMessage(null);
    setIsLoading(false);
    setIsResetConfirmOpen(false);
    localStorage.removeItem('gemini_context_messages');
  };

  return (
    <div id="gemini-context-studio-app" className="flex flex-col h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
      {/* Top App Header */}
      <Header
        breakdown={breakdown}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenSystemPromptModal={() => setIsSystemPromptModalOpen(true)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenOptimizerModal={() => setIsOptimizerModalOpen(true)}
        onNewChat={handleNewChat}
      />

      {/* Near-Capacity Alert Banner (Triggers at >= 75%) */}
      <ContextAlertBanner
        breakdown={breakdown}
        onSmartSummarize={() => handleSmartSummarizeAllOlder()}
        onPruneOlder={handlePruneOlder}
        onTrimRedundancies={handleTrimRedundancies}
        onOpenOptimizer={() => setIsOptimizerModalOpen(true)}
      />

      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="bg-[#111] border-b border-red-500 p-2.5 px-4 text-xs text-red-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#666] hover:text-white text-xs underline ml-4 uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Body: Left Chat, Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Conversation View */}
        <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
          {/* Messages scroll container */}
          <div
            ref={chatContainerRef}
            id="chat-messages-container"
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto"
          >
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onToggleActive={handleToggleActive}
                onTogglePin={handleTogglePin}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />
            ))}

            {/* Typing / Streaming Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 p-3 bg-[#080808] border border-[#222] w-fit text-xs font-mono text-[#888]">
                <Sparkles className="w-4 h-4 text-[#3b82f6] animate-spin" />
                <span className="uppercase font-bold text-[10px]">GEMINI GENERATING RESPONSE...</span>
              </div>
            )}

            {/* Context Summarizing Loading Indicator */}
            {isSummarizing && (
              <div className="flex items-center gap-3 p-3 bg-[#080808] border border-purple-500/50 w-fit text-xs font-mono text-purple-300">
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="uppercase font-bold text-[10px]">COMPRESSING CONTEXT WINDOW...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isLoading={isLoading}
            remainingTokens={remainingTokens}
            maxTokens={maxBudget}
            totalTokens={breakdown.totalTokens}
          />
        </div>

        {/* Right Side: Context Inspector & Modification Center */}
        {isInspectorOpen && (
          <div className="fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-[380px] lg:w-[440px] h-full shrink-0 border-l border-[#222] shadow-2xl bg-[#0a0a0a]">
            <ContextInspector
              breakdown={breakdown}
              messages={messages}
              systemPrompt={systemPrompt}
              onToggleActive={handleToggleActive}
              onTogglePin={handleTogglePin}
              onDeleteMessage={handleDeleteMessage}
              onSmartSummarizeRange={handleSmartSummarizeRange}
              onPruneOlder={handlePruneOlder}
              onBatchToggleActive={handleBatchToggleActive}
              onTrimRedundancies={handleTrimRedundancies}
              onInjectSimulation={handleInjectSimulation}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              onOpenSystemPromptModal={() => setIsSystemPromptModalOpen(true)}
              onClose={() => setIsInspectorOpen(false)}
              isSummarizing={isSummarizing}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ContextOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        breakdown={breakdown}
        messages={messages}
        onSmartSummarize={handleSmartSummarizeAllOlder}
        onPruneOlder={handlePruneOlder}
        onTrimRedundancies={handleTrimRedundancies}
        onExtractMemoriesToSystemPrompt={handleExtractMemoriesToSystemPrompt}
        onMuteRole={(role) => handleBatchToggleActive(false, role)}
        isSummarizing={isSummarizing}
      />

      <ContextBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={maxBudget}
        onSelectBudget={setMaxBudget}
      />

      <SystemPromptModal
        isOpen={isSystemPromptModalOpen}
        onClose={() => setIsSystemPromptModalOpen(false)}
        systemPrompt={systemPrompt}
        onSaveSystemPrompt={setSystemPrompt}
      />

      <RawJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        messages={messages}
        systemPrompt={systemPrompt}
        selectedModel={selectedModel}
      />

      {/* Reset Conversation Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a0a0a] border-2 border-white w-full max-w-md shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">RESET CONTEXT SESSION</h3>
            </div>
            <p className="text-xs text-[#888] leading-relaxed">
              This will clear all current conversation messages, reset active context telemetry, and restore the initial template.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-[#333] hover:border-white text-xs font-black uppercase tracking-wider text-[#ccc] hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmResetChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
