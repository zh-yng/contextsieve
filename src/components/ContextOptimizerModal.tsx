import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Scissors,
  Eraser,
  Layers,
  Brain,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Shield,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, ContextBreakdown } from '../types';

interface ContextOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: ContextBreakdown;
  messages: ChatMessage[];
  onSmartSummarize: (instruction?: string) => Promise<void>;
  onPruneOlder: (keepCount: number) => void;
  onTrimRedundancies: () => void;
  onExtractMemoriesToSystemPrompt: () => Promise<void>;
  onMuteRole: (role: 'user' | 'model') => void;
  isSummarizing: boolean;
}

export const ContextOptimizerModal: React.FC<ContextOptimizerModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  messages,
  onSmartSummarize,
  onPruneOlder,
  onTrimRedundancies,
  onExtractMemoriesToSystemPrompt,
  onMuteRole,
  isSummarizing,
}) => {
  const [instruction, setInstruction] = useState('');
  const [extractingMemories, setExtractingMemories] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSummarize = async () => {
    await onSmartSummarize(instruction);
    setActionSuccess('AI Context Summarization applied successfully!');
    setTimeout(() => {
      setActionSuccess(null);
      onClose();
    }, 1500);
  };

  const handleMemories = async () => {
    setExtractingMemories(true);
    try {
      await onExtractMemoriesToSystemPrompt();
      setActionSuccess('Key memories extracted & added to System Prompt!');
      setTimeout(() => {
        setActionSuccess(null);
        onClose();
      }, 1500);
    } finally {
      setExtractingMemories(false);
    }
  };

  const handlePrune = (count: number) => {
    onPruneOlder(count);
    setActionSuccess(`Sliding window applied (Keeping last ${count} turns)!`);
    setTimeout(() => {
      setActionSuccess(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header in Bold Typography */}
        <div className="p-3.5 sm:p-5 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3b82f6]" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
                CONTEXT OPTIMIZATION SUITE
              </h2>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-[#666] uppercase mt-0.5">
              Modify context window composition when approaching token ceiling
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#666] hover:text-white border border-transparent hover:border-[#444] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {actionSuccess && (
          <div className="bg-[#111] border-b border-green-500 p-2.5 sm:p-3 px-3.5 sm:px-5 text-xs text-green-400 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="font-bold uppercase text-[11px] sm:text-xs">{actionSuccess}</span>
          </div>
        )}

        {/* Current Context Status Pill */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#050505] border-b border-[#222] flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
          <span className="text-[#666] uppercase text-[9px] sm:text-[10px] font-bold">CURRENT UTILIZATION:</span>
          <div className="flex items-center gap-2 font-bold">
            <span className="text-[10px] sm:text-xs">
              {breakdown.totalTokens.toLocaleString()} / {breakdown.maxTokens.toLocaleString()} TOKENS
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 border rounded-md text-[9px] sm:text-[10px] uppercase ${
                breakdown.usagePercentage >= 90
                  ? 'bg-red-500/10 text-red-400 border-red-500'
                  : breakdown.usagePercentage >= 75
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                  : 'bg-green-500/10 text-green-400 border-green-500'
              }`}
            >
              {breakdown.usagePercentage}% CAPACITY
            </span>
          </div>
        </div>

        {/* Body content with strategy cards in Bold Typography */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Strategy 1: AI Smart Summarization */}
          <div className="p-4 bg-[#080808] border border-[#222] hover:border-[#3b82f6] rounded-xl transition-colors space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                  AI Context Compressor & Executive Briefing
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40 rounded font-mono">
                    RECOMMENDED
                  </span>
                </h3>
                <p className="text-xs text-[#888] mt-1 leading-relaxed">
                  Compresses older dialogue into a dense markdown summary while preserving requirements, decisions, code architectures, and constraints.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Optional focus: e.g. Emphasize database schemas and user constraints"
                className="w-full text-xs bg-[#050505] border border-[#333] rounded-lg p-2.5 text-white focus:outline-none focus:border-white font-mono"
              />

              <button
                onClick={handleSummarize}
                disabled={isSummarizing || messages.length <= 1}
                className="w-full py-2.5 px-4 bg-white text-black hover:bg-[#3b82f6] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black text-xs font-black uppercase tracking-tight rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSummarizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>COMPRESSING DIALOGUE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>COMPRESS CONTEXT NOW (~70% TOKEN REDUCTION)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Strategy 2: Sliding Window FIFO Pruning */}
          <div className="p-4 bg-[#080808] border border-[#222] hover:border-[#444] rounded-xl transition-colors space-y-3">
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-[#888] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  SLIDING WINDOW (FIFO TRUNCATION)
                </h3>
                <p className="text-xs text-[#888] mt-1 leading-relaxed">
                  Keep only the most recent N conversational turns in the context window. Pinned turns and System Instructions are strictly preserved.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              <span className="text-[10px] font-mono uppercase text-[#666]">KEEP RECENT:</span>
              {[1, 2, 4, 6, 8].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePrune(count)}
                  className="px-2.5 sm:px-3 py-1.5 bg-[#111] hover:bg-white hover:text-black text-[#ccc] border border-[#333] rounded-lg text-[10px] font-black uppercase transition-colors"
                >
                  {count} {count === 1 ? 'TURN' : 'TURNS'}
                </button>
              ))}
              <button
                onClick={() => {
                  onPruneOlder(9999);
                  setActionSuccess('All turns restored to active context!');
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-[#1a1a1a] hover:bg-white hover:text-black text-white border border-[#444] rounded-lg text-[10px] font-black uppercase transition-colors ml-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESTORE ALL</span>
              </button>
            </div>
          </div>

          {/* Strategy 3: Memory Distillation to System Prompt */}
          <div className="p-4 bg-[#080808] border border-[#222] hover:border-[#444] rounded-xl transition-colors space-y-3">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  EXTRACT MEMORY SCRATCHPAD
                </h3>
                <p className="text-xs text-[#888] mt-1 leading-relaxed">
                  Extracts key permanent facts from current chat history, appends them to the persistent System Prompt, and clears raw dialogue tokens safely.
                </p>
              </div>
            </div>

            <button
              onClick={handleMemories}
              disabled={extractingMemories || messages.length === 0}
              className="w-full py-2.5 px-4 border border-[#333] hover:border-white text-white text-xs font-black uppercase tracking-tight rounded-lg transition-colors flex items-center justify-center gap-2 bg-[#111]"
            >
              {extractingMemories ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>EXTRACTING MEMORIES...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>EXTRACT MEMORIES & INJECT TO SYSTEM PROMPT</span>
                </>
              )}
            </button>
          </div>

          {/* Strategy 4: Redundancy Cleaner & Muting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#080808] border border-[#222] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-white">
                <Eraser className="w-4 h-4 text-[#3b82f6]" />
                <span>TRIM FILLERS</span>
              </div>
              <p className="text-[11px] text-[#666] leading-snug">
                Removes repetitive boilerplate pleasantries and compacts markdown code whitespace.
              </p>
              <button
                onClick={() => {
                  onTrimRedundancies();
                  setActionSuccess('Whitespace & filler phrases trimmed!');
                  setTimeout(() => setActionSuccess(null), 1500);
                }}
                className="w-full py-2 border border-[#333] hover:border-white text-xs font-black uppercase text-[#ccc] hover:text-white bg-[#050505] rounded-lg transition-colors"
              >
                CLEAN REDUNDANCIES
              </button>
            </div>

            <div className="p-3.5 bg-[#080808] border border-[#222] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-white">
                <EyeOff className="w-4 h-4 text-red-400" />
                <span>MUTE ASSISTANT</span>
              </div>
              <p className="text-[11px] text-[#666] leading-snug">
                Excludes verbose model responses from context, keeping user instructions for continuity.
              </p>
              <button
                onClick={() => {
                  onMuteRole('model');
                  setActionSuccess('Assistant messages excluded from context!');
                  setTimeout(() => setActionSuccess(null), 1500);
                }}
                className="w-full py-2 border border-[#333] hover:border-white text-xs font-black uppercase text-[#ccc] hover:text-white bg-[#050505] rounded-lg transition-colors"
              >
                MUTE MODEL CONTEXT
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#222] bg-[#0a0a0a] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[9px] sm:text-[10px] font-mono text-[#555] uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" /> NON-DESTRUCTIVE TO STORED CHAT LOGS
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 border border-[#333] hover:border-white text-[#ccc] hover:text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
