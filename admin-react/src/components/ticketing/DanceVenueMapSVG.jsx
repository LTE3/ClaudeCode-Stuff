export default function DanceVenueMapSVG({ availability, onSelectTable, onSelectGA, onSelectFreeGA }) {
  const tables = availability?.tables || [];

  function getTableStatus(type, num) {
    const matching = tables.filter(t => t.table_type === type && t.table_number === num);
    if (matching.length === 0) return 'available';
    const anyBooked = matching.some(t => t.is_booked);
    if (anyBooked) return 'booked';
    return 'available';
  }

  function tableFill(type, num, defaultFill) {
    return getTableStatus(type, num) === 'booked' ? '#101014' : defaultFill;
  }

  function tableStroke(type, num) {
    const s = getTableStatus(type, num);
    if (s === 'booked') return 'rgba(255,255,255,0.1)';
    return 'rgba(45,212,191,0.5)';
  }

  function tableOpacity(type, num) {
    return getTableStatus(type, num) === 'booked' ? 0.3 : 1;
  }

  function tableCursor(type, num) {
    return getTableStatus(type, num) === 'booked' ? 'default' : 'pointer';
  }

  function handleTableClick(type, num) {
    if (getTableStatus(type, num) !== 'booked') onSelectTable(type, num, 'regular');
  }

  const freeRemainingRaw = (availability?.free_ga_capacity - availability?.free_ga_claimed) ?? 150;
  const freeRemaining = Math.min(freeRemainingRaw, 34);
  let gaLabel = freeRemaining + ' FREE tickets available';
  if (freeRemainingRaw <= 0) gaLabel = 'FREE TICKETS GONE — $15 GA available';
  else if (freeRemaining <= 20) gaLabel = 'ALMOST GONE — ' + freeRemaining + ' free left';
  else if (freeRemaining <= 50) gaLabel = freeRemaining + ' free tickets left';

  return (
    <svg viewBox="0 0 600 700" className="w-full md:max-w-[550px] md:mx-auto rounded-[20px] overflow-hidden">
      <defs>
        <linearGradient id="dStageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D8D" />
          <stop offset="100%" stopColor="#c43068" />
        </linearGradient>
        <linearGradient id="dTableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="dFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f0f1a" />
        </linearGradient>
        <filter id="dNeonGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="dSoftGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="dGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="600" height="700" fill="#020203" rx="20" />
      <rect width="600" height="700" fill="url(#dGrid)" rx="20" />

      {/* Stage */}
      <rect x="80" y="20" width="440" height="75" rx="14" fill="url(#dStageGrad)" filter="url(#dNeonGlow)" />
      <rect x="80" y="20" width="440" height="75" rx="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="300" y="67" textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="38" letterSpacing="6">LA CASITA</text>

      {/* High tops row */}
      <line x1="50" y1="110" x2="550" y2="110" stroke="rgba(45,212,191,0.15)" strokeWidth="1" />
      {[
        { n: 1, x: 15 },
        { n: 2, x: 112 },
        { n: 3, x: 209 },
        { n: 4, x: 306 },
        { n: 5, x: 403 },
        { n: 6, x: 500 },
      ].map(h => (
        <g key={`dance-ht-${h.n}`}
          opacity={tableOpacity('high_top', h.n)}
          style={{ cursor: tableCursor('high_top', h.n) }}
          onClick={() => handleTableClick('high_top', h.n)}
        >
          <rect x={h.x} y={120} width="85" height="70" rx="10"
            fill={tableFill('high_top', h.n, 'url(#dTableGrad)')} filter="url(#dSoftGlow)" />
          <rect x={h.x} y={120} width="85" height="70" rx="10"
            fill="none" stroke={tableStroke('high_top', h.n)} strokeWidth="1" pointerEvents="none" />
          <text x={h.x + 42.5} y={150} textAnchor="middle" fill="#fff" fontFamily="'Bebas Neue',sans-serif" fontSize="18" letterSpacing="1" pointerEvents="none">HT {h.n}</text>
          <text x={h.x + 42.5} y={172} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="'Source Sans 3',sans-serif" fontSize="12" pointerEvents="none">1-4 guests</text>
        </g>
      ))}

      {/* Dance Floor */}
      <rect x="40" y="210" width="520" height="340" rx="18" fill="url(#dFloorGrad)" stroke="rgba(45,212,191,0.25)" strokeWidth="2" strokeDasharray="8 4"
        style={{ cursor: 'pointer' }} onClick={onSelectFreeGA || onSelectGA} />
      <rect x="40" y="210" width="520" height="340" rx="18" fill="none" stroke="rgba(45,212,191,0.08)" strokeWidth="1" pointerEvents="none" />

      {/* Dance floor decorative circles */}
      <circle cx="300" cy="380" r="100" fill="none" stroke="rgba(45,212,191,0.06)" strokeWidth="1" pointerEvents="none" />
      <circle cx="300" cy="380" r="60" fill="none" stroke="rgba(45,212,191,0.08)" strokeWidth="1" pointerEvents="none" />

      <text x="300" y="355" textAnchor="middle" fill="rgba(45,212,191,0.7)" fontFamily="'Bebas Neue',sans-serif" fontSize="48" letterSpacing="8" pointerEvents="none">DANCE</text>
      <text x="300" y="405" textAnchor="middle" fill="rgba(45,212,191,0.7)" fontFamily="'Bebas Neue',sans-serif" fontSize="48" letterSpacing="8" pointerEvents="none">FLOOR</text>
      <text x="300" y="440" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily="'Source Sans 3',sans-serif" fontSize="18" fontWeight="600" pointerEvents="none">{gaLabel}</text>

      {/* Bar on the side */}
      <rect x="10" y="570" width="580" height="50" rx="10" fill="#0a0a0c" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="300" y="601" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontFamily="'Bebas Neue',sans-serif" fontSize="22" letterSpacing="3">BAR</text>

      {/* Entrance */}
      <rect x="200" y="640" width="200" height="45" rx="10" fill="#0a0a0c" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="300" y="670" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontFamily="'Bebas Neue',sans-serif" fontSize="20" letterSpacing="4">ENTRANCE</text>
      <polygon points="290,628 300,618 310,628" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}
