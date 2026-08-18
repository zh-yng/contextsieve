import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, AlertTriangle, CornerDownLeft } from 'lucide-react';
import { estimateTokens } from '../utils/tokenEstimator';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  remainingTokens: number;
  maxTokens: number;
  totalTokens: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isLoading,
  remainingTokens,
  maxTokens,
  totalTokens,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        200,
        Math.max(48, textareaRef.current.scrollHeight)
      )}px`;
    }
  }, [input]);

  const inputEstimatedTokens = estimateTokens(input);
  const willExceedBudget = inputEstimatedTokens > remainingTokens && remainingTokens > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 pt-2 border-t border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Token Headroom Warning */}
        {willExceedBudget && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-red-500 bg-red-950/30 text-red-400 text-xs font-mono rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">
              PROMPT (~{inputEstimatedTokens} TOKENS) EXCEEDS REMAINING HEADROOM ({remainingTokens} TOKENS).
            </span>
          </div>
        )}

        {/* Input box styled with clean rounded 2xl border */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-[#050505] border-2 border-white focus-within:border-[#3b82f6] rounded-2xl p-2.5 sm:p-3 md:p-4 flex items-end gap-2 sm:gap-3 transition-colors shadow-2xl"
        >
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or manage context window..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-white placeholder-[#555] text-xs sm:text-sm font-brygada font-normal p-1 resize-none focus:outline-none max-h-48 leading-relaxed tracking-tight"
          />

          {/* Right Controls in Bold Typography */}
          <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 shrink-0">
            {input.trim().length > 0 && (
              <span className="font-mono text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-1 bg-[#111] border border-[#333] text-[#888] rounded-md">
                ~{inputEstimatedTokens}T
              </span>
            )}

            {isLoading ? (
              <button
                type="button"
                id="stop-generation-btn"
                onClick={onStopGeneration}
                title="Stop generation"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-tighter rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>HALT</span>
              </button>
            ) : (
              <button
                type="submit"
                id="send-message-btn"
                disabled={!input.trim()}
                title="Send message (Enter)"
                className="text-xs font-black bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 uppercase tracking-tighter hover:bg-[#3b82f6] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black rounded-xl transition-colors"
              >
                SEND
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9px] sm:text-[10px] font-mono text-[#555] px-1 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            GEMINI ENGINE ACTIVE
          </span>
          <span>
            {remainingTokens.toLocaleString()} TOKENS FREE ({totalTokens.toLocaleString()} / {maxTokens.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};
