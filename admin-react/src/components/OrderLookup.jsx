import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

const ticketLabels = {
  ga_tier1: 'GA Tier 1', ga_tier2: 'GA Tier 2', ga_tier3: 'GA Tier 3',
  vip_ga: 'VIP GA', vip_couch_before: 'VIP Couch', vip_couch_after: 'VIP Couch',
  vip_high_top_before: 'VIP High Top', vip_high_top_after: 'VIP High Top',
  regular_couch_before: 'Bottle Couch', regular_couch_after: 'Bottle Couch',
  regular_high_top: 'Bottle High Top', dance_ga: 'Dance GA',
  ladies_free: 'Ladies Free Entry', dance_ga_free: 'Free Dance GA',
  ladies_group: 'Ladies Group x4', ga_open_bar: 'GA + Open Bar',
  season_pass_regular: 'Season Pass', season_pass_vip: 'VIP Season Pass',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrderLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await supabaseEdge('lookup-order', { query: query.trim() });
      if (data.error) setError(data.error);
      else setResults(data.results || []);
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  }

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden">
      <div className="p-5 border-b border-border-default">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-lg tracking-[3px]">
          LOOK UP YOUR ORDER
        </h2>
        <p className="text-text-muted text-xs mt-1">Find your tickets, QR codes, and merch orders</p>
      </div>
      <div className="p-5">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text" placeholder="Email, phone, or name" value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 p-3 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand"
          />
          <button type="submit" disabled={loading}
            className="px-5 py-3 rounded-[8px] bg-brand text-white font-[family-name:var(--font-display)] tracking-[2px] text-sm cursor-pointer border-none disabled:opacity-50">
            {loading ? '...' : 'SEARCH'}
          </button>
        </form>

        {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

        {results && results.length === 0 && (
          <p className="text-text-muted text-sm text-center py-6">No orders found. Try a different email or phone number.</p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => {
              const isFree = r.type === 'free';
              const isMerch = r.type === 'merch';
              const qrId = isFree ? `free_${r.booking_id}` : r.session_id;
              const qrUrl = !isMerch ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://lacasitabk.com/admin/?verify=${qrId}`)}&bgcolor=0a0a0a&color=ffffff` : null;

              return (
                <div key={i} className="bg-bg-surface border border-border-default rounded-[12px] p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isFree ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20' :
                          isMerch ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
                          'bg-brand/10 text-brand border border-brand/20'
                        }`}>
                          {isFree ? 'FREE' : isMerch ? 'MERCH' : '$' + r.amount}
                        </span>
                        <span className="text-text-muted text-xs">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-text-primary text-sm font-medium">
                        {ticketLabels[r.ticket_type] || r.ticket_type || 'Merch Order'}
                      </div>
                      {r.event_date && (
                        <div className="text-text-muted text-xs mt-0.5">{formatDate(r.event_date)}</div>
                      )}
                      {r.shipping && (
                        <div className="text-text-muted text-xs mt-1">📦 {r.shipping}</div>
                      )}
                    </div>
                    {qrUrl && (
                      <div className="ml-3 bg-black rounded-[8px] p-1.5 border border-border-default">
                        <img src={qrUrl} alt="QR" className="w-[80px] h-[80px]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
