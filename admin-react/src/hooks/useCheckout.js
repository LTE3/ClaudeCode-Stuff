import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

export function useCheckout() {
  const [loading, setLoading] = useState(false);

  async function checkout(payload) {
    try {
      setLoading(true);
      // Attach the persistent visitor id (set by the landing page) so a paid
      // purchase can be linked to the click that produced it. Best-effort.
      let visitor_id = null;
      try { visitor_id = localStorage.getItem('lacasita_vid'); } catch (_e) { /* storage blocked */ }
      const data = await supabaseEdge('create-checkout', { ...payload, visitor_id });
      if (data.url) {
        // Use top-level window for redirect (works inside iframes)
        (window.top || window).location.href = data.url;
        return null;
      }
      return data.error || 'Checkout failed';
    } catch (err) {
      return err.message || 'Checkout failed';
    } finally {
      setLoading(false);
    }
  }

  return { checkout, loading };
}
