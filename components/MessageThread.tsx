'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';
import { waLink } from '@/lib/config/company';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
    image: string | null;
  };
}

interface MessageThreadProps {
  bookingId: string;
  otherPartyName?: string;
  otherPartyPhone?: string;
}

/** Show WhatsApp fallback if last message is from us and is > 2 hours old */
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function MessageThread({ bookingId, otherPartyName, otherPartyPhone }: MessageThreadProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (session?.user as any)?.id;

  const showWaFallback = useMemo(() => {
    if (messages.length === 0) return false;
    const last = messages[messages.length - 1];
    const isLastMine = last.sender.id === myId;
    const isOld = Date.now() - new Date(last.createdAt).getTime() > TWO_HOURS_MS;
    return isLastMine && isOld;
  }, [messages, myId]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages?bookingId=${bookingId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 8 seconds
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      content: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      sender: {
        id: myId,
        name: session?.user?.name || null,
        avatar: null,
        image: session?.user?.image || null,
      },
    };
    setMessages(prev => [...prev, optimistic]);
    const sent = text.trim();
    setText('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, content: sent }),
      });
      if (res.ok) {
        const real = await res.json();
        setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setText(sent);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            <p>No messages yet. Say hi to your {otherPartyName || 'host'}!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender.id === myId;
          const avatar = msg.sender.avatar || msg.sender.image;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isMe && (
                avatar ? (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                    <Image src={avatar} alt={msg.sender.name || ''} fill className="object-cover" sizes="28px" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                    {msg.sender.name?.[0] || '?'}
                  </div>
                )
              )}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-text-light px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && msg.read && <span className="ml-1 text-primary">✓✓</span>}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* WhatsApp fallback banner */}
      {showWaFallback && (
        <div className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 flex items-center justify-between gap-3">
          <p className="text-xs text-green-800 dark:text-green-300 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            No reply in 2+ hours?
          </p>
          <a
            href={otherPartyPhone
              ? `https://wa.me/${otherPartyPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I sent you a message on Gari about my booking.`)}`
              : waLink(`Hi, I need help with my Gari booking (${bookingId}).`)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-green-700 dark:text-green-400 hover:underline whitespace-nowrap"
          >
            Send on WhatsApp →
          </a>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1 py-2.5 text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary px-4 py-2.5 flex-shrink-0"
          aria-label="Send"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
