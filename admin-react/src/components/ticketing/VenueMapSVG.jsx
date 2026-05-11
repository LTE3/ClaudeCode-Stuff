export default function VenueMapSVG({ availability, onSelectTable, onSelectGA, gaSoldOut }) {
  const tables = availability?.tables || [];

  // Returns 'available', 'booked' (real), or 'fomo' (fake sold)
  function getTableStatus(type, num, tier) {
    const matching = tables.filter(t => {
      const matchType = t.table_type === type && t.table_number === num;
      if (tier) return matchType && t.tier === tier;
      return matchType;
    });
    if (matching.length === 0) return 'available';
    const anyBooked = matching.some(t => t.is_booked);
    if (!anyBooked) return 'available';
    const anyReal = matching.some(t => t.is_booked && t.has_real_booking);
    return anyReal ? 'booked' : 'fomo';
  }

  function tableFill(type, num, defaultFill, tier) {
    const s = getTableStatus(type, num, tier);
    if (s === 'booked' || s === 'fomo') return '#050506';
    return defaultFill;
  }

  function tableStroke(type, num, tier, accentColor) {
    const s = getTableStatus(type, num, tier);
    if (s === 'booked') return 'rgba(255,255,255,0.08)';
    if (s === 'fomo') return '#FBBF24';
    return accentColor || 'rgba(251,191,36,0.5)';
  }

  function tableStrokeWidth(type, num, tier) {
    return getTableStatus(type, num, tier) === 'fomo' ? 2 : 1.5;
  }

  function tableOpacity(type, num, tier) {
    return getTableStatus(type, num, tier) === 'booked' ? 0.3 : 1;
  }

  function tableCursor(type, num, tier) {
    return getTableStatus(type, num, tier) === 'booked' ? 'default' : 'pointer';
  }

  function handleTableClick(type, num, tier) {
    const s = getTableStatus(type, num, tier);
    if (s !== 'booked') onSelectTable(type, num, tier);
  }

  const totalSold = (availability?.ga_tier1_sold || 0) + (availability?.ga_tier2_sold || 0) + (availability?.ga_tier3_sold || 0) + (availability?.ga_tier4_sold || 0) + (availability?.ga_sold || 0);
  const totalCapacity = (availability?.ga_tier1_capacity ?? 0) + (availability?.ga_tier2_capacity ?? 0) + (availability?.ga_tier3_capacity ?? 0) + (availability?.ga_tier4_capacity ?? 0);
  const actualRemaining = Math.max(0, totalCapacity - totalSold);
  let gaLabel = actualRemaining + ' TICKETS LEFT';
  if (gaSoldOut) gaLabel = 'SOLD OUT — Join Waitlist';
  else if (actualRemaining <= 0) gaLabel = 'SOLD OUT';
  else if (actualRemaining <= 20) gaLabel = 'ALMOST SOLD OUT — ' + actualRemaining + ' LEFT';
  else if (actualRemaining <= 50) gaLabel = 'SELLING FAST — ' + actualRemaining + ' LEFT';

  return (
    <svg viewBox="0 0 600 1020" className="w-full md:max-w-[380px] md:mx-auto rounded-[20px] overflow-hidden">
      <defs>
        <linearGradient id="stageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D8D" />
          <stop offset="100%" stopColor="#c43068" />
        </linearGradient>
        <linearGradient id="vipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="gaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3b7dd8" />
        </linearGradient>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="600" height="1020" fill="#020203" rx="20" />
      <rect width="600" height="1020" fill="url(#grid)" rx="20" />

      {/* DJ Booth */}
      <rect x="130" y="20" width="340" height="60" rx="12" fill="#0a0a0c" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="300" y="58" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontFamily="'Bebas Neue',sans-serif" fontSize="26" letterSpacing="6">DJ BOOTH</text>
      <line x1="180" y1="80" x2="420" y2="80" stroke="#FF4D8D" strokeWidth="2" opacity="0.25" />

      {/* Stage */}
      <rect x="80" y="95" width="440" height="85" rx="14" fill="url(#stageGrad)" filter="url(#neonGlow)" />
      <rect x="80" y="95" width="440" height="85" rx="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="300" y="148" textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="42" letterSpacing="6">LA CASITA</text>

      {/* VIP divider */}
      <line x1="50" y1="195" x2="550" y2="195" stroke="rgba(251,191,36,0.15)" strokeWidth="1" />
      <text x="300" y="225" textAnchor="middle" fill="rgba(251,191,36,0.6)" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="6">VIP SECTION</text>

      {/* VIP Couches */}
      {[
        { n: 1, x: 20, y: 245 },
        { n: 2, x: 165, y: 245 },
        { n: 3, x: 310, y: 245 },
        { n: 4, x: 455, y: 245 },
      ].map(c => (
        <g key={`couch-${c.n}`}
          opacity={tableOpacity('couch', c.n, 'vip')}
          style={{ cursor: tableCursor('couch', c.n, 'vip') }}
          onClick={() => handleTableClick('couch', c.n, 'vip')}
        >
          <rect x={c.x} y={c.y} width="130" height="95" rx="12"
            fill={tableFill('couch', c.n, 'url(#vipGrad)', 'vip')} filter={getTableStatus('couch', c.n, 'vip') === 'available' ? "url(#softGlow)" : undefined} />
          <rect x={c.x} y={c.y} width="130" height="95" rx="12"
            fill="none" stroke={tableStroke('couch', c.n, 'vip', 'rgba(251,191,36,0.5)')} strokeWidth={tableStrokeWidth('couch', c.n, 'vip')} pointerEvents="none" />
          <text x={c.x + 65} y={c.y + 40} textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="24" letterSpacing="3" pointerEvents="none">COUCH {c.n}</text>
          <text x={c.x + 65} y={c.y + 70} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontFamily="'Source Sans 3',sans-serif" fontSize="15" pointerEvents="none">5-10 guests</text>
        </g>
      ))}

      {/* VIP High Tops */}
      {[
        { n: 1, x: 20, y: 355 },
        { n: 2, x: 165, y: 355 },
        { n: 3, x: 310, y: 355 },
        { n: 4, x: 455, y: 355 },
      ].map(h => (
        <g key={`ht-${h.n}`}
          opacity={tableOpacity('high_top', h.n, 'vip')}
          style={{ cursor: tableCursor('high_top', h.n, 'vip') }}
          onClick={() => handleTableClick('high_top', h.n, 'vip')}
        >
          <rect x={h.x} y={h.y} width="130" height="80" rx="12"
            fill={tableFill('high_top', h.n, 'url(#vipGrad)', 'vip')} opacity={getTableStatus('high_top', h.n, 'vip') === 'available' ? 0.75 : 1} />
          <rect x={h.x} y={h.y} width="130" height="80" rx="12"
            fill="none" stroke={tableStroke('high_top', h.n, 'vip', 'rgba(251,191,36,0.5)')} strokeWidth={tableStrokeWidth('high_top', h.n, 'vip')} pointerEvents="none" />
          <text x={h.x + 65} y={h.y + 38} textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="2" pointerEvents="none">HIGH TOP {h.n}</text>
          <text x={h.x + 65} y={h.y + 60} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="'Source Sans 3',sans-serif" fontSize="14" pointerEvents="none">1-4 guests</text>
        </g>
      ))}

      {/* Bottle Service divider */}
      <line x1="50" y1="455" x2="550" y2="455" stroke="rgba(45,212,191,0.15)" strokeWidth="1" />
      <text x="300" y="485" textAnchor="middle" fill="rgba(45,212,191,0.6)" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="6">BOTTLE SERVICE</text>

      {/* Bottle Service Couches */}
      {[
        { n: 5, x: 70, y: 505 },
        { n: 6, x: 235, y: 505 },
        { n: 7, x: 400, y: 505 },
      ].map(c => (
        <g key={`bs-couch-${c.n}`}
          opacity={tableOpacity('couch', c.n, 'regular')}
          style={{ cursor: tableCursor('couch', c.n, 'regular') }}
          onClick={() => handleTableClick('couch', c.n, 'regular')}
        >
          <rect x={c.x} y={c.y} width="130" height="95" rx="12"
            fill={tableFill('couch', c.n, 'url(#bottleGrad)', 'regular')} filter={getTableStatus('couch', c.n, 'regular') === 'available' ? "url(#softGlow)" : undefined} />
          <rect x={c.x} y={c.y} width="130" height="95" rx="12"
            fill="none" stroke={tableStroke('couch', c.n, 'regular', 'rgba(45,212,191,0.5)')} strokeWidth={tableStrokeWidth('couch', c.n, 'regular')} pointerEvents="none" />
          <text x={c.x + 65} y={c.y + 40} textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="24" letterSpacing="3" pointerEvents="none">COUCH {c.n}</text>
          <text x={c.x + 65} y={c.y + 70} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontFamily="'Source Sans 3',sans-serif" fontSize="15" pointerEvents="none">5-10 guests</text>
        </g>
      ))}

      {/* Bottle Service High Tops */}
      {[
        { n: 5, x: 70, y: 615 },
        { n: 6, x: 235, y: 615 },
        { n: 7, x: 400, y: 615 },
      ].map(h => (
        <g key={`bs-ht-${h.n}`}
          opacity={tableOpacity('high_top', h.n, 'regular')}
          style={{ cursor: tableCursor('high_top', h.n, 'regular') }}
          onClick={() => handleTableClick('high_top', h.n, 'regular')}
        >
          <rect x={h.x} y={h.y} width="130" height="80" rx="12"
            fill={tableFill('high_top', h.n, 'url(#bottleGrad)', 'regular')} opacity={getTableStatus('high_top', h.n, 'regular') === 'available' ? 0.75 : 1} />
          <rect x={h.x} y={h.y} width="130" height="80" rx="12"
            fill="none" stroke={tableStroke('high_top', h.n, 'regular', 'rgba(45,212,191,0.5)')} strokeWidth={tableStrokeWidth('high_top', h.n, 'regular')} pointerEvents="none" />
          <text x={h.x + 65} y={h.y + 38} textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="2" pointerEvents="none">HIGH TOP {h.n}</text>
          <text x={h.x + 65} y={h.y + 60} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="'Source Sans 3',sans-serif" fontSize="14" pointerEvents="none">1-4 guests</text>
        </g>
      ))}

      {/* GA divider */}
      <line x1="50" y1="715" x2="550" y2="715" stroke="rgba(96,165,250,0.15)" strokeWidth="1" />

      {/* Bar */}
      <rect x="10" y="735" width="55" height="200" rx="10" fill="#0a0a0c" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="37" y="845" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="3" transform="rotate(-90,37,845)">BAR</text>

      {/* GA Floor */}
      <rect x="80" y="735" width="505" height="200" rx="14"
        fill={gaSoldOut ? "rgba(255,77,141,0.08)" : "url(#gaGrad)"} style={{ cursor: 'pointer' }} onClick={onSelectGA} opacity={gaSoldOut ? 0.6 : 1} />
      <rect x="80" y="735" width="505" height="200" rx="14"
        fill="none" stroke={gaSoldOut ? "rgba(255,77,141,0.3)" : "rgba(96,165,250,0.3)"} strokeWidth="1.5" pointerEvents="none" />
      <text x="332" y="810" textAnchor="middle" fill={gaSoldOut ? "rgba(255,77,141,0.8)" : "#fff"} fontFamily="'Bebas Neue',sans-serif" fontSize="42" letterSpacing="6" pointerEvents="none">GENERAL</text>
      <text x="332" y="850" textAnchor="middle" fill={gaSoldOut ? "rgba(255,77,141,0.8)" : "#fff"} fontFamily="'Bebas Neue',sans-serif" fontSize="42" letterSpacing="6" pointerEvents="none">ADMISSION</text>
      <text x="332" y="885" textAnchor="middle" fill={gaSoldOut ? "#FF4D8D" : "rgba(255,255,255,0.7)"} fontFamily="'Source Sans 3',sans-serif" fontSize="18" fontWeight="700" pointerEvents="none">{gaLabel}</text>
      {gaSoldOut && <text x="332" y="910" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily="'Source Sans 3',sans-serif" fontSize="14" pointerEvents="none">Tap to join the waitlist</text>}

      {/* Entrance */}
      <rect x="200" y="960" width="200" height="45" rx="10" fill="#0a0a0c" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="300" y="990" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontFamily="'Bebas Neue',sans-serif" fontSize="20" letterSpacing="4">ENTRANCE</text>
      <polygon points="290,948 300,938 310,948" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}
