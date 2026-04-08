import { useState, useEffect } from 'react';
import { supabaseEdge } from '../config/supabase';

function formatTicketType(type) {
  const map = {
    ga_tier1: 'General Admission - Tier 1',
    ga_tier2: 'General Admission - Tier 2',
    ga_tier3: 'General Admission - Tier 3',
    vip_ga: 'VIP General Admission',
    vip_couch_before: 'VIP Couch (Before Midnight)',
    vip_couch_after: 'VIP Couch (After Midnight)',
    vip_high_top_before: 'VIP High Top (Before Midnight)',
    vip_high_top_after: 'VIP High Top (After Midnight)',
    regular_couch_before: 'Bottle Service Couch (Before Midnight)',
    regular_couch_after: 'Bottle Service Couch (After Midnight)',
    regular_high_top: 'Bottle Service High Top',
    dance_ga: 'Dance Night GA',
    season_pass_regular: 'Bad Bunny Season Pass',
    season_pass_vip: 'VIP Season Pass',
  };
  return map[type] || type;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function TicketConfirmation({ sessionId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTicket() {
      try {
        const data = await supabaseEdge('get-ticket', { session_id: sessionId });
        if (data.error) {
          setError(data.error);
        } else {
          setTicket(data);
        }
      } catch (err) {
        setError('Could not load ticket');
      }
      setLoading(false);
    }
    fetchTicket();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted">Loading your ticket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-accent-coral">{error}</div>
      </div>
    );
  }

  const qrData = `https://lacasitabk.com/admin/?verify=${sessionId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&bgcolor=0a0a0a&color=ffffff`;

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="max-w-md w-full flex flex-col items-stretch">
      <div className="bg-bg-elevated border border-border-default rounded-[20px] w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand to-accent-coral p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="font-[family-name:var(--font-display)] text-white text-2xl tracking-[4px]">
            YOU'RE IN!
          </h1>
          <p className="text-white/80 text-sm mt-1">Your ticket is confirmed</p>
        </div>

        {/* Screenshot reminder - top */}
        <div className="mx-4 mt-4 bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3 text-center">
          <p className="text-accent-gold text-sm font-medium">📱 Screenshot this ticket!</p>
          <p className="text-text-muted text-xs mt-1">You'll need it at the door</p>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center">
          <div className="bg-black rounded-[16px] p-4 mb-4 border border-border-default">
            <img
              src={qrUrl}
              alt="Ticket QR Code"
              className="w-[200px] h-[200px]"
            />
          </div>
          <p className="text-text-muted text-xs mb-6">Show this QR code at the door</p>

          {/* Ticket Details */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-text-muted text-sm">Event</span>
              <span className="text-text-primary text-sm font-medium">La Casita BK</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-text-muted text-sm">Date</span>
              <span className="text-text-primary text-sm font-medium">{formatDate(ticket.event_date)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-text-muted text-sm">Ticket</span>
              <span className="text-accent-teal text-sm font-medium">{formatTicketType(ticket.ticket_type)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-text-muted text-sm">Name</span>
              <span className="text-text-primary text-sm font-medium">{ticket.customer_name}</span>
            </div>
            {ticket.quantity > 1 && (
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="text-text-muted text-sm">Qty</span>
                <span className="text-text-primary text-sm font-medium">{ticket.quantity}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-text-muted text-sm">Status</span>
              <span className="text-accent-teal text-sm font-bold tracking-[2px]">
                {ticket.status === 'paid' ? '✓ PAID' : ticket.status?.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-text-muted text-sm">Venue</span>
              <span className="text-text-primary text-sm font-medium">428 Johnson Ave, Brooklyn, NY 11237</span>
            </div>
          </div>

          {/* Merch button */}
          <a
            href="https://lacasitabk.com/#merch"
            target="_top"
            onClick={(e) => { e.preventDefault(); (window.top || window).location.href = 'https://lacasitabk.com/#merch'; }}
            className="block mt-6 w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] bg-gradient-to-r from-accent-gold to-accent-coral text-black font-bold text-center no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            🛍️ SHOP MERCH
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
