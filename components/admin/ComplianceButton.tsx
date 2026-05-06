'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  carId: string;
  action: 'approve' | 'reject';
}

export function ComplianceButton({ carId, action }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}/compliance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh(); // re-run the server component to update the listing
      } else {
        const data = await res.json();
        alert(data.error ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  const isApprove = action === 'approve';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
        isApprove
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {loading ? '…' : isApprove ? '✓ Approve' : 'Reject'}
    </button>
  );
}
