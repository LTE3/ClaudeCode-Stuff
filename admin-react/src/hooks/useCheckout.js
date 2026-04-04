import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

export function useCheckout() {
  const [loading, setLoading] = useState(false);

  async function checkout(payload) {
    try {
      setLoading(true);
      const data = await supabaseEdge('create-checkout', payload);
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
