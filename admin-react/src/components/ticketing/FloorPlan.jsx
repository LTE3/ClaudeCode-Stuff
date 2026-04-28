import VenueMapSVG from './VenueMapSVG';
import DanceVenueMapSVG from './DanceVenueMapSVG';
import TicketTypeCards from './TicketTypeCards';

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

export default function FloorPlan({ date, availability, eventType, onSelectGA, onSelectVipGA, onSelectTable, onBack, onShowLadiesFree, onBuyTest, onSelectDirect, gaSoldOut }) {
  const urgency = getUrgencyBadge(availability);
  const ladiesFreeRemaining = availability?.ladies_free_remaining ?? null;
  const danceNight = isDanceNight(eventType);

  function handleSelectTable(type, num, tier) {
    onSelectTable(type, num, tier);
  }

  return (
    <div>
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

      {/* Venue Map */}
      <div className="bg-bg-surface rounded-[20px] border border-border-default p-2 mb-4">
        <div>
          {danceNight ? (
            <DanceVenueMapSVG
              availability={availability}
              onSelectTable={handleSelectTable}
              onSelectGA={onSelectGA}
              onSelectFreeGA={() => onShowLadiesFree('dance_ga_free')}
            />
          ) : (
            <VenueMapSVG
              availability={availability}
              onSelectTable={handleSelectTable}
              onSelectGA={onSelectGA}
              gaSoldOut={gaSoldOut}
            />
          )}
        </div>
      </div>

      {/* Ticket Type Cards */}
      <TicketTypeCards
        eventType={eventType}
        onSelectGA={onSelectGA}
        onSelectVipGA={onSelectVipGA}
        onShowLadiesFree={onShowLadiesFree}
        onBuyTest={onBuyTest}
        onSelectDirect={onSelectDirect}
        ladiesFreeRemaining={ladiesFreeRemaining}
        availability={availability}
        gaSoldOut={gaSoldOut}
      />
    </div>
  );
}
