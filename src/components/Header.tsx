import React from 'react';
import {
  Layers,
  Sparkles,
  Sliders,
  Settings,
  PlusCircle,
  Code2,
  AlertTriangle,
  Flame,
  Check,
} from 'lucide-react';
import { ContextBreakdown, ModelOption } from '../types';

interface HeaderProps {
  breakdown: ContextBreakdown;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelOption[];
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  onOpenBudgetModal: () => void;
  onOpenSystemPromptModal: () => void;
  onOpenJsonModal: () => void;
  onOpenOptimizerModal: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  breakdown,
  selectedModel,
  onModelChange,
  availableModels,
  isInspectorOpen,
  onToggleInspector,
  onOpenBudgetModal,
  onOpenSystemPromptModal,
  onOpenJsonModal,
  onOpenOptimizerModal,
  onNewChat,
}) => {
  const { usagePercentage, totalTokens, maxTokens } = breakdown;

  // Status indicators in bold design language
  const isExceeded = usagePercentage >= 100;
  const isCritical = usagePercentage >= 90;
  const isAttention = usagePercentage >= 75;

  let statusBadgeClass = 'text-[#888] border-[#333]';
  let statusText = 'NORMAL';

  if (isExceeded) {
    statusBadgeClass = 'text-red-500 border-red-500/80 animate-pulse bg-red-500/10';
    statusText = 'EXCEEDED';
  } else if (isCritical) {
    statusBadgeClass = 'text-red-400 border-red-500/50 bg-red-500/10';
    statusText = 'CRITICAL';
  } else if (isAttention) {
    statusBadgeClass = 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    statusText = 'ATTENTION';
  }

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#222] text-white px-3 sm:px-5 py-2.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full flex-nowrap">
        {/* Left: Brand & Model Selection */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-sm sm:text-base md:text-lg font-black leading-none tracking-tight text-white uppercase whitespace-nowrap">
              CONTEXT<span className="text-[#3b82f6]">SIEVE</span>
            </h1>
          </div>

          <div className="h-4 w-[1px] bg-[#262626] hidden sm:block"></div>

          {/* Model Selector Tag */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-[#111] border border-[#262626] rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCritical ? 'bg-red-500' : 'bg-green-500'}`} />
            <select
              id="model-selector"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-white border-0 cursor-pointer focus:ring-0 p-0 text-[10px] sm:text-[11px] font-bold uppercase tracking-tight max-w-[110px] sm:max-w-[150px] truncate"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111] text-white">
                  {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Sleek Context Capacity Meter (Hidden on very tiny screens, visible sm+) */}
        <div className="hidden md:flex items-center gap-2.5 bg-[#111] border border-[#262626] rounded-lg px-3 py-1 shrink-0">
          <button
            id="budget-selector-btn"
            onClick={onOpenBudgetModal}
            title="Configure Context Capacity Window Limit"
            className="flex items-center gap-1.5 group hover:text-[#3b82f6] transition-colors"
          >
            <Sliders className="w-3 h-3 text-[#777] group-hover:text-[#3b82f6]" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#ccc] whitespace-nowrap">
              {totalTokens.toLocaleString()} <span className="text-[#555] font-normal">/ {maxTokens.toLocaleString()}</span>
            </span>
          </button>

          {/* Linear Bar */}
          <div className="w-16 lg:w-24 h-1.5 bg-[#222] rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCritical
                  ? 'bg-red-500'
                  : isAttention
                  ? 'bg-amber-400'
                  : 'bg-[#3b82f6]'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, usagePercentage))}%` }}
            />
          </div>

          <span
            className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase whitespace-nowrap ${statusBadgeClass}`}
          >
            {usagePercentage}%
          </span>

          {isAttention && (
            <button
              id="header-optimize-btn"
              onClick={onOpenOptimizerModal}
              className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white text-black hover:bg-[#3b82f6] hover:text-white transition-colors whitespace-nowrap"
            >
              RESOLVE
            </button>
          )}
        </div>

        {/* Right: Action Buttons Grouped into a Clean Single Row */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="system-prompt-btn"
            onClick={onOpenSystemPromptModal}
            title="Edit System Instructions"
            className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-white text-[10px] font-black uppercase tracking-wider text-[#ccc] hover:text-white transition-colors flex items-center gap-1 bg-[#111] whitespace-nowrap"
          >
            <Settings className="w-3 h-3 text-[#888]" />
            <span className="hidden sm:inline">PROMPT</span>
          </button>

          <button
            id="raw-json-btn"
            onClick={onOpenJsonModal}
            title="Inspect Raw Gemini Context Payload"
            className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-white text-[10px] font-black uppercase tracking-wider text-[#ccc] hover:text-white transition-colors flex items-center gap-1 bg-[#111] whitespace-nowrap"
          >
            <Code2 className="w-3 h-3 text-[#888]" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            id="toggle-inspector-btn"
            onClick={onToggleInspector}
            className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 whitespace-nowrap ${
              isInspectorOpen
                ? 'bg-white text-black border-white'
                : 'border-[#2a2a2a] hover:border-white text-[#ccc] hover:text-white bg-[#111]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden xs:inline sm:inline">INSPECT</span>
          </button>

          <button
            id="new-chat-btn"
            onClick={onNewChat}
            title="Start New Chat Session"
            className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-red-400 text-[10px] font-black uppercase tracking-wider text-[#ccc] hover:text-red-400 transition-colors flex items-center gap-1 bg-[#111] whitespace-nowrap"
          >
            <PlusCircle className="w-3 h-3 text-[#888]" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>
    </header>
  );
};
