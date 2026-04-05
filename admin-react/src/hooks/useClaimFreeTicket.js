import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

export function useClaimFreeTicket() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function claim(payload) {
    try {
      setLoading(true);
      setSuccess(false);
      const data = await supabaseEdge('claim-free-ticket', payload);
      if (data.error) {
        return data.error;
      }
      setSuccess(true);
      return null;
    } catch (err) {
      return err.message || 'Claim failed';
    } finally {
      setLoading(false);
    }
  }

  return { claim, loading, success };
}
