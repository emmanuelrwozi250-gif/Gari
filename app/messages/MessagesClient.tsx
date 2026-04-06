'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, Car as CarIcon } from 'lucide-react';
import { MessageThread } from '@/components/MessageThread';

interface BookingSummary {
  id: string;
  car: { make: string; model: string; year: number; photos: string[]; hostId: string };
  renter: { id: string; name: string | null; avatar: string | null; image: string | null };
  messages: { content: string; createdAt: string }[];
}

interface MessagesClientProps {
  bookings: BookingSummary[];
  userId: string;
  unreadMap: Record<string, number>;
  defaultBookingId?: string;
}

export function MessagesClient({ bookings, userId, unreadMap, defaultBookingId }: MessagesClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultBookingId || bookings[0]?.id || null);
  const selected = bookings.find(b => b.id === selectedId);

  const getOtherParty = (b: BookingSummary) =>
    b.renter.id === userId ? null : b.renter;

  const getLabel = (b: BookingSummary) => {
    const other = getOtherParty(b);
    return other ? other.name : `Host (${b.car.make} ${b.car.model})`;
  };

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">

          {/* Sidebar */}
          <aside className="w-72 border-r border-border bg-white dark:bg-gray-900 flex flex-col flex-shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border">
              <h1 className="font-bold text-lg text-text-primary dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Messages
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-text-light" />
                  No conversations yet
                </div>
              ) : (
                bookings.map(b => {
                  const photo = b.car.photos[0];
                  const lastMsg = b.messages[0];
                  const unread = unreadMap[b.id] || 0;
                  const isActive = b.id === selectedId;

                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-border/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isActive ? 'bg-primary-light dark:bg-primary/10 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      {/* Car thumbnail */}
                      <div className="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0">
                        {photo?.startsWith('http') ? (
                          <Image src={photo} alt={b.car.make} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <CarIcon className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-text-primary dark:text-white truncate">
                            {b.car.year} {b.car.make} {b.car.model}
                          </span>
                          {unread > 0 && (
                            <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary truncate">
                          {lastMsg ? lastMsg.content : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Thread */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
            {selected ? (
              <>
                {/* Thread header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
                  {selected.car.photos[0]?.startsWith('http') && (
                    <div className="relative w-10 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={selected.car.photos[0]} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white">
                      {selected.car.year} {selected.car.make} {selected.car.model}
                    </div>
                    <div className="text-xs text-text-secondary">
                      with {getLabel(selected)}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <MessageThread
                    bookingId={selected.id}
                    otherPartyName={getLabel(selected) || undefined}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-12 h-12 text-text-light mx-auto mb-3" />
                  <p className="text-text-secondary">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
