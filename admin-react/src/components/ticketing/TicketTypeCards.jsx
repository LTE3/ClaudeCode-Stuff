const nightclubCards = [
  {
    key: 'ladies_free',
    emoji: '\u{1F483}',
    title: 'LADIES FREE',
    price: 'FREE',
    fee: null,
    color: 'teal',
    borderColor: 'border-accent-teal/15',
    hoverBorder: 'hover:border-accent-teal/40',
    textColor: 'text-accent-teal',
    accentBg: 'bg-accent-teal',
    shadow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    key: 'free_before_12',
    emoji: '\u{1F389}',
    title: 'FREE BEFORE 12:30AM',
    price: 'FREE',
    fee: null,
    color: 'teal',
    borderColor: 'border-accent-teal/15',
    hoverBorder: 'hover:border-accent-teal/40',
    textColor: 'text-accent-teal',
    accentBg: 'bg-accent-teal',
    shadow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    key: 'ga',
    emoji: '\u{1F3AB}',
    title: 'GENERAL ADMISSION',
    price: '$10',
    fee: null,
    color: 'blue',
    borderColor: 'border-accent-blue/15',
    hoverBorder: 'hover:border-accent-blue/40',
    textColor: 'text-accent-blue',
    accentBg: 'bg-accent-blue',
    shadow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
  {
    key: 'vip_ga',
    emoji: '\u2B50',
    title: 'RESERVE A TABLE',
    price: '',
    fee: null,
    color: 'gold',
    borderColor: 'border-accent-gold/15',
    hoverBorder: 'hover:border-accent-gold/40',
    textColor: 'text-accent-gold',
    accentBg: 'bg-accent-gold',
    shadow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  {
    key: 'ga_open_bar',
    emoji: '\u{1F378}',
    title: 'GA + OPEN BAR',
    price: '$100',
    fee: null,
    subtitle: 'Open bar till 12 AM',
    color: 'gold',
    borderColor: 'border-accent-gold/15',
    hoverBorder: 'hover:border-accent-gold/40',
    textColor: 'text-accent-gold',
    accentBg: 'bg-accent-gold',
    shadow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  {
    key: 'ladies_group',
    emoji: '\u{1F46F}',
    title: 'LADIES x4',
    price: '$35',
    fee: null,
    color: 'pink',
    borderColor: 'border-brand/15',
    hoverBorder: 'hover:border-brand/40',
    textColor: 'text-brand',
    accentBg: 'bg-brand',
    shadow: 'hover:shadow-[0_0_20px_rgba(255,77,141,0.15)]',
  },
];

const danceCards = [
  {
    key: 'free_ga',
    emoji: '\u{1F3B6}',
    title: 'FREE GA',
    price: 'FREE',
    fee: null,
    subtitle: 'First 150 free',
    color: 'teal',
    borderColor: 'border-accent-teal/15',
    hoverBorder: 'hover:border-accent-teal/40',
    textColor: 'text-accent-teal',
    accentBg: 'bg-accent-teal',
    shadow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    key: 'ga',
    emoji: '\u{1F3AB}',
    title: 'GA $10',
    price: '$10',
    fee: null,
    subtitle: 'After free tickets gone',
    color: 'blue',
    borderColor: 'border-accent-blue/15',
    hoverBorder: 'hover:border-accent-blue/40',
    textColor: 'text-accent-blue',
    accentBg: 'bg-accent-blue',
    shadow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
];

const dayPartyCards = [
  {
    key: 'day_free',
    emoji: '☀️',
    title: 'FREE BEFORE 12PM',
    price: 'FREE',
    fee: null,
    color: 'teal',
    borderColor: 'border-accent-teal/15',
    hoverBorder: 'hover:border-accent-teal/40',
    textColor: 'text-accent-teal',
    accentBg: 'bg-accent-teal',
    shadow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    key: 'day_ladies_free',
    emoji: '\u{1F483}',
    title: 'LADIES FREE',
    price: 'FREE',
    fee: null,
    color: 'teal',
    borderColor: 'border-accent-teal/15',
    hoverBorder: 'hover:border-accent-teal/40',
    textColor: 'text-accent-teal',
    accentBg: 'bg-accent-teal',
    shadow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    key: 'day_ladies_open_bar',
    emoji: '\u{1F379}',
    title: 'LADIES OPEN BAR',
    price: '$25',
    fee: null,
    color: 'gold',
    borderColor: 'border-accent-gold/15',
    hoverBorder: 'hover:border-accent-gold/40',
    textColor: 'text-accent-gold',
    accentBg: 'bg-accent-gold',
    shadow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  {
    key: 'day_guys_open_bar',
    emoji: '\u{1F378}',
    title: 'GUYS OPEN BAR',
    price: '$40',
    fee: null,
    color: 'gold',
    borderColor: 'border-accent-gold/15',
    hoverBorder: 'hover:border-accent-gold/40',
    textColor: 'text-accent-gold',
    accentBg: 'bg-accent-gold',
    shadow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  {
    key: 'day_ladies_ga',
    emoji: '\u{1F3AB}',
    title: 'LADIES GA',
    price: '$10',
    fee: null,
    color: 'blue',
    borderColor: 'border-accent-blue/15',
    hoverBorder: 'hover:border-accent-blue/40',
    textColor: 'text-accent-blue',
    accentBg: 'bg-accent-blue',
    shadow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
  {
    key: 'day_guys_ga',
    emoji: '\u{1F3AB}',
    title: 'GUYS GA',
    price: '$20',
    fee: null,
    color: 'blue',
    borderColor: 'border-accent-blue/15',
    hoverBorder: 'hover:border-accent-blue/40',
    textColor: 'text-accent-blue',
    accentBg: 'bg-accent-blue',
    shadow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
];

function isDanceNight(eventType) {
  return eventType === 'salsa_night' || eventType === 'bachata_night';
}

function getCurrentTier(availability) {
  if (!availability) return { tier: 4, price: '$10', total: '$15', remaining: 40, label: 'Tier 4' };
  const t1sold = availability.ga_tier1_sold || 0;
  const t1cap = availability.ga_tier1_capacity ?? 0;
  const t2sold = availability.ga_tier2_sold || 0;
  const t2cap = availability.ga_tier2_capacity ?? 0;
  const t3sold = availability.ga_tier3_sold || 0;
  const t3cap = availability.ga_tier3_capacity ?? 0;
  const t4sold = availability.ga_tier4_sold || 0;
  const t4cap = availability.ga_tier4_capacity ?? 0;

  const t1price = Math.round((availability.ga_tier1_price ?? 1000) / 100);
  const t2price = Math.round((availability.ga_tier2_price ?? 1500) / 100);
  const t3price = Math.round((availability.ga_tier3_price ?? 2000) / 100);
  const t4price = Math.round((availability.ga_tier4_price ?? 1000) / 100);

  if (t1sold < t1cap) {
    const isLast = t2cap === 0 && t3cap === 0 && t4cap === 0;
    return { tier: 1, price: '$' + t1price, total: '$' + t1price, remaining: t1cap - t1sold, soldOut: false, label: isLast ? 'Last Tier' : 'Tier 1', noFee: true };
  }
  if (t2sold < t2cap) {
    const isLast = t3cap === 0 && t4cap === 0;
    return { tier: 2, price: '$' + t2price, total: '$' + (t2price + 5), remaining: t2cap - t2sold, soldOut: false, label: isLast ? 'Last Tier' : 'Tier 2' };
  }
  if (t3cap > 0 && t3sold < t3cap) {
    const isLast = t4cap === 0;
    return { tier: 3, price: '$' + t3price, total: '$' + (t3price + 5), remaining: t3cap - t3sold, soldOut: false, label: isLast ? 'Last Tier' : 'Tier 3' };
  }
  if (t4cap > 0 && t4sold < t4cap) return { tier: 4, price: '$' + t4price, total: '$' + (t4price + 5), remaining: t4cap - t4sold, soldOut: false, label: 'Tier 4' };
  return { tier: 4, price: '$' + t4price, total: '$' + (t4price + 5), remaining: 0, soldOut: true, label: 'Sold Out' };
}

export default function TicketTypeCards({ eventType, onSelectGA, onSelectVipGA, onShowLadiesFree, onBuyTest, onSelectDirect, onShowTablePicker, ladiesFreeRemaining, availability, gaSoldOut }) {
  const dance = isDanceNight(eventType);
  const dayParty = eventType === 'day_party';
  const tier = getCurrentTier(availability);
  const allCards = dayParty ? dayPartyCards : dance ? danceCards : nightclubCards;
  // When GA sold out, hide GA/VIP GA/Ladies Free cards — only show table-related options
  const gaKeys = ['ga', 'vip_ga', 'ladies_free', 'free_ga', 'free_before_12'];
  const cards = gaSoldOut ? allCards.filter(c => !gaKeys.includes(c.key)) : allCards;

  const freeGaCapacity = availability?.free_ga_capacity ?? 150;
  const freeGaClaimed = availability?.free_ga_claimed ?? 0;
  const freeGaRemaining = freeGaCapacity - freeGaClaimed;

  function handleClick(key) {
    if (key === 'ga') onSelectGA();
    else if (key === 'free_ga') onShowLadiesFree('dance_ga_free');
    else if (key === 'free_before_12') onShowLadiesFree('free_before_12');
    else if (key === 'vip_ga') onShowTablePicker();
    else if (key === 'ladies_free') onShowLadiesFree();
    else if (key === 'ga_open_bar' || key === 'ladies_group') onSelectDirect(key);
    else if (key === 'day_free') onShowLadiesFree('day_free');
    else if (key === 'day_ladies_free') onShowLadiesFree('day_ladies_free');
    else if (key === 'day_ladies_open_bar' || key === 'day_guys_open_bar' || key === 'day_ladies_ga' || key === 'day_guys_ga') onSelectDirect(key);
  }

  return (
    <div className={`grid ${dayParty ? 'grid-cols-2 md:grid-cols-3' : dance ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-3`}>
      {cards.map(card => (
        <div
          key={card.key}
          onClick={() => handleClick(card.key)}
          className={`relative bg-bg-surface border ${card.borderColor} rounded-[16px] py-8 px-6 cursor-pointer
            transition-all duration-200 hover:-translate-y-1 ${card.hoverBorder} ${card.shadow}
            group overflow-hidden text-center`}
        >
          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] ${card.accentBg} opacity-0 group-hover:opacity-100 transition-opacity`} />

          <div className={`font-[family-name:var(--font-display)] text-xl md:text-2xl tracking-[3px] ${card.textColor} mb-3`}>
            {card.emoji} {card.title}
          </div>
          <div className={`text-4xl md:text-5xl font-bold text-text-primary mb-1`}>
            {card.key === 'ga' && !dance ? tier.price : card.price}
          </div>
          {card.key === 'ga' && !dance && !tier.noFee && (
            <div className="text-sm text-text-muted mt-1">+ $5 fee = {tier.total} total</div>
          )}
          {card.key === 'ga' && !dance && (
            <div className="mt-3">
              <div className="text-xs text-accent-blue/70">{tier.label} &bull; {Math.min(tier.remaining, 15)} left</div>
              {tier.label !== 'Last Tier' && !tier.soldOut && <div className="text-[10px] text-text-muted mt-1">Price increases after this tier sells out</div>}
              {tier.soldOut && <div className="text-xs text-accent-coral font-bold mt-1">SOLD OUT</div>}
            </div>
          )}
          {card.fee && card.key !== 'ga' && card.key !== 'vip_ga' && (
            <div className="text-sm text-text-muted mt-1">{card.fee} = {card.fee} total</div>
          )}
          {card.key === 'ga' && dance && (
            <div className="text-xs text-accent-blue/70 mt-3">{card.subtitle}</div>
          )}
          {(card.key === 'free_ga' || (card.key === 'ga' && dance)) && (
            <div className="text-[10px] text-accent-gold/70 mt-2">21+ are allowed to stay for the nightclub experience.</div>
          )}
          {card.key === 'vip_ga' && (
            <>
              <div className="text-xs text-accent-gold/70 mt-3">VIP Tables &bull; Bottle Service</div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-gold/10 text-accent-gold border border-accent-gold/25 rounded-full px-5 py-2.5 hover:bg-accent-gold/20 transition-colors font-semibold">
                VIEW TABLES ↓
              </button>
            </>
          )}
          {card.key === 'free_ga' && (
            <>
              <div className="text-sm text-accent-teal mt-3 font-semibold">
                {freeGaRemaining > 0 ? `${Math.min(freeGaRemaining, 15)} spots left` : 'ALL CLAIMED'}
              </div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
                CLAIM FREE ENTRY
              </button>
            </>
          )}
          {card.key === 'ladies_free' && ladiesFreeRemaining != null && (
            <div className="text-sm text-accent-teal mt-3 font-semibold">
              {ladiesFreeRemaining > 0 ? `${Math.min(ladiesFreeRemaining, 33)} spots left` : 'ALL CLAIMED'}
            </div>
          )}
          {card.key === 'ladies_free' && (
            <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
              CLAIM FREE ENTRY
            </button>
          )}
          {card.key === 'free_before_12' && (
            <>
              <div className="text-sm text-accent-teal mt-3 font-semibold">
                {freeGaRemaining > 0 ? `${Math.min(freeGaRemaining, 31)} spots left` : 'ALL CLAIMED'}
              </div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
                CLAIM FREE ENTRY
              </button>
            </>
          )}
          {card.key === 'day_free' && (
            <>
              <div className="text-sm text-accent-teal mt-3 font-semibold">
                {Math.min(availability?.day_free_remaining ?? 100, 38)} spots left
              </div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
                CLAIM FREE ENTRY
              </button>
            </>
          )}
          {card.key === 'day_ladies_free' && (
            <>
              <div className="text-sm text-accent-teal mt-3 font-semibold">
                {Math.min(availability?.day_ladies_free_remaining ?? 50, 27)} spots left
              </div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
                CLAIM FREE ENTRY
              </button>
            </>
          )}
          {(card.key === 'day_ladies_open_bar' || card.key === 'day_guys_open_bar') && (
            <div className="text-xs text-accent-gold/70 mt-3">Mojitos & Piña Coladas &bull; 10AM-11:30AM</div>
          )}
          {card.key === 'ga_open_bar' && (
            <div className="text-xs text-accent-gold/70 mt-3">{card.subtitle}</div>
          )}
          {card.key === 'test' && (
            <div className="text-xs text-text-muted/60 mt-3">For testing checkout</div>
          )}
        </div>
      ))}
    </div>
  );
}
