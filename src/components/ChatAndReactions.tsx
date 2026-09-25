import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, MessageCircle, Smile, Sparkles, X } from 'lucide-react';
import { ChatMessage, FloatingReaction } from '../types';

interface ChatAndReactionsProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  floatingReactions: FloatingReaction[];
}

const REACTION_EMOJIS = ['💖', '🥰', '🍿', '🥺', '😂', '🔥', '✨', '😘'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendReaction,
  floatingReactions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Reactions Overlay (renders anywhere in room) */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.x}%`, bottom: '15%' }}
            className="animate-float-heart absolute flex flex-col items-center select-none"
          >
            <span className="text-4xl drop-shadow-md">{item.emoji}</span>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
              {item.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Reaction Bar on screen */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-100 bg-white/90 p-2.5 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="hidden items-center gap-1 pl-1 text-xs font-semibold text-rose-500 sm:flex">
            <Heart className="h-3.5 w-3.5 fill-rose-500" />
            <span>React:</span>
          </span>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              title={`Send ${emoji} to partner`}
              className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:scale-125 hover:bg-rose-50 active:scale-95"
            >
              <span className="text-base">{emoji}</span>
            </button>
          ))}
        </div>

        {/* Toggle Chat Drawer Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
            isOpen
              ? 'bg-rose-500 text-white shadow-sm'
              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Chat</span>
          {messages.length > 0 && !isOpen && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Chat Drawer / Slide-out */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-rose-100 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-rose-100 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Heart className="h-4 w-4 fill-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Couple Chat</h3>
                <p className="text-[11px] text-slate-400">Sweet whispers during the show</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <Sparkles className="mb-2 h-8 w-8 text-rose-300" />
                <p className="text-xs">No messages yet.</p>
                <p className="text-[11px]">Send a sweet note to your partner!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="mb-1 text-[10px] font-semibold text-slate-400">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-xs shadow-xs'
                          : 'border border-slate-200 bg-slate-50 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-rose-100 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                maxLength={250}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-1 focus:ring-rose-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white transition hover:bg-rose-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
