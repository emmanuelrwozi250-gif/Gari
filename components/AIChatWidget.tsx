'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const INITIAL_MESSAGES: UIMessage[] = [
    {
      id: 'welcome',
      role: 'assistant',
      parts: [{ type: 'text', text: "Hi! I'm the Gari Assistant 🚗 How can I help you find the perfect car in Rwanda?" }],
    },
  ];

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: INITIAL_MESSAGES,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">Gari Assistant</p>
                <p className="text-green-200 text-xs">Rwanda car rental expert</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white rounded-bl-sm'
                  }`}
                >
                  {m.parts.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-border flex gap-2 flex-shrink-0"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about cars, districts, booking…"
              className="input flex-1 text-sm py-2"
              disabled={isLoading}
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary px-3 py-2 flex-shrink-0 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Toggle button — sits above WhatsApp button (bottom-6 right-4 z-30) */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label={open ? 'Close Gari Assistant' : 'Chat with Gari Assistant'}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  );
}
