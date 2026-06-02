import { useState } from 'react';
import VenueMapSVG from './VenueMapSVG';
import DanceVenueMapSVG from './DanceVenueMapSVG';
import TicketTypeCards from './TicketTypeCards';

const TABLE_PACKAGES = [
  {
    key: 'vip_couch',
    title: 'VIP COUCH',
    type: 'couch',
    tier: 'vip',
    price: '$700++',
    deposit: '$100',
    guests: '5-10 guests',
    includes: ['2 Premium Bottles', '1 House Champagne', '1 Hookah', '$50 Merch Credit', 'Full Admission'],
    color: 'accent-gold',
    emoji: '\u{1F451}',
  },
  {
    key: 'vip_high_top',
    title: 'VIP HIGH TOP',
    type: 'high_top',
    tier: 'vip',
    price: '$450++',
    deposit: '$50',
    guests: '1-4 guests',
    includes: ['1 Premium Bottle', '1 House Champagne', '1 Hookah', '$50 Merch Credit', 'Full Admission'],
    color: 'accent-gold',
    emoji: '⭐',
  },
  {
    key: 'regular_couch',
    title: 'DTMF COUCH',
    type: 'couch',
    tier: 'regular',
    price: '$600++',
    deposit: '$100',
    guests: '5-10 guests',
    includes: ['2 Bottles', '1 House Champagne', 'Full Admission'],
    color: 'accent-teal',
    emoji: '\u{1F37E}',
  },
  {
    key: 'regular_high_top',
    title: 'VERANO HIGH TOP',
    type: 'high_top',
    tier: 'regular',
    price: '$300++',
    deposit: '$50',
    guests: '1-4 guests',
    includes: ['1 Casamigos Bottle', '1 Hookah', 'Full Admission'],
    color: 'accent-teal',
    emoji: '\u{1F378}',
  },
];

const NIGHT_FLYERS = {
  '2026-05-29': 'friday-night-flyer.png',
  '2026-05-30': 'saturday-night-flyer.png',
  '2026-06-05': 'flyer-2026-06-05.jpg',  // La Casita Del Teteo
  '2026-06-06': 'flyer-2026-06-06.jpg',  // Una Noche en La Placita
  '2026-06-14': 'flyer-2026-06-14.jpg',  // PR Parade After Party — La Casita de Benito
};

function getUrgencyBadge(availability) {
  if (!availability) return null;
  const totalSold = (availability.ga_tier1_sold || 0) + (availability.ga_tier2_sold || 0) + (availability.ga_tier3_sold || 0) + (availability.ga_tier4_sold || 0) + (availability.ga_sold || 0);
  const totalCapacity = (availability.ga_tier1_capacity || 0) + (availability.ga_tier2_capacity || 0) + (availability.ga_tier3_capacity || 0) + (availability.ga_tier4_capacity || 0);
  if (totalCapacity === 0) return null;
  const pct = (totalSold / totalCapacity) * 100;
  if (pct > 90) return { text: 'ALMOST SOLD OUT', color: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20' };
  if (pct > 70) return { text: 'SELLING FAST', color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' };
  if (pct > 50) return { text: 'LIMITED AVAILABILITY', color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' };
  return null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function isDanceNight(eventType) {
  return eventType === 'salsa_night' || eventType === 'bachata_night';
}

function TablePickerPopup({ onSelectPackage, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-3 px-3 pb-3" onClick={onClose}>
      <div className="bg-bg-elevated border border-border-default rounded-[20px] max-w-lg w-full p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-[family-name:var(--font-display)] text-accent-gold text-lg tracking-[3px]">
            RESERVE A TABLE
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none text-xl p-1">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {TABLE_PACKAGES.map(pkg => (
            <div
              key={pkg.key}
              onClick={() => onSelectPackage(pkg)}
              className={`bg-bg-surface border border-${pkg.color}/15 rounded-[12px] px-4 py-3 cursor-pointer
                transition-all duration-200 hover:border-${pkg.color}/40
                group relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-[family-name:var(--font-display)] text-${pkg.color} text-base tracking-[2px]`}>
                    {pkg.emoji} {pkg.title}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5">{pkg.guests} &bull; {pkg.deposit} deposit</div>
                </div>
                <div className={`text-${pkg.color} text-lg font-bold`}>{pkg.price}</div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {pkg.includes.map(item => (
                  <span key={item} className={`text-[11px] bg-${pkg.color}/10 text-${pkg.color} rounded-full px-2 py-0.5`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FloorPlan({ date, availability, eventType, onSelectGA, onSelectVipGA, onSelectTable, onBack, onShowLadiesFree, onBuyTest, onSelectDirect, gaSoldOut }) {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const urgency = getUrgencyBadge(availability);
  const ladiesFreeRemaining = availability?.ladies_free_remaining ?? null;
  const danceNight = isDanceNight(eventType);

  function handleSelectTable(type, num, tier) {
    onSelectTable(type, num, tier);
  }

  function handlePackageSelect(pkg) {
    setShowTablePicker(false);
    const tables = availability?.tables || [];
    const tableType = pkg.type === 'high_top' ? 'high_top' : 'couch';
    const tierPrefix = pkg.tier === 'vip' ? 'vip_' : 'regular_';
    const available = tables.filter(t =>
      t.table_type === tableType &&
      (pkg.tier === 'vip' ? t.table_number <= 4 : t.table_number >= 5) &&
      !t.is_booked
    );
    const tableNum = available.length > 0 ? available[0].table_number : (pkg.tier === 'vip' ? 1 : 5);
    onSelectTable(tableType, tableNum, pkg.tier);
  }

  return (
    <div>
      {showTablePicker && (
        <TablePickerPopup
          onSelectPackage={handlePackageSelect}
          onClose={() => setShowTablePicker(false)}
        />
      )}

      {/* Date badge + back */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-brand/10 text-brand border border-brand/20 rounded-full px-4 py-1.5 text-sm font-medium">
            {formatDate(date)}
          </span>
          {urgency && (
            <span className={`border rounded-full px-3 py-1 text-[10px] tracking-[1px] font-medium ${urgency.color}`}>
              {urgency.text}
            </span>
          )}
        </div>
        <button
          onClick={onBack}
          className="bg-bg-surface border border-border-default hover:border-brand/40 text-text-secondary hover:text-text-primary rounded-full px-4 py-2 text-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      {/* Event flyer / promo */}
      {eventType === 'day_party' ? (
        <div className="rounded-[16px] overflow-hidden mb-4">
          <img src={import.meta.env.BASE_URL + 'day-party-flyer.jpg'} alt="Un Verano Sin Ti Day Party" className="w-full h-auto rounded-[16px]" />
        </div>
      ) : NIGHT_FLYERS[date] ? (
        <div className="rounded-[16px] overflow-hidden mb-4">
          <img src={import.meta.env.BASE_URL + NIGHT_FLYERS[date]} alt="La Casita Memorial Day Weekend" className="w-full h-auto rounded-[16px]" />
        </div>
      ) : null}

      {/* Ticket Type Cards — shown first so free options are immediately visible */}
      <TicketTypeCards
        date={date}
        eventType={eventType}
        onSelectGA={onSelectGA}
        onSelectVipGA={onSelectVipGA}
        onShowLadiesFree={onShowLadiesFree}
        onBuyTest={onBuyTest}
        onSelectDirect={onSelectDirect}
        onShowTablePicker={() => setShowTablePicker(true)}
        ladiesFreeRemaining={ladiesFreeRemaining}
        availability={availability}
        gaSoldOut={gaSoldOut}
      />

      {/* Venue Map — compact below the cards (hidden for day party) */}
      {eventType !== 'day_party' && (
        <div data-venue-map className="bg-bg-surface rounded-[20px] border border-border-default p-2 mt-4">
          <div>
            {danceNight ? (
              <DanceVenueMapSVG
                date={date}
                availability={availability}
                onSelectTable={handleSelectTable}
                onSelectGA={onSelectGA}
                onSelectFreeGA={() => onShowLadiesFree('dance_ga_free')}
              />
            ) : (
              <VenueMapSVG
                date={date}
                availability={availability}
                onSelectTable={handleSelectTable}
                onSelectGA={onSelectGA}
                gaSoldOut={gaSoldOut}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
