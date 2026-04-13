import { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useAvailability } from '../../hooks/useAvailability';
import { useCheckout } from '../../hooks/useCheckout';
import Calendar from './Calendar';
import FloorPlan from './FloorPlan';
import BookingPanel from './BookingPanel';

function formatTime(t) {
  if (!t) return '';
  const [h] = t.split(':');
  const hour = parseInt(h);
  if (hour === 0) return '12AM';
  if (hour < 12) return hour + 'AM';
  if (hour === 12) return '12PM';
  return (hour - 12) + 'PM';
}

function SoldOutPopup({ date, onViewTables, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    setLoading(true);
    const SUPABASE_URL = 'https://tqeunmqnaoyrerkbhokk.supabase.co';
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXVubXFuYW95cmVya2Job2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTQ1MzQsImV4cCI6MjA4OTQ3MDUzNH0.hkkuc7_YE2yf0w0NQENpahAxqxxqBfjq8n5QhtTIkw8';
    await fetch(`${SUPABASE_URL}/rest/v1/ticket_waitlist`, {
      method: 'POST',
      headers: { 'apikey': ANON, 'Authorization': `Bearer ${ANON}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ customer_name: name, customer_email: email, customer_phone: phone, event_date: date, ticket_type: 'ga' }),
    });
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🔔</div>
        <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-2">YOU'RE ON THE LIST!</h3>
        <p className="text-text-secondary text-sm mb-6">We'll notify you the moment more tickets drop.</p>
        <button onClick={onViewTables}
          className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] bg-accent-gold text-black cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg mb-3">
          VIEW VIP TABLES & SEASON PASSES
        </button>
        <button onClick={onBack}
          className="text-text-muted text-sm hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none">
          ← Back to Calendar
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack}
        className="bg-bg-surface border border-border-default hover:border-brand/40 text-text-secondary hover:text-text-primary rounded-full px-4 py-2 text-sm transition-all duration-200 flex items-center gap-1.5 mb-5 cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Change Date
      </button>

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔥</div>
        <h3 className="font-[family-name:var(--font-display)] text-brand text-2xl tracking-[3px] mb-2">THIS DATE IS ALMOST SOLD OUT</h3>
        <p className="text-text-secondary text-sm">GA tickets are gone. Drop your info and we'll notify you when we release more.</p>
      </div>

      <form onSubmit={handleJoin}>
        <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
          className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
        <input type="tel" placeholder="Phone" required value={phone} onChange={e => setPhone(e.target.value)}
          className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] bg-brand text-white cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 mt-1 mb-3">
          {loading ? 'JOINING...' : '🔔 JOIN THE WAITLIST'}
        </button>
      </form>

      <div className="text-center border-t border-border-default pt-4 mt-2">
        <p className="text-text-muted text-xs mb-3">VIP tables and season passes are still available</p>
        <button onClick={onViewTables}
          className="w-full py-3 rounded-full font-[family-name:var(--font-display)] text-sm tracking-[2px] bg-accent-gold text-black cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          VIEW AVAILABLE TABLES →
        </button>
      </div>
    </div>
  );
}

export default function TicketingSection() {
  const { eventsByDate, loading: eventsLoading } = useEvents();
  const [step, setStep] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null);

  const { availability, loading: availLoading } = useAvailability(selectedDate);
  const { checkout: testCheckout } = useCheckout();

  const selectedEvent = selectedDate ? eventsByDate[selectedDate] : null;
  const hasEarlyType = selectedEvent?.early_type != null;

  // GA sold out dates — first 3 weekends of May (FOMO wave)
  const gaSoldOutDates = ['2026-05-01', '2026-05-02', '2026-05-08', '2026-05-09'];
  const isGaSoldOut = gaSoldOutDates.includes(selectedDate);

  // Determine event type based on time block selection
  let eventType = null;
  if (hasEarlyType && selectedTimeBlock === 'early') {
    eventType = selectedEvent.early_type; // e.g. 'salsa_night', 'bachata_night'
  } else if (hasEarlyType && selectedTimeBlock === 'late') {
    eventType = 'nightclub';
  } else if (!hasEarlyType) {
    eventType = 'nightclub';
  }

  function handleSelectDate(date) {
    setSelectedDate(date);
    setSelectedTimeBlock(null);
    const event = eventsByDate[date];
    // Sold out dates — show waitlist popup
    if (gaSoldOutDates.includes(date)) {
      setSelectedTimeBlock('late');
      setStep('soldout');
      return;
    }
    if (event?.early_type) {
      setStep('timeblock');
    } else {
      setStep('floorplan');
    }
  }

  function handleSelectTimeBlock(block) {
    // If GA sold out and they pick dance night, go straight to waitlist
    if (isGaSoldOut && block === 'early') {
      setSelectedTimeBlock(block);
      setBookingType('waitlist');
      setStep('booking');
      return;
    }
    setSelectedTimeBlock(block);
    setStep('floorplan');
  }

  function handleBack() {
    if (step === 'booking') {
      setStep('floorplan');
      setBookingType(null);
      setBookingInfo(null);
    } else if (step === 'floorplan') {
      if (hasEarlyType) {
        setStep('timeblock');
        setSelectedTimeBlock(null);
      } else {
        setStep('calendar');
        setSelectedDate(null);
      }
    } else if (step === 'timeblock') {
      setStep('calendar');
      setSelectedDate(null);
      setSelectedTimeBlock(null);
    }
  }

  function handleSelectGA() {
    if (isGaSoldOut) {
      setBookingType('waitlist');
      setStep('booking');
      return;
    }
    setBookingType('ga');
    setStep('booking');
  }

  function handleSelectDirect(type) {
    setBookingType(type);
    setStep('booking');
  }

  function handleSelectVipGA() {
    setBookingType('vip_ga');
    setStep('booking');
  }

  function handleSelectTable(type, number, tier) {
    setBookingType('table');
    setBookingInfo({ type, number, tier: tier || 'vip' });
    setStep('booking');
  }

  function handleShowLadiesFree(type) {
    setBookingType(type || 'ladies_free');
    setStep('booking');
  }

  function handleBuyTest() {
    testCheckout({
      ticket_type: 'test',
      event_date: selectedDate,
      customer_name: 'Test',
      customer_email: 'test@test.com',
      customer_phone: '0000000000',
      quantity: 1,
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-border-default flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
          TICKETING
        </h2>
        <span className="flex items-center gap-2 bg-accent-teal/10 text-accent-teal border border-accent-teal/20 rounded-full px-3 py-1 text-[10px] tracking-[2px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
          LIVE SYSTEM
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        {eventsLoading ? (
          <div className="text-center py-10">
            <div className="text-text-muted text-sm">Loading events...</div>
          </div>
        ) : step === 'calendar' ? (
          <Calendar eventsByDate={eventsByDate} onSelectDate={handleSelectDate} />
        ) : step === 'soldout' ? (
          <SoldOutPopup
            date={selectedDate}
            onViewTables={() => { setStep('floorplan'); }}
            onBack={() => { setStep('calendar'); setSelectedDate(null); }}
          />
        ) : step === 'timeblock' ? (
          <div>
            {/* Date badge + back */}
            <div className="flex items-center justify-between mb-6">
              <span className="bg-brand/10 text-brand border border-brand/20 rounded-full px-4 py-1.5 text-sm font-medium">
                {formatDate(selectedDate)}
              </span>
              <button
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Change Date
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="font-[family-name:var(--font-display)] text-text-primary text-2xl tracking-[3px] mb-2">SELECT EXPERIENCE</h3>
              <p className="text-text-secondary text-sm">This event has two time blocks. Choose your vibe:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              {/* Dance Experience */}
              <button
                onClick={() => handleSelectTimeBlock('early')}
                className="bg-bg-surface border border-accent-teal/20 rounded-[16px] p-6 text-center cursor-pointer
                  transition-all duration-200 hover:-translate-y-1 hover:border-accent-teal/50 hover:shadow-[0_0_25px_rgba(45,212,191,0.15)]
                  group"
              >
                <div className="text-4xl mb-3">{'\u{1F483}'}</div>
                <div className="font-[family-name:var(--font-display)] text-accent-teal text-xl tracking-[3px] mb-2">
                  {selectedEvent?.early_type === 'salsa_night' ? 'SALSA NIGHT 18+' : 'BACHATA NIGHT 18+'}
                </div>
                <div className="text-text-secondary text-sm mb-1">
                  {formatTime(selectedEvent?.early_start) || '7PM'} - {formatTime(selectedEvent?.early_end) || '10PM'}
                </div>
                <div className="text-accent-teal text-xs mt-2 leading-relaxed">
                  {selectedEvent?.early_type === 'salsa_night'
                    ? <><span>Una noche de salsa en la casita 🇵🇷</span><br/><span>Good music, smooth drinks, and room to actually dance.</span></>
                    : <><span>Bachata inside La Casita.</span><br/><span>Closer vibes, good music, and space to move how you want.</span></>}
                </div>
              </button>

              {/* Nightclub */}
              <button
                onClick={() => handleSelectTimeBlock('late')}
                className="bg-bg-surface border border-brand/20 rounded-[16px] p-6 text-center cursor-pointer
                  transition-all duration-200 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_0_25px_rgba(255,77,141,0.15)]
                  group"
              >
                <div className="text-4xl mb-3">{'\u{1F386}'}</div>
                <div className="font-[family-name:var(--font-display)] text-brand text-xl tracking-[3px] mb-2">
                  NIGHTCLUB 21+
                </div>
                <div className="text-text-secondary text-sm mb-1">
                  10PM - 4AM
                </div>
                <div className="text-brand text-xs mt-2 leading-relaxed">
                  <span>This is what everyone's coming for.</span><br/><span>Full reggaeton takeover inside La Casita — late night gets crazy.</span>
                </div>
              </button>
            </div>
          </div>
        ) : step === 'floorplan' ? (
          availLoading ? (
            <div className="text-center py-10">
              <div className="text-text-muted text-sm">Loading availability...</div>
            </div>
          ) : (
            <FloorPlan
              date={selectedDate}
              availability={availability}
              eventType={eventType}
              onSelectGA={handleSelectGA}
              onSelectVipGA={handleSelectVipGA}
              onSelectTable={handleSelectTable}
              onBack={handleBack}
              onShowLadiesFree={handleShowLadiesFree}
              onBuyTest={handleBuyTest}
              onSelectDirect={handleSelectDirect}
              gaSoldOut={isGaSoldOut}
            />
          )
        ) : step === 'booking' ? (
          <BookingPanel
            type={bookingType}
            date={selectedDate}
            availability={availability}
            tableInfo={bookingInfo}
            onBack={handleBack}
          />
        ) : null}
      </div>
    </div>
  );
}
