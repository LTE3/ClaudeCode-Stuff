const nightclubCards = [
  {
    key: 'ga',
    emoji: '\u{1F3AB}',
    title: 'GENERAL ADMISSION',
    price: '$15',
    fee: '+ $5 fee',
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
    title: 'VIP GA',
    price: '$35',
    fee: '+ $5 fee',
    color: 'gold',
    borderColor: 'border-accent-gold/15',
    hoverBorder: 'hover:border-accent-gold/40',
    textColor: 'text-accent-gold',
    accentBg: 'bg-accent-gold',
    shadow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
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
    key: 'test',
    emoji: '\u{1F9EA}',
    title: 'TEST TICKET',
    price: '$1',
    fee: null,
    color: 'muted',
    borderColor: 'border-border-default',
    hoverBorder: 'hover:border-border-hover',
    textColor: 'text-text-muted',
    accentBg: 'bg-text-muted',
    shadow: '',
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
    title: 'GA $15',
    price: '$15',
    fee: '+ $5 fee',
    subtitle: 'After free tickets gone',
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
  if (!availability) return { tier: 1, price: '$10', total: '$15', remaining: 100 };
  const t1sold = availability.ga_tier1_sold || 0;
  const t1cap = availability.ga_tier1_capacity || 100;
  const t2sold = availability.ga_tier2_sold || 0;
  const t2cap = availability.ga_tier2_capacity || 100;
  const t3sold = availability.ga_tier3_sold || 0;
  const t3cap = availability.ga_tier3_capacity || 100;

  if (t1sold < t1cap) return { tier: 1, price: '$10', total: '$15', remaining: t1cap - t1sold, soldOut: false };
  if (t2sold < t2cap) return { tier: 2, price: '$15', total: '$20', remaining: t2cap - t2sold, soldOut: false };
  if (t3sold < t3cap) return { tier: 3, price: '$20', total: '$25', remaining: t3cap - t3sold, soldOut: false };
  return { tier: 3, price: '$20', total: '$25', remaining: 0, soldOut: true };
}

export default function TicketTypeCards({ eventType, onSelectGA, onSelectVipGA, onShowLadiesFree, onBuyTest, ladiesFreeRemaining, availability }) {
  const dance = isDanceNight(eventType);
  const tier = getCurrentTier(availability);
  const cards = dance ? danceCards : nightclubCards;

  const freeGaCapacity = availability?.free_ga_capacity ?? 150;
  const freeGaClaimed = availability?.free_ga_claimed ?? 0;
  const freeGaRemaining = freeGaCapacity - freeGaClaimed;

  function handleClick(key) {
    if (key === 'ga' || key === 'free_ga') onSelectGA();
    else if (key === 'vip_ga') onSelectVipGA();
    else if (key === 'ladies_free') onShowLadiesFree();
    else if (key === 'test') onBuyTest();
  }

  return (
    <div className={`grid ${dance ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 mt-6`}>
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
          {card.key === 'ga' && !dance && (
            <div className="text-sm text-text-muted mt-1">+ $5 fee = {tier.total} total</div>
          )}
          {card.key === 'ga' && !dance && (
            <div className="mt-3">
              <div className="text-xs text-accent-blue/70">Tier {tier.tier} &bull; {tier.remaining} left</div>
              {tier.tier < 3 && <div className="text-[10px] text-text-muted mt-1">Price increases after this tier sells out</div>}
              {tier.soldOut && <div className="text-xs text-accent-coral font-bold mt-1">SOLD OUT</div>}
            </div>
          )}
          {card.fee && card.key !== 'ga' && (
            <div className="text-sm text-text-muted mt-1">{card.fee} = {card.key === 'vip_ga' ? '$40' : card.fee} total</div>
          )}
          {card.key === 'ga' && dance && (
            <div className="text-xs text-accent-blue/70 mt-3">{card.subtitle}</div>
          )}
          {card.key === 'vip_ga' && (
            <div className="text-xs text-accent-gold/70 mt-3">VIP area &bull; Priority entry</div>
          )}
          {card.key === 'free_ga' && (
            <>
              <div className="text-sm text-accent-teal mt-3 font-semibold">
                {freeGaRemaining > 0 ? `${freeGaRemaining} of ${freeGaCapacity} spots left` : 'ALL CLAIMED'}
              </div>
              <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
                CLAIM FREE ENTRY
              </button>
            </>
          )}
          {card.key === 'ladies_free' && ladiesFreeRemaining != null && (
            <div className="text-sm text-accent-teal mt-3 font-semibold">
              {ladiesFreeRemaining} of 25 spots left
            </div>
          )}
          {card.key === 'ladies_free' && (
            <button className="mt-4 text-xs tracking-[1.5px] bg-accent-teal/10 text-accent-teal border border-accent-teal/25 rounded-full px-5 py-2.5 hover:bg-accent-teal/20 transition-colors font-semibold">
              CLAIM FREE ENTRY
            </button>
          )}
          {card.key === 'test' && (
            <div className="text-xs text-text-muted/60 mt-3">For testing checkout</div>
          )}
        </div>
      ))}
    </div>
  );
}
