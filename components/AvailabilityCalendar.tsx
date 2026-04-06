'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, CalendarX, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface AvailabilityCalendarProps {
  carId: string;
  readOnly?: boolean;
}

export function AvailabilityCalendar({ carId, readOnly = false }: AvailabilityCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [blocked, setBlocked] = useState<BlockedRange[]>([]);
  const [bookedRanges, setBookedRanges] = useState<{ pickupDate: string; returnDate: string }[]>([]);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = startOfDay(new Date());
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDayOffset = startOfMonth(month).getDay(); // 0=Sun

  useEffect(() => {
    fetch(`/api/cars/${carId}/availability`)
      .then(r => r.json())
      .then(data => {
        setBlocked(data.blocked || []);
        setBookedRanges(data.bookings || []);
      })
      .finally(() => setLoading(false));
  }, [carId]);

  const isBlocked = (day: Date) =>
    blocked.some(b =>
      isWithinInterval(day, { start: new Date(b.startDate), end: new Date(b.endDate) })
    );

  const isBooked = (day: Date) =>
    bookedRanges.some(b =>
      isWithinInterval(day, { start: new Date(b.pickupDate), end: new Date(b.returnDate) })
    );

  const isInSelection = (day: Date) => {
    if (!selectionStart || !hoveredDate) return false;
    const [a, b] = selectionStart <= hoveredDate
      ? [selectionStart, hoveredDate]
      : [hoveredDate, selectionStart];
    return isWithinInterval(day, { start: a, end: b });
  };

  const handleDayClick = async (day: Date) => {
    if (readOnly || isBefore(day, today)) return;
    if (!selectionStart) {
      setSelectionStart(day);
    } else {
      // Confirm range
      const [start, end] = selectionStart <= day ? [selectionStart, day] : [day, selectionStart];
      setSaving(true);
      try {
        const res = await fetch(`/api/cars/${carId}/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
            reason: reason || null,
          }),
        });
        if (res.ok) {
          const newBlock = await res.json();
          setBlocked(prev => [...prev, newBlock]);
          toast.success('Dates blocked');
          setReason('');
        } else {
          toast.error('Failed to block dates');
        }
      } finally {
        setSaving(false);
        setSelectionStart(null);
        setHoveredDate(null);
      }
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      await fetch(`/api/cars/${carId}/availability?blockId=${blockId}`, { method: 'DELETE' });
      setBlocked(prev => prev.filter(b => b.id !== blockId));
      toast.success('Block removed');
    } catch {
      toast.error('Failed to remove block');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading calendar...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="card p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-text-primary dark:text-white">
            {format(month, 'MMMM yyyy')}
          </span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-xs text-text-light font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {daysInMonth.map(day => {
            const past = isBefore(day, today);
            const blocked_ = isBlocked(day);
            const booked_ = isBooked(day);
            const inSel = isInSelection(day);
            const isStart = selectionStart && format(selectionStart, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');

            let cls = 'text-xs font-medium rounded-lg h-8 flex items-center justify-center cursor-pointer select-none transition-colors ';
            if (past) cls += 'text-text-light cursor-default ';
            else if (booked_) cls += 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-default ';
            else if (blocked_) cls += 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ';
            else if (isStart) cls += 'bg-primary text-white ';
            else if (inSel) cls += 'bg-primary/20 text-primary ';
            else cls += 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-primary dark:text-white ';

            return (
              <div
                key={day.toISOString()}
                className={cls}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => selectionStart && !past && setHoveredDate(day)}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-xs text-text-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded" /> Blocked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary/20 rounded" /> Selected</span>
        </div>
      </div>

      {/* Block reason input */}
      {!readOnly && selectionStart && (
        <div className="card p-4 border-primary border">
          <p className="text-sm text-text-secondary mb-2">
            <strong>Click another date</strong> to complete blocking. Start: <strong>{format(selectionStart, 'dd MMM')}</strong>
          </p>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason (optional — e.g. maintenance)"
            className="input text-sm w-full"
          />
          <button onClick={() => { setSelectionStart(null); setHoveredDate(null); }} className="text-xs text-text-light hover:text-red-500 mt-2">
            Cancel
          </button>
        </div>
      )}

      {/* Active blocks list */}
      {!readOnly && blocked.length > 0 && (
        <div className="card p-4 space-y-2">
          <h4 className="font-semibold text-sm text-text-primary dark:text-white flex items-center gap-2">
            <CalendarX className="w-4 h-4 text-red-500" /> Blocked Periods
          </h4>
          {blocked.map(b => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {format(new Date(b.startDate), 'dd MMM')} — {format(new Date(b.endDate), 'dd MMM yyyy')}
                {b.reason && <span className="text-text-light ml-1">({b.reason})</span>}
              </span>
              <button onClick={() => removeBlock(b.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
        </div>
      )}
    </div>
  );
}
