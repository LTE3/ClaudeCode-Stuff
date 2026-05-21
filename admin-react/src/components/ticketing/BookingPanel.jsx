import { useState } from 'react';
import { useCheckout } from '../../hooks/useCheckout';
import GABookingForm from './GABookingForm';
import VipGABookingForm from './VipGABookingForm';
import TableBookingForm from './TableBookingForm';
import LadiesFreeForm from './LadiesFreeForm';
import WaitlistForm from './WaitlistForm';

const directTypes = {
  ga_open_bar: { title: 'GA + OPEN BAR', desc: 'GA entry + unlimited drinks all night', price: 100 },
  ladies_group: { title: 'LADIES GROUP x4', desc: '4 ladies entry', price: 35 },
  day_ladies_open_bar: { title: 'LADIES OPEN BAR', desc: 'Mojitos & Piña Coladas 10AM-11:30AM + Day Party Entry', price: 25 },
  day_guys_open_bar: { title: 'GUYS OPEN BAR', desc: 'Mojitos & Piña Coladas 10AM-11:30AM + Day Party Entry', price: 40 },
  day_ladies_ga: { title: 'LADIES GA', desc: 'Day Party general admission', price: 10 },
  day_guys_ga: { title: 'GUYS GA', desc: 'Day Party general admission', price: 20 },
};

function DirectBookingForm({ type, date }) {
  const info = directTypes[type];
  const { checkout, loading } = useCheckout();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = { ticket_type: type, event_date: date, customer_name: name, customer_email: email, customer_phone: phone, quantity: 1 };
    if (promoCode.trim()) payload.promo_code = promoCode.trim();
    const err = await checkout(payload);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-gold text-2xl tracking-[3px] mb-1">{info.title}</h3>
      <p className="text-text-secondary text-sm mb-4">{info.desc}</p>
      <div className="bg-bg-surface border border-accent-gold/15 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Price</span>
          <span className="text-accent-gold font-bold text-lg">${info.price}</span>
        </div>
      </div>
      <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
      <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
      <input type="tel" placeholder="Phone" required value={phone} onChange={e => setPhone(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5" />
      <input type="text" placeholder="Promo Code (optional)" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold focus:ring-[3px] focus:ring-accent-gold/20 transition-all duration-200 mb-2.5" />
      {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-gold text-black disabled:opacity-50 disabled:cursor-not-allowed mt-2">
        {loading ? 'PROCESSING...' : `BUY ${info.title} — $${info.price}`}
      </button>
    </form>
  );
}

export default function BookingPanel({ type, date, availability, tableInfo, onBack }) {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="bg-bg-surface border border-border-default hover:border-brand/40 text-text-secondary hover:text-text-primary rounded-full px-4 py-2 text-sm transition-all duration-200 flex items-center gap-1.5 mb-5 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Floor Plan
      </button>

      {/* Render correct form */}
      {type === 'ga' && (
        <GABookingForm date={date} availability={availability} />
      )}
      {type === 'vip_ga' && (
        <VipGABookingForm date={date} availability={availability} />
      )}
      {type === 'table' && tableInfo && (
        <TableBookingForm
          date={date}
          type={tableInfo.type}
          number={tableInfo.number}
          tier={tableInfo.tier}
          availability={availability}
        />
      )}
      {type === 'ladies_free' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.ladies_free_remaining}
          claimType="ladies_free"
        />
      )}
      {type === 'dance_ga_free' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.free_ga_remaining}
          claimType="dance_ga_free"
          title="FREE DANCE GA"
          subtitle="Free entry to the dance experience"
        />
      )}
      {type === 'free_before_12' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.free_ga_remaining}
          claimType="dance_ga_free"
          title="FREE BEFORE 12AM"
          subtitle="Free admission before midnight. Must be on the guest list."
        />
      )}
      {type === 'day_free' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.day_free_remaining}
          claimType="day_free"
          title="FREE BEFORE 12PM"
          subtitle="Free day party entry before noon. First 100 people."
        />
      )}
      {type === 'day_ladies_free' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.day_ladies_free_remaining}
          claimType="day_ladies_free"
          title="LADIES FREE"
          subtitle="Free day party entry for ladies before noon."
        />
      )}
      {(type === 'ga_open_bar' || type === 'ladies_group' || type === 'day_ladies_open_bar' || type === 'day_guys_open_bar' || type === 'day_ladies_ga' || type === 'day_guys_ga') && (
        <DirectBookingForm type={type} date={date} />
      )}
      {type === 'waitlist' && (
        <WaitlistForm date={date} />
      )}
    </div>
  );
}
