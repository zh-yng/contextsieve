import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Scissors,
  Eraser,
  Pin,
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  CheckSquare,
  Square,
  RefreshCw,
  PlusCircle,
  FileCode,
  FileText,
  AlertCircle,
  TrendingDown,
  Info,
  Check,
  ChevronRight,
  X,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { ChatMessage, ContextBreakdown } from '../types';
import { SAMPLE_FILL_PAYLOADS } from '../utils/tokenEstimator';

interface ContextInspectorProps {
  breakdown: ContextBreakdown;
  messages: ChatMessage[];
  systemPrompt: string;
  onToggleActive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onSmartSummarizeRange: (messageIds: string[], instruction?: string) => Promise<void>;
  onPruneOlder: (keepCount: number) => void;
  onBatchToggleActive: (active: boolean, roleFilter?: 'user' | 'model') => void;
  onTrimRedundancies: () => void;
  onInjectSimulation: (payload: (typeof SAMPLE_FILL_PAYLOADS)[0]) => void;
  onOpenBudgetModal: () => void;
  onOpenSystemPromptModal: () => void;
  onClose?: () => void;
  isSummarizing: boolean;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  breakdown,
  messages,
  systemPrompt,
  onToggleActive,
  onTogglePin,
  onDeleteMessage,
  onSmartSummarizeRange,
  onPruneOlder,
  onBatchToggleActive,
  onTrimRedundancies,
  onInjectSimulation,
  onOpenBudgetModal,
  onOpenSystemPromptModal,
  onClose,
  isSummarizing,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [summarizeInstruction, setSummarizeInstruction] = useState('');
  const [showSimulations, setShowSimulations] = useState(false);
  const [customKeepCount, setCustomKeepCount] = useState<number>(4);

  const {
    systemTokens,
    userTokens,
    modelTokens,
    totalTokens,
    maxTokens,
    usagePercentage,
    activeMessageCount,
  } = breakdown;

  const handleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSummarizeSelected = async () => {
    if (selectedIds.length === 0) return;
    await onSmartSummarizeRange(selectedIds, summarizeInstruction);
    setSelectedIds([]);
    setSummarizeInstruction('');
  };

  // Percentages for token distribution bar
  const sysPct = maxTokens > 0 ? Math.min(100, (systemTokens / maxTokens) * 100) : 0;
  const userPct = maxTokens > 0 ? Math.min(100, (userTokens / maxTokens) * 100) : 0;
  const modelPct = maxTokens > 0 ? Math.min(100, (modelTokens / maxTokens) * 100) : 0;
  const remainingTokens = Math.max(0, maxTokens - totalTokens);

  const isExceeded = usagePercentage >= 100;
  const isCritical = usagePercentage >= 90;
  const isAttention = usagePercentage >= 75;

  return (
    <div
      id="context-inspector-panel"
      className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#222] text-white overflow-hidden"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#3b82f6]" />
          <div>
            <h2 className="text-xs font-black tracking-widest uppercase text-white">
              CONTEXT INSPECTOR
            </h2>
            <p className="text-[10px] font-mono text-[#666] uppercase">Live Token Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="inspector-budget-btn"
            onClick={onOpenBudgetModal}
            className="text-[10px] font-black uppercase px-2.5 py-1 bg-[#111] hover:bg-[#222] text-[#ccc] hover:text-white border border-[#333] hover:border-white rounded-lg transition-colors flex items-center gap-1.5"
            title="Change context capacity limit"
          >
            <Sliders className="w-3 h-3 text-[#777]" />
            <span>CAP: {maxTokens >= 1000000 ? '1M' : `${maxTokens / 1000}K`}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 md:hidden text-[#888] hover:text-white border border-[#333] hover:border-white bg-[#111] rounded-lg transition-colors"
              title="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visual Token Distribution Box */}
        <div className="bg-[#050505] border border-[#222] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-[#555] uppercase">
            <span>TOKEN DISTRIBUTION</span>
            <span className="font-mono text-white">
              {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()}
            </span>
          </div>

          {/* Hero Big Percentage */}
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${
                isCritical
                  ? 'text-red-500'
                  : isAttention
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {usagePercentage}%
            </span>
            <span className="text-[10px] font-mono font-bold uppercase text-[#666]">
              {isCritical ? 'CRITICAL LIMIT' : isAttention ? 'ATTENTION' : 'WINDOW IN USE'}
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-2.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden flex">
            {/* System prompt tokens */}
            {sysPct > 0 && (
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${sysPct}%` }}
                title={`System Prompt: ${systemTokens} tokens`}
              />
            )}
            {/* User messages tokens */}
            {userPct > 0 && (
              <div
                className="h-full bg-[#3b82f6]"
                style={{ width: `${userPct}%` }}
                title={`User Messages: ${userTokens} tokens`}
              />
            )}
            {/* Assistant tokens */}
            {modelPct > 0 && (
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${modelPct}%` }}
                title={`Assistant Responses: ${modelTokens} tokens`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono uppercase">
            <div className="flex items-center gap-1.5 text-[#888]">
              <div className="w-2 h-2 bg-indigo-500 rounded-sm" />
              <span>SYS: {systemTokens}T</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#888]">
              <div className="w-2 h-2 bg-[#3b82f6] rounded-sm" />
              <span>USER: {userTokens}T</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#888]">
              <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
              <span>MODEL: {modelTokens}T</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#555]">
              <div className="w-2 h-2 bg-[#222] rounded-sm" />
              <span>FREE: {remainingTokens.toLocaleString()}T</span>
            </div>
          </div>
        </div>

        {/* Quick Context Modification Toolkit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-[#555]">
              MODIFICATION ACTIONS
            </h3>
            {isAttention && (
              <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/30 rounded-md uppercase">
                ACTION REQUIRED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Smart Summarize older messages */}
            <div className="p-3 bg-[#080808] border border-[#222] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">AI Context Compressor</h4>
                    <p className="text-[10px] text-[#666]">
                      Compress older dialogue into a compact briefing
                    </p>
                  </div>
                </div>
              </div>

              {selectedIds.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Optional focus: e.g. Emphasize SQL schema constraints"
                    value={summarizeInstruction}
                    onChange={(e) => setSummarizeInstruction(e.target.value)}
                    className="w-full text-xs bg-[#050505] border border-[#333] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                  <button
                    id="summarize-selected-btn"
                    onClick={handleSummarizeSelected}
                    disabled={isSummarizing}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-black hover:bg-[#3b82f6] hover:text-white disabled:opacity-40 text-xs font-black uppercase tracking-tight rounded-lg transition-colors"
                  >
                    {isSummarizing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>COMPRESSING SELECTED...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>SUMMARIZE {selectedIds.length} SELECTED TURNS</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  id="summarize-all-older-btn"
                  onClick={() => {
                    const older = messages.slice(0, Math.max(1, messages.length - 2)).map((m) => m.id);
                    if (older.length > 0) {
                      onSmartSummarizeRange(older);
                    }
                  }}
                  disabled={isSummarizing || messages.length <= 1}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-xs font-black uppercase tracking-tight disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black rounded-lg transition-colors"
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>COMPRESSING...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>AUTO-SUMMARIZE OLDER TURNS (~70% REDUCTION)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* FIFO Sliding Window Pruning */}
            <div className="p-3 bg-[#080808] border border-[#222] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-[#888]" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">SLIDING WINDOW (FIFO)</h4>
                    <p className="text-[10px] text-[#666]">
                      Keep latest turns in memory; pinned turns remain safe
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomKeepCount(99);
                    onBatchToggleActive(true);
                  }}
                  title="Re-activate all messages in conversation history"
                  className="px-2 py-0.5 text-[9px] font-black uppercase text-[#888] hover:text-white border border-[#333] hover:border-white bg-[#111] rounded-md transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>ALL ACTIVE</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#666]">KEEP:</span>
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setCustomKeepCount(num);
                      onPruneOlder(num);
                    }}
                    className={`px-2 py-1 border text-[10px] font-black uppercase rounded-lg transition-colors ${
                      customKeepCount === num
                        ? 'bg-white text-black border-white font-black'
                        : 'bg-[#111] hover:bg-[#222] text-[#ccc] hover:text-white border-[#333]'
                    }`}
                  >
                    {num} {num === 1 ? 'TURN' : 'TURNS'}
                  </button>
                ))}

                {/* Interactive Custom Stepper */}
                <div className="ml-auto flex items-center border border-[#333] bg-[#111] rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      const next = Math.max(1, customKeepCount - 1);
                      setCustomKeepCount(next);
                      onPruneOlder(next);
                    }}
                    title="Decrease turns"
                    className="p-1 hover:bg-[#222] text-[#aaa] hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-[10px] font-mono font-bold text-white min-w-[24px] text-center">
                    {customKeepCount}T
                  </span>
                  <button
                    onClick={() => {
                      const next = customKeepCount + 1;
                      setCustomKeepCount(next);
                      onPruneOlder(next);
                    }}
                    title="Increase turns"
                    className="p-1 hover:bg-[#222] text-[#aaa] hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Filtering & Redundancy Cleaner */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="trim-redundancies-btn"
                onClick={onTrimRedundancies}
                title="Strips excessive whitespace, duplicate code lines, and filler polite phrases"
                className="p-3 bg-[#080808] hover:bg-[#111] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase mb-1">
                  <Eraser className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>TRIM FILLERS</span>
                </div>
                <p className="text-[10px] text-[#666] leading-tight">
                  Strip polite greetings & redundant whitespace
                </p>
              </button>

              <button
                id="toggle-model-context-btn"
                onClick={() => onBatchToggleActive(false, 'model')}
                title="Exclude assistant replies from context while keeping user prompts"
                className="p-3 bg-[#080808] hover:bg-[#111] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase mb-1">
                  <EyeOff className="w-3.5 h-3.5 text-red-400" />
                  <span>MUTE MODEL</span>
                </div>
                <p className="text-[10px] text-[#666] leading-tight">
                  Exclude assistant outputs from context
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Test Simulation Bench */}
        <div className="p-3 bg-[#050505] border border-[#222] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-[#3b82f6]" /> CONTEXT LOAD SIMULATOR
            </span>
            <button
              onClick={() => setShowSimulations(!showSimulations)}
              className="text-[10px] font-black uppercase text-[#3b82f6] hover:underline"
            >
              {showSimulations ? 'HIDE PRESETS' : 'TEST NEAR-FULL'}
            </button>
          </div>

          {showSimulations && (
            <div className="space-y-1.5 pt-1">
              {SAMPLE_FILL_PAYLOADS.map((sim, idx) => (
                <button
                  key={idx}
                  onClick={() => onInjectSimulation(sim)}
                  className="w-full text-left p-2 bg-[#080808] hover:bg-[#111] border border-[#222] hover:border-white rounded-lg text-xs text-[#ccc] hover:text-white transition-colors flex items-center justify-between font-mono"
                >
                  <span className="truncate pr-2 uppercase font-bold text-[11px]">{sim.title}</span>
                  <span className="text-[10px] font-bold text-[#3b82f6] whitespace-nowrap">
                    +{sim.tokens}T
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Messages List in Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-[#555]">
              ACTIVE STACK ({activeMessageCount}/{messages.length})
            </h3>

            <button
              onClick={handleSelectAll}
              className="text-[10px] font-black uppercase tracking-wider text-[#888] hover:text-white flex items-center gap-1"
            >
              {selectedIds.length === messages.length && messages.length > 0 ? (
                <>
                  <CheckSquare className="w-3 h-3 text-[#3b82f6]" /> DESELECT ALL
                </>
              ) : (
                <>
                  <Square className="w-3 h-3" /> SELECT ALL ({selectedIds.length})
                </>
              )}
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-6 text-[#555] text-xs font-mono border border-dashed border-[#222] rounded-xl">
              NO MESSAGES IN ACTIVE CONTEXT
            </div>
          ) : (
            <div className="space-y-1.5">
              {messages.map((msg, index) => {
                const isSelected = selectedIds.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 border rounded-xl text-xs transition-colors flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#141414] border-white'
                        : !msg.isActive
                        ? 'bg-[#050505] border-[#222] opacity-40'
                        : 'bg-[#080808] border-[#222] hover:border-[#333]'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <button
                      onClick={() => handleToggleSelect(msg.id)}
                      className="text-[#666] hover:text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Role & Turn number */}
                    <div className="flex items-center gap-1 min-w-[65px]">
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 border rounded uppercase ${
                          msg.isSummarized
                            ? 'border-purple-500/50 text-purple-400'
                            : msg.role === 'user'
                            ? 'border-[#333] text-[#888]'
                            : 'border-[#3b82f6]/50 text-[#3b82f6]'
                        }`}
                      >
                        {msg.isSummarized ? 'SUMM' : msg.role === 'user' ? 'USER' : 'GMNI'}
                      </span>
                      <span className="text-[10px] text-[#555] font-mono">#{index + 1}</span>
                    </div>

                    {/* Snippet */}
                    <div className="flex-1 truncate text-[#aaa] font-mono text-[11px]">
                      {msg.content.replace(/\n/g, ' ')}
                    </div>

                    {/* Tokens badge */}
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 border rounded-md whitespace-nowrap ${
                        !msg.isActive
                          ? 'bg-[#111] text-[#555] border-[#222] line-through'
                          : 'bg-[#141414] text-[#888] border-[#2a2a2a]'
                      }`}
                    >
                      {msg.tokens || 0}T
                    </span>

                    {/* Quick message tools: Pin, Toggle Active, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePin(msg.id)}
                        title={msg.isPinned ? 'Unpin' : 'Pin (Protect)'}
                        className={`p-1 border rounded-lg ${
                          msg.isPinned
                            ? 'text-amber-400 bg-amber-500/20 border-amber-500/40'
                            : 'text-[#666] border-transparent hover:text-white'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onToggleActive(msg.id)}
                        title={msg.isActive ? 'Exclude from context' : 'Include in context'}
                        className={`p-1 border rounded-lg ${
                          msg.isActive
                            ? 'text-[#666] border-transparent hover:text-white'
                            : 'text-red-400 bg-red-500/10 border-red-500/40'
                        }`}
                      >
                        {msg.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Delete permanently"
                        className="p-1 text-[#666] hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
