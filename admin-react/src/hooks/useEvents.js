import { useState, useEffect, useCallback } from 'react';
import { supabaseGet } from '../config/supabase';

export function useEvents() {
  const [eventsByDate, setEventsByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseGet(
        'events',
        'select=event_date,title,is_active,ga_sold,ga_capacity,vip_ga_sold,vip_ga_capacity,ladies_free_claimed,ladies_free_capacity,early_type,early_start,early_end,free_ga_capacity,free_ga_claimed,ga_tier1_sold,ga_tier1_capacity,ga_tier2_sold,ga_tier2_capacity,ga_tier3_sold,ga_tier3_capacity,day_type,day_start,day_end'
      );
      const map = {};
      for (const event of data) {
        map[event.event_date] = event;
      }
      setEventsByDate(map);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { eventsByDate, loading, refetch: fetchEvents };
}
