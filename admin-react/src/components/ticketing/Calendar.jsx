import { useState } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getSoldPercent(event) {
  if (!event) return 0;
  const totalSold = (event.ga_tier1_sold || 0) + (event.ga_tier2_sold || 0) + (event.ga_tier3_sold || 0) + (event.ga_sold || 0);
  const totalCap = (event.ga_tier1_capacity || 100) + (event.ga_tier2_capacity || 100) + (event.ga_tier3_capacity || 100);
  if (totalCap === 0) return 0;
  return (totalSold / totalCap) * 100;
}

const gaSoldOutDates = ['2026-05-01', '2026-05-02', '2026-05-08', '2026-05-09'];

function getDotColor(pct, dateStr) {
  if (gaSoldOutDates.includes(dateStr)) return 'bg-accent-coral';
  if (pct > 80) return 'bg-accent-coral';
  if (pct > 0) return 'bg-accent-gold';
  return 'bg-accent-teal';
}

function getUrgencyLabel(pct, dateStr) {
  if (gaSoldOutDates.includes(dateStr)) return null;
  if (pct > 90) return 'Almost Full';
  if (pct > 70) return 'Selling Fast';
  return null;
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
    const pct = getSoldPercent(event);
    const urgency = getUrgencyLabel(pct, dateStr);
    const isClickable = hasEvent && !isPast;

    let cellClass = 'relative flex flex-col items-center justify-center p-2 min-h-[60px] rounded-[12px] transition-all duration-200 ';

    if (isSunday && !hasEvent) {
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
        <span className={`text-sm font-medium ${isClickable ? 'text-text-primary' : 'text-text-muted'}`}>
          {day}
        </span>
        {hasEvent && !(isSunday && !hasEvent) && (
          <>
            <div className={`w-2 h-2 rounded-full mt-1 ${getDotColor(pct, dateStr)} animate-[dotPulse_2s_ease-in-out_infinite]`} />
            {urgency && (
              <span className="text-[9px] text-accent-coral mt-0.5 leading-none">{urgency}</span>
            )}
          </>
        )}
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
