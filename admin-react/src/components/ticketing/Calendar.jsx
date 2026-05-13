import { useState } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getSoldPercent(event) {
  if (!event) return 0;
  const totalSold = (event.ga_tier1_sold || 0) + (event.ga_tier2_sold || 0) + (event.ga_tier3_sold || 0) + (event.ga_tier4_sold || 0) + (event.ga_sold || 0);
  const totalCap = (event.ga_tier1_capacity ?? 100) + (event.ga_tier2_capacity ?? 100) + (event.ga_tier3_capacity ?? 100) + (event.ga_tier4_capacity ?? 0);
  if (totalCap === 0) return 0;
  return (totalSold / totalCap) * 100;
}

const cancelledDates = [];

function getDotColor() {
  return 'bg-accent-coral';
}

function getUrgencyLabel() {
  return 'Almost Full';
}

export default function Calendar({ eventsByDate, onSelectDate }) {
  const now = new Date();
  // Start on May 2026 (month 4) since events begin May 1st
  const [month, setMonth] = useState(now.getMonth() < 4 ? 4 : now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function formatDate(day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(day);
    const dayOfWeek = new Date(year, month, day).getDay();
    const isSunday = dayOfWeek === 0;
    const dateObj = new Date(year, month, day);
    const isPast = dateObj < today;
    const event = eventsByDate[dateStr];
    const hasEvent = !!event;
    const isBlocked = hasEvent && !event.is_active;
    const isCancelled = cancelledDates.includes(dateStr);
    const pct = getSoldPercent(event);
    const urgency = getUrgencyLabel(pct, dateStr);
    const isClickable = hasEvent && event.is_active && !isPast && !isCancelled;

    let cellClass = 'relative flex flex-col items-center justify-center p-2 min-h-[60px] rounded-[12px] transition-all duration-200 ';

    if (isCancelled) {
      cellClass += 'bg-bg-surface border border-red-500/30 cursor-default';
    } else if (isBlocked && !isPast) {
      cellClass += 'bg-bg-surface border border-text-muted/20 opacity-60 cursor-default';
    } else if (isSunday && !hasEvent) {
      cellClass += 'opacity-30 cursor-default';
    } else if (isPast) {
      cellClass += 'opacity-40 cursor-default';
    } else if (isClickable) {
      cellClass += 'bg-bg-surface border border-border-default hover:border-brand hover:scale-105 hover:shadow-[0_0_20px_rgba(255,77,141,0.15)] cursor-pointer';
    } else {
      cellClass += 'opacity-50 cursor-default';
    }

    cells.push(
      <div
        key={day}
        className={cellClass}
        onClick={isClickable ? () => onSelectDate(dateStr) : undefined}
      >
        {isCancelled && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 60 60" preserveAspectRatio="none">
              <line x1="8" y1="8" x2="52" y2="52" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="52" y1="8" x2="8" y2="52" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </>
        )}
        <span className={`text-sm font-medium ${isCancelled ? 'text-red-400/60' : isBlocked && !isPast ? 'text-text-muted' : isClickable ? 'text-text-primary' : 'text-text-muted'}`}>
          {day}
        </span>
        {isCancelled ? (
          <span className="text-[8px] text-red-400 font-bold tracking-[1px] mt-0.5 leading-none relative z-10">CANCELLED</span>
        ) : isBlocked && !isPast ? (
          <span className="text-[7px] text-text-muted font-bold tracking-[1px] mt-0.5 leading-none">BLOCKED</span>
        ) : hasEvent && event.is_active && !(isSunday && !hasEvent) ? (
          <>
            <div className={`w-2 h-2 rounded-full mt-1 ${getDotColor(pct, dateStr)} animate-[dotPulse_2s_ease-in-out_infinite]`} />
            {urgency && (
              <span className="text-[9px] text-accent-coral mt-0.5 leading-none">{urgency}</span>
            )}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="text-text-secondary hover:text-text-primary p-2 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h3 className="font-[family-name:var(--font-display)] text-text-primary text-2xl tracking-[3px]">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="text-text-secondary hover:text-text-primary p-2 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] tracking-[2px] text-text-muted font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      {/* Tickets drop message */}
      {(() => {
        const blockedDates = Object.keys(eventsByDate)
          .filter(d => !eventsByDate[d].is_active && new Date(d + 'T00:00:00') >= today)
          .sort();
        if (blockedDates.length === 0) return null;
        const nextBlocked = new Date(blockedDates[0] + 'T00:00:00');
        const weekOf = new Date(nextBlocked);
        weekOf.setDate(weekOf.getDate() - weekOf.getDay() + 1);
        const weekLabel = weekOf.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        return (
          <div className="text-center mt-4 bg-accent-gold/5 border border-accent-gold/15 rounded-[12px] px-4 py-3">
            <span className="text-accent-gold text-sm font-medium tracking-[1px]">
              Tickets drop the week of {weekLabel}
            </span>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-teal" />
          <span className="text-[10px] text-text-muted">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-gold" />
          <span className="text-[10px] text-text-muted">Selling</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-coral" />
          <span className="text-[10px] text-text-muted">Almost Full</span>
        </div>
      </div>
    </div>
  );
}
