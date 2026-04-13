import { useState } from 'react';
import { supabaseGet } from '../../config/supabase';

export default function WaitlistForm({ date }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const SUPABASE_URL = 'https://tqeunmqnaoyrerkbhokk.supabase.co';
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXVubXFuYW95cmVya2Job2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTQ1MzQsImV4cCI6MjA4OTQ3MDUzNH0.hkkuc7_YE2yf0w0NQENpahAxqxxqBfjq8n5QhtTIkw8';
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/ticket_waitlist`, {
        method: 'POST',
        headers: {
          'apikey': ANON,
          'Authorization': `Bearer ${ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          event_date: date,
          ticket_type: 'ga',
        }),
      });
      if (resp.ok || resp.status === 201) {
        setSuccess(true);
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🔔</div>
        <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-2">
          YOU'RE ON THE LIST!
        </h3>
        <p className="text-text-secondary text-sm">
          We'll notify you the moment more tickets drop for this date.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-coral text-2xl tracking-[3px] mb-1">
        GA TICKETS — SOLD OUT
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        This date sold out fast. Drop your info below and we'll notify you when we release more tickets.
      </p>

      <div className="bg-bg-surface border border-accent-coral/15 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Status</span>
          <span className="text-accent-coral font-bold text-sm tracking-[2px]">SOLD OUT</span>
        </div>
      </div>

      <input
        type="text" placeholder="Full Name" required value={name}
        onChange={e => setName(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />
      <input
        type="email" placeholder="Email" required value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />
      <input
        type="tel" placeholder="Phone" required value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />

      {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-coral text-white disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'JOINING...' : '🔔 JOIN THE WAITLIST'}
      </button>

      <p className="text-text-muted text-xs text-center mt-3">
        VIP tables and season passes are still available — scroll down to book.
      </p>
    </form>
  );
}
