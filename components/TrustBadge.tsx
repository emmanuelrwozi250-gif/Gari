'use client';

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
  score: number;
  saccoVerified?: boolean;
  nidaVerified?: boolean;
  licenseVerified?: boolean;
  compact?: boolean;
}

function getTrustLevel(score: number) {
  if (score >= 80) return { label: 'Highly Trusted', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', barColor: 'bg-green-500' };
  if (score >= 55) return { label: 'Trusted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', barColor: 'bg-blue-500' };
  if (score >= 30) return { label: 'Building Trust', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', barColor: 'bg-yellow-500' };
  return { label: 'New Member', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', barColor: 'bg-gray-400' };
}

export function TrustBadge({ score, saccoVerified, nidaVerified, licenseVerified, compact = false }: Props) {
  const level = getTrustLevel(score);
  const Icon = score >= 80 ? ShieldCheck : score >= 30 ? Shield : ShieldAlert;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${level.bg} ${level.border} ${level.color}`}>
        <Icon size={12} />
        <span>{score}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${level.bg} ${level.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className={level.color} />
          <span className={`font-semibold text-sm ${level.color}`}>{level.label}</span>
        </div>
        <span className={`text-2xl font-black ${level.color}`}>{score}<span className="text-sm font-normal">/100</span></span>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${level.barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Verification badges */}
      <div className="flex flex-wrap gap-2">
        <VerifBadge label="Email" active={true} />
        <VerifBadge label="NIDA" active={!!nidaVerified} />
        <VerifBadge label="License" active={!!licenseVerified} />
        <VerifBadge label="SACCO" active={!!saccoVerified} highlight />
      </div>
    </div>
  );
}

function VerifBadge({ label, active, highlight }: { label: string; active: boolean; highlight?: boolean }) {
  const base = active
    ? highlight
      ? 'bg-primary text-white'
      : 'bg-white text-gray-700 border border-gray-300'
    : 'bg-white/40 text-gray-400 border border-gray-200';
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${base}`}>
      {active ? '✓ ' : ''}{label}
    </span>
  );
}
