import { useState, useEffect } from 'react';
import { supabaseRpc } from '../config/supabase';

export function useBookings(eventDate, password) {
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventDate || !password) return;
    let cancelled = false;

    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await supabaseRpc('get_event_bookings', {
          p_event_date: eventDate,
          admin_password: password
        });
        if (!cancelled) {
          setSummary(data.summary || null);
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBookings();
    return () => { cancelled = true; };
  }, [eventDate, password]);

  return { summary, bookings, loading };
}
