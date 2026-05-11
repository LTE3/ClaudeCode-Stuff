import { useState } from 'react';
import { useCheckout } from '../../hooks/useCheckout';

const VIP_COUCH_CONFIG = {
  price: 700,
  deposit: 100,
  partyMin: 5,
  partyMax: 10,
  package: '2 Premium Bottles, 1 House Champagne, 1 Hookah, $50 Merch Credit, Full Admission',
  packageName: 'VIP Couch Package',
};

const VIP_HIGH_TOP_CONFIG = {
  price: 450,
  deposit: 50,
  partyMin: 1,
  partyMax: 4,
  package: '1 Premium Bottle, 1 House Champagne, 1 Hookah, $50 Merch Credit, Full Admission',
  packageName: 'VIP High Top Package',
};

const REGULAR_COUCH_CONFIG = {
  price: 600,
  deposit: 100,
  partyMin: 5,
  partyMax: 10,
  package: '2 Bottles, 1 House Champagne, Admission Separate',
  packageName: 'DTMF Package',
};

const REGULAR_HIGH_TOP_CONFIG = {
  price: 300,
  deposit: 50,
  partyMin: 1,
  partyMax: 4,
  package: '1 Casamigos Bottle, 1 Hookah, Admission Separate',
  packageName: 'Verano Package',
};

function getConfig(type, tier) {
  if (tier === 'vip') {
    return type === 'couch' ? VIP_COUCH_CONFIG : VIP_HIGH_TOP_CONFIG;
  }
  return type === 'couch' ? REGULAR_COUCH_CONFIG : REGULAR_HIGH_TOP_CONFIG;
}

export default function TableBookingForm({ date, type, number, availability, tier }) {
  const config = getConfig(type, tier || 'vip');
  const isVip = (tier || 'vip') === 'vip';
  const displayName = isVip
    ? (type === 'couch' ? `VIP Couch ${number}` : `VIP High Top ${number}`)
    : (type === 'couch' ? `Couch ${number}` : `High Top ${number}`);

  const accentColor = isVip ? 'accent-gold' : 'accent-teal';

  const { checkout, loading } = useCheckout();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(config.partyMin);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');

  function getTicketType() {
    if (isVip) return type === 'couch' ? 'vip_couch' : 'vip_high_top';
    return type === 'couch' ? 'regular_couch' : 'regular_high_top';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ticket_type: getTicketType(),
      event_date: date,
      table_id: `${type}_${number}`,
      time_slot: null,
      tier: tier || 'vip',
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      party_size: partySize,
    };
    if (promoCode.trim()) payload.promo_code = promoCode.trim();
    const err = await checkout(payload);
    if (err) setError(err);
  }

  // Choose which flyer images to show
  const flyerImages = isVip
    ? [
        { src: '/bottle-menu-vip.jpg', alt: 'VIP Bottle Menu' },
        { src: '/bottle-menu-packages.jpg', alt: 'Packages Menu' },
      ]
    : [
        { src: '/bottle-menu-regular.jpg', alt: 'Bottle Service Menu' },
        { src: '/bottle-menu-packages.jpg', alt: 'Packages Menu' },
      ];

  return (
    <div>
      <h3 className={`font-[family-name:var(--font-display)] text-${accentColor} text-2xl tracking-[3px] mb-1`}>
        {displayName.toUpperCase()}
      </h3>
      <p className="text-text-secondary text-sm mb-1">
        {config.packageName}
      </p>
      <p className="text-text-secondary text-sm mb-2">
        Party of {config.partyMin}-{config.partyMax} guests
      </p>

      {/* Package includes */}
      <div className={`bg-bg-surface border border-${accentColor}/15 rounded-lg p-4 mb-5`}>
        <div className={`text-[10px] tracking-[2px] text-${accentColor} mb-2 font-medium`}>PACKAGE INCLUDES</div>
        <p className="text-text-secondary text-sm">{config.package}</p>
      </div>

      {/* Bottle menu images */}
      <div className="flex gap-3 mb-5">
        {flyerImages.map(img => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className="w-1/2 rounded-lg border border-border-default"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ))}
      </div>

      {/* Price display */}
      <div className={`bg-bg-surface border border-${accentColor}/15 rounded-[12px] p-4 mb-5 text-center`}>
        <div className="text-text-muted text-xs mb-1">Full Night &bull; 10PM - 4AM</div>
        <div className={`text-${accentColor} text-2xl font-bold`}>${config.price}++</div>
        <div className="text-text-muted text-[10px] mt-1">${config.deposit} deposit to reserve</div>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit}>
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

          <div className="mb-4">
            <label className="text-text-secondary text-xs mb-1 block">Party Size</label>
            <select
              value={partySize}
              onChange={e => setPartySize(Number(e.target.value))}
              className="bg-bg-surface text-text-primary border border-border-default rounded-[8px] p-2 px-3.5 w-full"
            >
              {Array.from({ length: config.partyMax - config.partyMin + 1 }, (_, i) => config.partyMin + i).map(n => (
                <option key={n} value={n}>{n} guests</option>
              ))}
            </select>
          </div>

          <input
            type="text" placeholder="Promo Code (optional)" value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold focus:ring-[3px] focus:ring-accent-gold/20 transition-all duration-200 mb-2.5"
          />

          {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none ${isVip ? 'bg-accent-gold text-black' : 'bg-accent-teal text-black'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'PROCESSING...' : `PAY DEPOSIT — $${config.deposit}`}
          </button>
        </form>
    </div>
  );
}
