import React, { useState } from 'react';
import { X, Sliders, Check, Sparkles, AlertCircle } from 'lucide-react';
import { CONTEXT_BUDGET_PRESETS } from '../utils/tokenEstimator';

interface ContextBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  onSelectBudget: (tokens: number) => void;
}

export const ContextBudgetModal: React.FC<ContextBudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  onSelectBudget,
}) => {
  const [customValue, setCustomValue] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    const parsed = parseInt(customValue, 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 2000000) {
      setCustomError('Please enter a valid token capacity between 500 and 2,000,000.');
      return;
    }
    setCustomError(null);
    onSelectBudget(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#3b82f6]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                CONTEXT CAPACITY LIMIT
              </h2>
              <p className="text-[10px] font-mono text-[#666] uppercase">
                Active context window ceiling for testing near-capacity behavior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#666] hover:text-white border border-transparent hover:border-[#444] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#888] leading-relaxed">
            Select a token capacity limit. Selecting smaller budgets (e.g. 2,000 or 4,000 tokens)
            allows you to easily test near-full context warnings, automatic pruning triggers, and
            AI summarization with just a few turns.
          </p>

          <div className="space-y-2">
            {CONTEXT_BUDGET_PRESETS.map((preset) => {
              const isSelected = currentBudget === preset.tokens;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectBudget(preset.tokens);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 border rounded-xl transition-colors flex items-start justify-between ${
                    isSelected
                      ? 'bg-[#141414] border-white'
                      : 'bg-[#080808] border-[#222] hover:border-[#444] hover:bg-[#111]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {preset.label}
                      </span>
                      {preset.tokens <= 4000 && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                          TEST PRESET
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#777] leading-tight">{preset.description}</p>
                  </div>

                  {isSelected && (
                    <div className="p-1 bg-white text-black rounded shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Capacity Input */}
          <div className="pt-3 border-t border-[#222] space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#555]">
              CUSTOM TOKEN LIMIT:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="e.g. 6000"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setCustomError(null);
                }}
                className="flex-1 text-xs bg-[#050505] border border-[#333] rounded-lg p-2.5 text-white focus:outline-none focus:border-white font-mono"
              />
              <button
                onClick={handleApplyCustom}
                className="px-4 py-2.5 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-xs font-black uppercase tracking-tight rounded-lg transition-colors"
              >
                SET LIMIT
              </button>
            </div>
            {customError && (
              <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {customError}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222] bg-[#0a0a0a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#333] hover:border-white text-[#ccc] hover:text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};
