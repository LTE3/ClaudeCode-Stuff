import { useState, useEffect } from 'react';
import { supabaseRpc } from '../config/supabase';

export function useSignupCounts(password) {
  const [data, setData] = useState({ total: 0, today: 0, withEmail: 0, loading: true });

  useEffect(() => {
    if (!password) return;
    supabaseRpc('get_signup_count', { admin_password: password })
      .then((res) => {
        setData({
          total: res.total_signups ?? res.total ?? 0,
          today: res.today_signups ?? res.today ?? 0,
          withEmail: res.with_email ?? 0,
          loading: false
        });
      })
      .catch(() => setData((prev) => ({ ...prev, loading: false })));
  }, [password]);

  return data;
}
