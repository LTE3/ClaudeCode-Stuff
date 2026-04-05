import { useState, useEffect } from 'react';
import { supabaseRpc } from '../config/supabase';

export function useAnalytics(password) {
  const [data, setData] = useState({ totalViews: 0, todayViews: 0, weekViews: 0, loading: true });

  useEffect(() => {
    if (!password) return;
    supabaseRpc('get_analytics', { admin_password: password })
      .then((res) => {
        setData({
          totalViews: res.total_views ?? res.total ?? 0,
          todayViews: res.today_views ?? res.today ?? 0,
          weekViews: res.week_views ?? res.week ?? 0,
          loading: false
        });
      })
      .catch(() => setData((prev) => ({ ...prev, loading: false })));
  }, [password]);

  return data;
}
