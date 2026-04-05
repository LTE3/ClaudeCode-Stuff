import { useState, useCallback } from 'react';
import { supabaseRpc } from '../config/supabase';

export function useExportCSV(password) {
  const [loading, setLoading] = useState(false);

  const exportCSV = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      let allRows = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const batch = await supabaseRpc('get_signups', {
          admin_password: password,
          page_offset: offset,
          page_limit: limit
        });
        allRows = allRows.concat(batch);
        hasMore = batch.length === limit;
        offset += limit;
      }

      const headers = ['Name', 'Phone', 'Email', 'Signed Up'];
      const csvRows = [headers.join(',')];

      allRows.forEach((row) => {
        csvRows.push([
          `"${(row.name || '').replace(/"/g, '""')}"`,
          `"${(row.phone || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${row.created_at || ''}"`
        ].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lacasita-signups-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [password]);

  return { exportCSV, loading };
}
