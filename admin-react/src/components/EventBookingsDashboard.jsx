import { useBookings } from '../hooks/useBookings';

function Badge({ children, color }) {
  const colors = {
    blue: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    gold: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
    teal: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20',
    coral: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
    pink: 'bg-brand/10 text-brand border-brand/20',
  };
  return (
    <span className={`border rounded-full px-3 py-1 text-[10px] tracking-[1px] font-medium ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
}

function TypeBadge({ type }) {
  const map = {
    ga: { label: 'GA', color: 'blue' },
    vip_ga: { label: 'VIP GA', color: 'gold' },
    ladies_free: { label: 'Ladies Free', color: 'teal' },
    vip_couch_before: { label: 'Couch (Before)', color: 'gold' },
    vip_couch_after: { label: 'Couch (After)', color: 'gold' },
    vip_high_top_before: { label: 'High Top (Before)', color: 'gold' },
    vip_high_top_after: { label: 'High Top (After)', color: 'gold' },
    test: { label: 'Test', color: 'coral' },
  };
  const { label, color } = map[type] || { label: type, color: 'blue' };
  return <Badge color={color}>{label}</Badge>;
}

function StatusBadge({ status }) {
  const color = status === 'confirmed' ? 'teal' : 'gold';
  return <Badge color={color}>{status}</Badge>;
}

export default function EventBookingsDashboard({ date, password }) {
  const { summary, bookings, loading } = useBookings(date, password);

  if (!date) {
    return (
      <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
        <div className="p-5 border-b border-border-default">
          <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
            EVENT BOOKINGS
          </h2>
        </div>
        <div className="p-5">
          <p className="text-text-muted text-sm">Select an event date to view bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
          EVENT BOOKINGS
        </h2>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="text-text-muted text-sm">Loading bookings...</div>
        ) : (
          <>
            {/* Summary badges */}
            {summary && (
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="bg-bg-surface border border-accent-blue/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-blue mb-1">GA</div>
                  <div className="text-accent-blue text-xl font-bold">{summary.ga_count ?? 0}</div>
                </div>
                <div className="bg-bg-surface border border-accent-gold/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-gold mb-1">VIP GA</div>
                  <div className="text-accent-gold text-xl font-bold">{summary.vip_ga_count ?? 0}</div>
                </div>
                <div className="bg-bg-surface border border-accent-teal/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-teal mb-1">LADIES FREE</div>
                  <div className="text-accent-teal text-xl font-bold">{summary.ladies_free_count ?? 0}</div>
                </div>
                <div className="bg-bg-surface border border-accent-gold/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-gold mb-1">COUCHES</div>
                  <div className="text-accent-gold text-xl font-bold">{summary.couch_count ?? 0}</div>
                </div>
                <div className="bg-bg-surface border border-accent-gold/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-gold mb-1">HIGH TOPS</div>
                  <div className="text-accent-gold text-xl font-bold">{summary.high_top_count ?? 0}</div>
                </div>
                <div className="bg-bg-surface border border-accent-teal/15 rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-[10px] tracking-[2px] text-accent-teal mb-1">REVENUE</div>
                  <div className="text-accent-teal text-xl font-bold">${summary.revenue ?? 0}</div>
                </div>
              </div>
            )}

            {/* Bookings table */}
            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left text-[10px] tracking-[2px] text-text-muted font-medium py-2 px-3">TYPE</th>
                      <th className="text-left text-[10px] tracking-[2px] text-text-muted font-medium py-2 px-3">CUSTOMER</th>
                      <th className="text-left text-[10px] tracking-[2px] text-text-muted font-medium py-2 px-3">DETAILS</th>
                      <th className="text-left text-[10px] tracking-[2px] text-text-muted font-medium py-2 px-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={i} className="border-b border-border-default/50">
                        <td className="py-3 px-3">
                          <TypeBadge type={b.ticket_type} />
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-text-primary text-sm">{b.customer_name}</div>
                          <div className="text-text-muted text-xs">{b.customer_email}</div>
                        </td>
                        <td className="py-3 px-3 text-text-secondary text-sm">
                          {b.table_id ? `Table: ${b.table_id}` : b.party_size ? `Party: ${b.party_size}` : b.quantity ? `Qty: ${b.quantity}` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={b.status || 'pending'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-muted text-sm">No bookings yet for this event.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
