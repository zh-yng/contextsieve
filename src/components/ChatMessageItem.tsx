import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Pin,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  CheckCheck,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onToggleActive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEditMessage: (id: string, newContent: string) => void;
  onDeleteMessage: (id: string) => void;
  onSummarizeSingle?: (id: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onToggleActive,
  onTogglePin,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isModel = message.role === 'model';
  const isSummary = !!message.isSummarized;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEditMessage(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative p-4 sm:p-5 md:p-6 transition-colors border rounded-2xl ${
        !message.isActive
          ? 'bg-[#050505] border-[#222] border-dashed opacity-50'
          : isSummary
          ? 'bg-[#0e0e0e] border-[#333] shadow-md'
          : isUser
          ? 'bg-[#080808] border-[#222] hover:border-[#333]'
          : 'bg-[#0d0d0d] border-[#222] hover:border-[#333]'
      }`}
    >
      {/* Top message bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-[#1f1f1f]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Bold Role Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] ${
                isSummary
                  ? 'text-[#a855f7]'
                  : isUser
                  ? 'text-[#666]'
                  : 'text-[#3b82f6]'
              }`}
            >
              {isSummary ? 'BRIEFING' : isUser ? 'USER' : 'GEMINI'}
            </span>
          </div>

          {/* Context Status Badges in Bold Typography */}
          <div className="flex flex-wrap items-center gap-1.5">
            {message.isActive ? (
              <span className="px-1.5 sm:px-2 py-0.5 bg-[#141414] text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-[#2a2a2a] text-[#888] rounded-md">
                IN CONTEXT
              </span>
            ) : (
              <span className="px-1.5 sm:px-2 py-0.5 bg-[#141414] text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-[#2a2a2a] text-red-400 rounded-md">
                EXCLUDED
              </span>
            )}

            {message.isPinned && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-amber-500/10 text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-amber-500/40 text-amber-400 flex items-center gap-1 rounded-md">
                <Pin className="w-2.5 h-2.5" /> PINNED
              </span>
            )}

            {isSummary && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-[#1c1427] text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-purple-500/40 text-purple-400 rounded-md">
                COMPRESSED
              </span>
            )}
          </div>
        </div>

        {/* Right side: Token badge & Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs ml-auto">
          <span
            className={`font-mono text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 border rounded-md ${
              !message.isActive
                ? 'bg-[#111] text-[#555] border-[#222] line-through'
                : 'bg-[#141414] text-[#aaa] border-[#2a2a2a]'
            }`}
            title="Estimated tokens consumed in context window"
          >
            {message.tokens?.toLocaleString() || 0} T
          </span>

          {/* Pin Button */}
          <button
            id={`pin-btn-${message.id}`}
            onClick={() => onTogglePin(message.id)}
            title={message.isPinned ? 'Unpin message' : 'Pin message (protect from auto-pruning)'}
            className={`p-1.5 border rounded-lg transition-colors ${
              message.isPinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'border-[#222] text-[#666] hover:text-white hover:border-[#444] bg-[#0a0a0a]'
            }`}
          >
            <Pin className="w-3 h-3" />
          </button>

          {/* Toggle Active In Context */}
          <button
            id={`toggle-active-btn-${message.id}`}
            onClick={() => onToggleActive(message.id)}
            title={
              message.isActive
                ? 'Exclude this turn from context window (saves tokens without deleting transcript)'
                : 'Include this turn back in context window'
            }
            className={`p-1.5 border rounded-lg transition-colors ${
              message.isActive
                ? 'border-[#222] text-[#666] hover:text-white hover:border-[#444] bg-[#0a0a0a]'
                : 'bg-red-500/20 text-red-400 border-red-500/50'
            }`}
          >
            {message.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* Edit Message content */}
          <button
            id={`edit-btn-${message.id}`}
            onClick={() => setIsEditing(!isEditing)}
            title="Edit message to trim tokens directly"
            className="p-1.5 border border-[#222] text-[#666] hover:text-white hover:border-[#444] bg-[#0a0a0a] rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Copy Message */}
          <button
            onClick={handleCopy}
            title="Copy content"
            className="p-1.5 border border-[#222] text-[#666] hover:text-white hover:border-[#444] bg-[#0a0a0a] rounded-lg transition-colors"
          >
            {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>

          {/* Delete Message */}
          <button
            id={`delete-btn-${message.id}`}
            onClick={() => onDeleteMessage(message.id)}
            title="Delete turn permanently"
            className="p-1.5 border border-[#222] text-[#666] hover:text-red-400 hover:border-red-500/50 bg-[#0a0a0a] rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Message Body or Edit Mode */}
      {isEditing ? (
        <div className="mt-2 space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={Math.min(10, Math.max(3, editContent.split('\n').length))}
            className="w-full bg-[#050505] border border-white rounded-xl p-3 text-xs sm:text-sm text-white font-brygada focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666] font-mono text-[11px]">
              ESTIMATED: ~{Math.ceil(editContent.length / 3.8)} TOKENS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 border border-[#333] hover:border-white text-[10px] font-black uppercase text-[#aaa] hover:text-white rounded-lg transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-white text-black hover:bg-[#3b82f6] hover:text-white text-[10px] font-black uppercase rounded-lg transition-colors"
              >
                SAVE EDITS
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`leading-relaxed break-words overflow-hidden font-brygada ${
            isUser
              ? 'text-sm sm:text-[15px] font-medium text-[#f0f0f0] leading-relaxed tracking-tight'
              : 'text-xs sm:text-sm text-[#ddd] font-normal leading-relaxed'
          }`}
        >
          <div className="prose prose-sm prose-invert max-w-none font-brygada text-inherit prose-p:font-brygada prose-p:leading-relaxed prose-headings:font-brygada prose-headings:text-white prose-strong:font-brygada prose-li:font-brygada prose-pre:bg-[#050505] prose-pre:border prose-pre:border-[#222] prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:text-xs prose-code:font-mono prose-code:text-[#3b82f6] prose-code:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Timestamp and metadata footer */}
      <div className="mt-4 pt-2.5 flex items-center justify-between text-[10px] text-[#555] font-mono border-t border-[#1a1a1a]">
        <span className="flex items-center gap-1.5 uppercase">
          <Clock className="w-3 h-3 text-[#444]" />
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        {isSummary && message.summarizedMessageIds && (
          <span className="flex items-center gap-1 text-purple-400 font-bold uppercase tracking-wider">
            <Layers className="w-3 h-3" /> REPLACES {message.summarizedMessageIds.length} PRIOR TURNS
          </span>
        )}
      </div>
    </div>
  );
};
