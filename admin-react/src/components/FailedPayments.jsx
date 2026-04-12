import { useState, useEffect } from 'react';
import { supabaseGet } from '../config/supabase';

const ticketLabels = {
  ga_tier1: 'GA Tier 1', ga_tier2: 'GA Tier 2', ga_tier3: 'GA Tier 3',
  vip_ga: 'VIP GA', vip_couch_before: 'VIP Couch', vip_couch_after: 'VIP Couch',
  vip_high_top_before: 'VIP High Top', vip_high_top_after: 'VIP High Top',
  regular_couch_before: 'Bottle Couch', regular_couch_after: 'Bottle Couch',
  regular_high_top: 'Bottle High Top', dance_ga: 'Dance GA',
  ladies_group: 'Ladies Group x4', ga_open_bar: 'GA + Open Bar',
  season_pass_regular: 'Season Pass', season_pass_vip: 'VIP Season Pass',
};

export default function FailedPayments() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await supabaseGet('checkout_attempts', 'order=created_at.desc&limit=50');
        setAttempts(data || []);
      } catch {}
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return null;
  if (attempts.length === 0) return null;

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-lg tracking-[3px]">
          CHECKOUT ATTEMPTS
        </h2>
        <span className="bg-accent-coral/10 text-accent-coral border border-accent-coral/20 rounded-full px-3 py-1 text-[10px] tracking-[2px] font-medium">
          {attempts.length} TOTAL
        </span>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs tracking-[1px] border-b border-border-default">
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">Email</th>
                <th className="text-left py-2 pr-3">Phone</th>
                <th className="text-left py-2 pr-3">Ticket</th>
                <th className="text-right py-2 pr-3">Amount</th>
                <th className="text-right py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={i} className="border-b border-border-default/50 hover:bg-bg-surface/50">
                  <td className="py-2.5 pr-3 text-text-primary">{a.customer_name || '—'}</td>
                  <td className="py-2.5 pr-3 text-text-secondary text-xs">{a.customer_email || '—'}</td>
                  <td className="py-2.5 pr-3 text-text-secondary text-xs">{a.customer_phone || '—'}</td>
                  <td className="py-2.5 pr-3">
                    <span className="text-accent-coral text-xs">{ticketLabels[a.ticket_type] || a.ticket_type}</span>
                    {a.event_date && <span className="text-text-muted text-xs ml-1">({a.event_date})</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-accent-gold font-medium">${a.amount ? (a.amount / 100).toFixed(0) : '—'}</td>
                  <td className="py-2.5 text-right text-text-muted text-xs">
                    {new Date(a.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
