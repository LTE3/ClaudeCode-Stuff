import TicketingSection from './ticketing/TicketingSection';
import { supabaseEdge } from '../config/supabase';
import { useState } from 'react';

function SeasonPassCard({ type, title, emoji, desc, price, color, bgColor, textColor }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await supabaseEdge('create-checkout', {
        ticket_type: type,
        event_date: '2026-05-01',
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      });
      if (data.url) {
        (window.top || window).location.href = data.url;
      } else {
        setError(data.error || 'Checkout failed');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className={`bg-bg-surface border ${color} rounded-[16px] p-5 text-center`}>
      <div className="text-3xl mb-2">{emoji}</div>
      <div className={`font-[family-name:var(--font-display)] ${textColor} text-lg tracking-[3px] mb-1`}>{title}</div>
      <div className="text-text-muted text-xs mb-2">{desc}</div>
      <div className="text-text-primary text-3xl font-bold mb-3">${price}</div>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className={`w-full py-3 rounded-full font-[family-name:var(--font-display)] text-sm tracking-[2px] ${bgColor} cursor-pointer border-none hover:-translate-y-0.5 transition-all`}
        >
          GET {title}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="text-left space-y-2">
          <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
            className="w-full p-3 bg-bg-elevated border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand" />
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-3 bg-bg-elevated border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand" />
          <input type="tel" placeholder="Phone" required value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full p-3 bg-bg-elevated border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand" />
          {error && <p className="text-accent-coral text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className={`w-full py-3 rounded-full font-[family-name:var(--font-display)] text-sm tracking-[2px] ${bgColor} cursor-pointer border-none hover:-translate-y-0.5 transition-all disabled:opacity-50`}>
            {loading ? 'PROCESSING...' : `BUY — $${price}`}
          </button>
        </form>
      )}
    </div>
  );
}

function SeasonPasses() {
  return (
    <div className="mt-8 mb-4">
      <h3 className="font-[family-name:var(--font-display)] text-center text-text-primary text-xl tracking-[4px] mb-4">
        SEASON PASSES
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <SeasonPassCard
          type="season_pass_regular"
          title="BAD BUNNY PASS"
          emoji="🎟️"
          desc="Unlimited access every Friday & Saturday all season"
          price={99}
          color="border-brand/20"
          bgColor="bg-brand text-white"
          textColor="text-brand"
        />
        <SeasonPassCard
          type="season_pass_vip"
          title="VIP SEASON PASS"
          emoji="👑"
          desc="VIP backstage access • Unlimited entry to all events • 1 drink per event"
          price={249}
          color="border-accent-gold/20"
          bgColor="bg-accent-gold text-black"
          textColor="text-accent-gold"
        />
      </div>
    </div>
  );
}

export default function PublicTicketing() {
  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="max-w-[960px] mx-auto px-4 py-4">
        <div className="text-center mb-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[5px] text-brand">
            LA CASITA
          </h1>
          <p className="text-text-secondary mt-1 text-xs">Select a date to get tickets</p>
        </div>
        <TicketingSection />
        <SeasonPasses />
      </div>
    </div>
  );
}
