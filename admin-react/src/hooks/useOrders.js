import { useState, useEffect } from 'react';
import { supabaseEdge } from '../config/supabase';

export function useOrders(password) {
  const [data, setData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    itemCounts: {},
    orders: [],
    loading: true
  });

  useEffect(() => {
    if (!password) return;
    supabaseEdge('get-orders', { admin_password: password })
      .then((res) => {
        // Filter out Valentine's Day sales (before March 2026)
        const cutoff = new Date('2026-03-01T00:00:00Z').getTime();
        const allOrders = res.orders || [];
        const filtered = allOrders.filter(o => {
          if (!o.date) return true;
          return new Date(o.date).getTime() >= cutoff;
        });
        const totalRevenue = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);
        const itemCounts = {};
        filtered.forEach(o => {
          (o.items || []).forEach(it => {
            const name = it.name || 'Unknown';
            itemCounts[name] = (itemCounts[name] || 0) + (it.qty || 1);
          });
        });
        setData({
          totalOrders: filtered.length,
          totalRevenue,
          itemCounts,
          orders: filtered,
          loading: false
        });
      })
      .catch(() => setData((prev) => ({ ...prev, loading: false })));
  }, [password]);

  return data;
}
