import React from 'react';
import {
  AlertTriangle,
  Flame,
  Sparkles,
  Scissors,
  Eraser,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ContextBreakdown } from '../types';

interface ContextAlertBannerProps {
  breakdown: ContextBreakdown;
  onSmartSummarize: () => void;
  onPruneOlder: (keepCount: number) => void;
  onTrimRedundancies: () => void;
  onOpenOptimizer: () => void;
  onDismiss?: () => void;
}

export const ContextAlertBanner: React.FC<ContextAlertBannerProps> = ({
  breakdown,
  onSmartSummarize,
  onPruneOlder,
  onTrimRedundancies,
  onOpenOptimizer,
  onDismiss,
}) => {
  const { usagePercentage, totalTokens, maxTokens } = breakdown;

  if (usagePercentage < 75) {
    return null;
  }

  const isExceeded = usagePercentage >= 100;
  const isCritical = usagePercentage >= 90;

  return (
    <div
      id="context-alert-banner"
      className={`border-b px-3 sm:px-6 py-3 sm:py-4 transition-all duration-200 bg-[#0a0a0a] ${
        isExceeded
          ? 'border-red-500 bg-red-950/20 text-white'
          : isCritical
          ? 'border-red-500/70 text-white'
          : 'border-amber-500/70 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        {/* Banner Alert Info */}
        <div className="flex items-start gap-2.5 sm:gap-4">
          <div className="pt-0.5 shrink-0">
            <span
              className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-md ${
                isExceeded || isCritical
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : 'border-amber-500 text-amber-400 bg-amber-500/10'
              }`}
            >
              {isExceeded ? 'EXCEEDED' : isCritical ? 'CRITICAL' : 'WARNING'}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-tight uppercase text-white">
                {isExceeded
                  ? 'CONTEXT WINDOW CAPACITY EXCEEDED'
                  : isCritical
                  ? 'CONTEXT CAPACITY CRITICAL — ACTION RECOMMENDED'
                  : 'CONTEXT APPROACHING CEILING'}
              </h2>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#888]">
                [{totalTokens.toLocaleString()} / {maxTokens.toLocaleString()} TOKENS • {usagePercentage}%]
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#888] mt-0.5 sm:mt-1 max-w-2xl leading-relaxed">
              {isExceeded
                ? 'Active message history exceeds token limits. Compress or prune turns to prevent truncation.'
                : 'Current conversation is nearing active capacity. Choose an action below to optimize context density.'}
            </p>
          </div>
        </div>

        {/* Quick Action Options in Bold Typography Style */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto">
          {/* Smart Summarize */}
          <button
            id="banner-summarize-btn"
            onClick={onSmartSummarize}
            title="Use Gemini to compress early conversation turns into an executive summary"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-tight rounded-lg transition-colors"
          >
            SUMMARIZE TAIL
          </button>

          {/* Prune older messages */}
          <button
            id="banner-prune-btn"
            onClick={() => onPruneOlder(4)}
            title="Keep only the latest 4 turns and pinned messages"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-[#333] hover:border-white text-[10px] sm:text-xs font-black uppercase tracking-tight text-[#ccc] hover:text-white rounded-lg transition-colors bg-[#050505]"
          >
            PRUNE OLDEST
          </button>

          {/* Trim redundancies */}
          <button
            id="banner-trim-btn"
            onClick={onTrimRedundancies}
            title="Trim redundant whitespace, code duplicates, and filler greetings"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-[#333] hover:border-white text-[10px] sm:text-xs font-black uppercase tracking-tight text-[#ccc] hover:text-white rounded-lg transition-colors bg-[#050505]"
          >
            TRIM FILLERS
          </button>

          {/* Detailed Context Manager */}
          <button
            id="banner-open-manager-btn"
            onClick={onOpenOptimizer}
            title="Open comprehensive context optimization options"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-[#333] hover:border-white text-[10px] sm:text-xs font-black uppercase tracking-tight text-[#ccc] hover:text-white rounded-lg transition-colors bg-[#050505]"
          >
            MANAGE ALL
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 sm:p-1.5 text-[#555] hover:text-white rounded-lg transition-colors ml-auto sm:ml-0"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
