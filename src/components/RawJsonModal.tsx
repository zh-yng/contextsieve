import React, { useState } from 'react';
import { X, Code2, Copy, CheckCheck, Download } from 'lucide-react';
import { ChatMessage } from '../types';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  systemPrompt: string;
  selectedModel: string;
}

export const RawJsonModal: React.FC<RawJsonModalProps> = ({
  isOpen,
  onClose,
  messages,
  systemPrompt,
  selectedModel,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeMessages = messages.filter((m) => m.isActive);

  const payload = {
    model: selectedModel,
    config: {
      systemInstruction: systemPrompt || undefined,
      temperature: 0.7,
    },
    contents: activeMessages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    telemetry: {
      totalStoredMessages: messages.length,
      activeContextMessages: activeMessages.length,
      excludedMessages: messages.length - activeMessages.length,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-context-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-[#3b82f6]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                GEMINI CONTEXT PAYLOAD
              </h2>
              <p className="text-[10px] font-mono text-[#666] uppercase">
                Raw API parameters and conversation structures transmitted to @google/genai
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
        <div className="p-5 flex-1 overflow-y-auto">
          <pre className="bg-[#050505] border border-[#222] rounded-xl p-4 text-xs font-mono text-[#aaa] overflow-x-auto leading-relaxed max-h-[55vh]">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222] bg-[#0a0a0a] flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-[#666]">
            {activeMessages.length} ACTIVE TURNS TRANSMITTED
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-[#111] hover:bg-[#222] text-[#ccc] hover:text-white border border-[#333] hover:border-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-xs font-black uppercase tracking-tight rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
