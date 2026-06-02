import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

export function useClaimFreeTicket() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  async function claim(payload) {
    try {
      setLoading(true);
      setSuccess(false);
      // Attach the persistent visitor id (set by the landing page) so this RSVP
      // can be linked back to the click that produced it. Best-effort: if storage
      // is blocked the field is simply omitted.
      let visitor_id = null;
      try { visitor_id = localStorage.getItem('lacasita_vid'); } catch (_e) { /* storage blocked */ }
      const data = await supabaseEdge('claim-free-ticket', { ...payload, visitor_id });
      if (data.error) {
        return data.error;
      }
      setTicketData(data);
      setSuccess(true);
      return null;
    } catch (err) {
      return err.message || 'Claim failed';
    } finally {
      setLoading(false);
    }
  }

  return { claim, loading, success, ticketData };
}
