'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function UnreadMessagesBadge() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    function poll() {
      fetch('/api/messages/unread-count')
        .then(r => r.json())
        .then(d => setCount(d.count ?? 0))
        .catch(() => {});
    }

    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [session]);

  if (count <= 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}
