import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExportCSV } from '../hooks/useExportCSV';

const PAGE_SIZE = 100;

export default function SignupsTable() {
  const { signups, password } = useAuth();
  const { exportCSV, loading: exportLoading } = useExportCSV(password);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return signups;
    const q = search.toLowerCase();
    return signups.filter((s) =>
      ((s.first_name || '') + ' ' + (s.last_name || '')).toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [signups, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
            RECENT SIGNUPS
          </h2>
          <p className="text-text-muted text-xs mt-1">{signups.length} total signups</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exportLoading}
          className="bg-accent-teal text-black text-xs font-semibold rounded-[12px] px-4 py-2 hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 cursor-pointer"
        >
          {exportLoading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="px-5 pt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name, phone, or email..."
          className="w-full bg-bg-surface border border-border-default rounded-[8px] px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-brand transition-colors duration-300"
        />
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['#', 'Name', 'Phone', 'Email', 'Signed Up'].map((h) => (
                <th
                  key={h}
                  className="bg-bg-surface text-text-muted text-[0.68rem] uppercase tracking-[1.5px] font-medium px-3 py-2.5 first:rounded-l-lg last:rounded-r-lg"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((signup, i) => (
              <tr key={signup.id || i} className="border-b border-border-default last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-3 py-3 text-text-muted text-sm">{page * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-3 text-text-primary text-sm font-medium">{(signup.first_name || '') + ' ' + (signup.last_name || '') || '--'}</td>
                <td className="px-3 py-3 text-text-secondary text-sm">{signup.phone || '--'}</td>
                <td className="px-3 py-3 text-text-secondary text-sm">{signup.email || '--'}</td>
                <td className="px-3 py-3 text-text-muted text-sm">{formatDate(signup.created_at)}</td>
              </tr>
            ))}
            {pageSlice.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-text-muted text-sm">
                  {search ? 'No results found' : 'No signups yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 pb-5 flex items-center justify-between">
          <span className="text-text-muted text-xs">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-bg-surface border border-border-default rounded-[8px] px-3 py-1.5 text-text-secondary text-xs hover:border-border-hover disabled:opacity-30 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="bg-bg-surface border border-border-default rounded-[8px] px-3 py-1.5 text-text-secondary text-xs hover:border-border-hover disabled:opacity-30 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
