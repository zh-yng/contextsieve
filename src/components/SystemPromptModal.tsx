import React, { useState } from 'react';
import { X, Settings, Sparkles, Check, FileCode, Layers } from 'lucide-react';
import { estimateTokens } from '../utils/tokenEstimator';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
}

const PRESET_SYSTEM_PROMPTS = [
  {
    title: 'CONCISE & HIGH-EFFICIENCY',
    description: 'Instructs Gemini to minimize conversational filler and maximize information density.',
    prompt:
      'You are a high-efficiency AI assistant. Provide concise, direct, and factual responses. Minimize introductory pleasantries and repetitive filler phrases. Use bullet points and code snippets where appropriate.',
  },
  {
    title: 'SENIOR FULL-STACK ENGINEER',
    description: 'Tailored for software engineering, architecture reviews, and clean TypeScript code.',
    prompt:
      'You are a Senior Full-Stack Principal Engineer. Write production-ready, clean TypeScript and modern React code. Provide clear architectural explanations, highlight edge cases, and ensure robust error handling.',
  },
  {
    title: 'DEEP ANALYTICAL REASONER',
    description: 'Encourages structured step-by-step problem breakdown.',
    prompt:
      'You are an expert analytical thinking assistant. Break down complex problems into structured hypotheses, evaluate tradeoffs systematically, and provide comprehensive solutions.',
  },
  {
    title: 'EXECUTIVE SUMMARIZER',
    description: 'Specialized in distilling dense discussions into actionable insights.',
    prompt:
      'You are a specialized Context Summarization and Memory Assistant. When reviewing documents or conversations, extract key decisions, unresolved issues, and technical specifications clearly in structured markdown tables and bullet points.',
  },
];

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSaveSystemPrompt,
}) => {
  const [prompt, setPrompt] = useState(systemPrompt);

  if (!isOpen) return null;

  const tokenCount = estimateTokens(prompt);

  const handleSave = () => {
    onSaveSystemPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#3b82f6]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                SYSTEM INSTRUCTION
              </h2>
              <p className="text-[10px] font-mono text-[#666] uppercase">
                Persistent directive pinned at the top of the context window
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-[10px] font-black uppercase text-[#555] tracking-wider">
                CUSTOM SYSTEM DIRECTIVE:
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 border border-[#333] rounded text-[#888] bg-[#111]">
                ~{tokenCount}T CONSUMED
              </span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. You are a high-efficiency, concise engineering assistant..."
              rows={5}
              className="w-full bg-[#050505] border border-[#333] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-white leading-relaxed"
            />
          </div>

          {/* Presets */}
          <div className="space-y-2 pt-2 border-t border-[#222]">
            <span className="text-[10px] font-black text-[#555] uppercase tracking-widest">
              PRESET TEMPLATES:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SYSTEM_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(preset.prompt)}
                  className="p-3 bg-[#080808] hover:bg-[#111] border border-[#222] hover:border-white rounded-xl text-left transition-colors group space-y-1"
                >
                  <div className="text-xs font-black uppercase text-white group-hover:text-[#3b82f6]">
                    {preset.title}
                  </div>
                  <p className="text-[11px] text-[#777] leading-tight line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222] bg-[#0a0a0a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrompt('')}
              className="text-[10px] font-mono uppercase text-[#666] hover:text-white transition-colors"
            >
              CLEAR
            </button>
            <span className="text-[#333]">|</span>
            <button
              onClick={() => setPrompt(PRESET_SYSTEM_PROMPTS[0].prompt)}
              className="text-[10px] font-mono uppercase text-[#888] hover:text-white transition-colors"
            >
              RESET DEFAULT
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-[#333] hover:border-white text-[#ccc] hover:text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-xs font-black uppercase tracking-tight rounded-lg transition-colors"
            >
              SAVE DIRECTIVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
