import { useState, useEffect } from 'react';
import { supabaseEdge } from '../config/supabase';

function formatTicketType(type) {
  const map = {
    ga_tier1: 'GA Tier 1', ga_tier2: 'GA Tier 2', ga_tier3: 'GA Tier 3',
    vip_ga: 'VIP GA', vip_couch_before: 'VIP Couch', vip_couch_after: 'VIP Couch',
    vip_high_top_before: 'VIP High Top', vip_high_top_after: 'VIP High Top',
    regular_couch_before: 'Bottle Couch', regular_couch_after: 'Bottle Couch',
    regular_high_top: 'Bottle High Top', dance_ga: 'Dance GA',
    season_pass_regular: 'Season Pass', season_pass_vip: 'VIP Season Pass',
  };
  return map[type] || type;
}

export default function TicketVerify({ sessionId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        if (sessionId.startsWith('free_')) {
          // Free ticket — look up booking directly
          const bookingId = sessionId.replace('free_', '');
          const { supabaseGet } = await import('../config/supabase');
          const bookings = await supabaseGet('bookings', `id=eq.${bookingId}&select=*`);
          if (bookings?.[0]) {
            const b = bookings[0];
            setTicket({
              status: 'paid',
              customer_name: b.customer_name,
              ticket_type: b.booking_type,
              event_date: b.event_id,
              quantity: b.party_size || 1,
            });
          } else {
            setTicket({ error: 'Invalid ticket' });
          }
        } else {
          const data = await supabaseEdge('get-ticket', { session_id: sessionId });
          setTicket(data);
        }
      } catch {
        setTicket({ error: 'Invalid ticket' });
      }
      setLoading(false);
    }
    verify();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted text-xl">Verifying ticket...</div>
      </div>
    );
  }

  const valid = ticket && !ticket.error && ticket.status === 'paid';

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className={`rounded-[20px] max-w-sm w-full p-8 text-center border-2 ${
        valid ? 'bg-accent-teal/10 border-accent-teal' : 'bg-accent-coral/10 border-accent-coral'
      }`}>
        <div className="text-6xl mb-4">{valid ? '✅' : '❌'}</div>
        <h1 className={`font-[family-name:var(--font-display)] text-3xl tracking-[4px] mb-4 ${
          valid ? 'text-accent-teal' : 'text-accent-coral'
        }`}>
          {valid ? 'VALID' : 'INVALID'}
        </h1>

        {valid && (
          <div className="space-y-2 text-left mt-6">
            <div className="flex justify-between">
              <span className="text-text-muted">Name</span>
              <span className="text-text-primary font-bold">{ticket.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Ticket</span>
              <span className="text-accent-teal font-bold">{formatTicketType(ticket.ticket_type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Date</span>
              <span className="text-text-primary">{ticket.event_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Qty</span>
              <span className="text-text-primary">{ticket.quantity}</span>
            </div>
          </div>
        )}

        {!valid && (
          <p className="text-accent-coral text-sm mt-2">
            {ticket?.error || 'This ticket is not valid or has not been paid.'}
          </p>
        )}
      </div>
    </div>
  );
}
