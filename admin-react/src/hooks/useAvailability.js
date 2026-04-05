import { useState, useEffect, useCallback } from 'react';
import { supabaseRpc } from '../config/supabase';

export function useAvailability(eventDate) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!eventDate) return;
    try {
      setLoading(true);
      const data = await supabaseRpc('get_event_availability', { p_event_date: eventDate });
      setAvailability(data);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  }, [eventDate]);

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 30000);
    return () => clearInterval(interval);
  }, [fetchAvailability]);

  return { availability, loading, refetch: fetchAvailability };
}
