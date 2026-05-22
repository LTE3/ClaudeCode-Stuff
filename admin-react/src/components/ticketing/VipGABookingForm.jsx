import { useState } from 'react';
import { useCheckout } from '../../hooks/useCheckout';

const PRICE = 35;
const FEE = 5;
const TOTAL = PRICE + FEE;

export default function VipGABookingForm({ date, availability }) {
  const remaining = availability?.vip_ga_remaining ?? 0;
  const maxQty = Math.min(5, remaining);
  const { checkout, loading } = useCheckout();

  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = await checkout({
      ticket_type: 'vip_ga',
      event_date: date,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      quantity,
    });
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-gold text-2xl tracking-[3px] mb-1">
        VIP GA
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        Priority entry, VIP lounge access, premium experience
      </p>

      <div className="bg-bg-surface border border-accent-gold/15 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary text-sm">Price</span>
          <span className="text-accent-gold font-bold text-lg">${PRICE} <span className="text-text-muted text-xs font-normal">+ ${FEE} fee</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Remaining</span>
          <span className="text-accent-gold text-sm">{Math.min(remaining, 12)} tickets</span>
        </div>
      </div>

      <div className="mb-2.5">
        <label className="text-text-secondary text-xs mb-1 block">Quantity</label>
        <select
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="bg-bg-surface text-text-primary border border-border-default rounded-[8px] p-2 px-3.5 w-full"
        >
          {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
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
        disabled={loading || remaining === 0}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-gold text-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'PROCESSING...' : `BUY VIP GA — $${TOTAL * quantity}`}
      </button>
    </form>
  );
}
