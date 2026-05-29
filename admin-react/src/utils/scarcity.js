// Display-only scarcity caps.
//
// Real inventory is far deeper than these numbers (see the events table /
// create-checkout backend). We intentionally show a small "X left" to create
// urgency. Showing the SAME number on every date reads as fake, so each cap
// varies per event date and per ticket type while staying in a low 20s–30s band.
//
// `showLeft` returns min(realRemaining, cap) — so once real inventory ever
// drops below the cap, the true number takes over and we never overstate it.

const CAPS = {
  ga:           { '2026-05-29': 24, '2026-05-30': 31 },
  free_ga:      { '2026-05-29': 29, '2026-05-30': 22 },
  ladies_free:  { '2026-05-29': 33, '2026-05-30': 26 },
  free_before:  { '2026-05-29': 31, '2026-05-30': 23 },
  day_free:     { '2026-05-29': 32, '2026-05-30': 28 },
  day_ladies:   { '2026-05-29': 27, '2026-05-30': 34 },
  dance_free:   { '2026-05-29': 34, '2026-05-30': 25 },
};

const FALLBACK_BASE = {
  ga: 26, free_ga: 27, ladies_free: 30, free_before: 28,
  day_free: 29, day_ladies: 31, dance_free: 28,
};

// Deterministic per-date jitter so any date not listed above still differs
// (base..base+6, stays inside the 20s–30s band) instead of sharing one constant.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function scarcityCap(key, date) {
  const explicit = CAPS[key]?.[date];
  if (explicit != null) return explicit;
  const base = FALLBACK_BASE[key] ?? 28;
  return base + (hashStr(key + (date || '')) % 7);
}

export function showLeft(key, date, realRemaining) {
  const r = Math.max(0, realRemaining ?? 0);
  return Math.min(r, scarcityCap(key, date));
}
