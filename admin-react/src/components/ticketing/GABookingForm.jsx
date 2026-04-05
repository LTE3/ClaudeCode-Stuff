import { useState } from 'react';
import { useCheckout } from '../../hooks/useCheckout';

function getCurrentTier(availability) {
  if (!availability) return { tier: 1, price: 10, fee: 5, type: 'ga_tier1', remaining: 100 };
  const t1sold = availability.ga_tier1_sold || 0;
  const t1cap = availability.ga_tier1_capacity || 100;
  const t2sold = availability.ga_tier2_sold || 0;
  const t2cap = availability.ga_tier2_capacity || 100;
  const t3sold = availability.ga_tier3_sold || 0;
  const t3cap = availability.ga_tier3_capacity || 100;

  if (t1sold < t1cap) return { tier: 1, price: 10, fee: 5, type: 'ga_tier1', remaining: t1cap - t1sold };
  if (t2sold < t2cap) return { tier: 2, price: 15, fee: 5, type: 'ga_tier2', remaining: t2cap - t2sold };
  if (t3sold < t3cap) return { tier: 3, price: 20, fee: 5, type: 'ga_tier3', remaining: t3cap - t3sold };
  return { tier: 3, price: 20, fee: 5, type: 'ga_tier3', remaining: 0 };
}

export default function GABookingForm({ date, availability, ticketOverride }) {
  const tierInfo = getCurrentTier(availability);
  const isLadiesGroup = ticketOverride === 'ladies_group';
  const isOpenBar = ticketOverride === 'ga_open_bar';
  const remaining = tierInfo.remaining;
  const PRICE = isLadiesGroup ? 35 : isOpenBar ? 70 : tierInfo.price;
  const FEE = isLadiesGroup ? 0 : isOpenBar ? 0 : tierInfo.fee;
  const TOTAL = PRICE + FEE;
  const maxQty = isLadiesGroup ? 1 : Math.min(10, remaining);
  const { checkout, loading } = useCheckout();

  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [addOpenBar, setAddOpenBar] = useState(false);
  const showOpenBarAddon = !isLadiesGroup && !isOpenBar;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ticket_type: addOpenBar ? 'ga_open_bar' : (ticketOverride || tierInfo.type),
      event_date: date,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      quantity,
    };
    if (promoCode.trim()) payload.promo_code = promoCode.trim();
    const err = await checkout(payload);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-blue text-2xl tracking-[3px] mb-1">
        {isLadiesGroup ? 'LADIES GROUP x4' : isOpenBar ? 'GA + OPEN BAR' : 'GENERAL ADMISSION'}
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        {isLadiesGroup ? '4 ladies entry for $35' : isOpenBar ? 'GA entry + open bar all night' : 'Full venue access, dance floor, bar area'}
      </p>

      <div className="bg-bg-surface border border-accent-blue/15 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary text-sm">Price</span>
          <span className="text-accent-blue font-bold text-lg">${PRICE} <span className="text-text-muted text-xs font-normal">+ ${FEE} fee</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Remaining</span>
          <span className="text-accent-blue text-sm">{remaining} tickets</span>
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

      <input
        type="text" placeholder="Promo Code (optional)" value={promoCode}
        onChange={e => setPromoCode(e.target.value.toUpperCase())}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold focus:ring-[3px] focus:ring-accent-gold/20 transition-all duration-200 mb-2.5"
      />

      {showOpenBarAddon && (
        <label className="flex items-center gap-3 p-3.5 bg-bg-surface border border-accent-gold/20 rounded-[8px] mb-2.5 cursor-pointer hover:border-accent-gold/40 transition-all">
          <input
            type="checkbox"
            checked={addOpenBar}
            onChange={e => setAddOpenBar(e.target.checked)}
            className="w-5 h-5 accent-accent-gold"
          />
          <div>
            <span className="text-accent-gold font-medium text-sm">🍹 Add Open Bar — +$50</span>
            <span className="text-text-muted text-xs block">Unlimited drinks all night</span>
          </div>
        </label>
      )}

      {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || remaining === 0}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-blue text-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'PROCESSING...' : `BUY ${isLadiesGroup ? 'LADIES x4' : isOpenBar ? 'GA + OPEN BAR' : addOpenBar ? 'GA + OPEN BAR' : 'GA'} — $${addOpenBar ? 70 * quantity : TOTAL * quantity}`}
      </button>
    </form>
  );
}
