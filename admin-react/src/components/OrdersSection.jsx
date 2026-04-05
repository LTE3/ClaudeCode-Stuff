export default function OrdersSection({ totalOrders, totalRevenue, itemCounts, orders, loading }) {
  if (loading) {
    return (
      <div className="bg-bg-elevated border border-border-default rounded-[16px] p-6 mb-6">
        <p className="text-text-muted text-sm">Loading orders...</p>
      </div>
    );
  }

  // Edge function already returns dollars, not cents
  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : 0;
    return `$${val.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
          ORDERS & MERCH SOLD
        </h2>
        <p className="text-text-muted text-xs mt-1">
          {totalOrders} orders &middot; {formatCurrency(totalRevenue)} revenue
        </p>
      </div>

      {Object.keys(itemCounts).length > 0 && (
        <div className="px-5 pt-4 flex flex-wrap gap-2">
          {Object.entries(itemCounts).map(([name, count]) => (
            <span
              key={name}
              className="bg-bg-surface border border-border-default rounded-[30px] px-3 py-1 text-xs text-text-secondary"
            >
              {name} <span className="text-accent-teal font-bold ml-1">{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="p-5 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['#', 'Customer', 'Items', 'Total', 'Shipping', 'Date'].map((h) => (
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
            {orders.map((order, i) => (
              <tr key={order.id || i} className={`border-b border-border-default last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors ${i % 2 === 1 ? 'bg-[rgba(255,255,255,0.015)]' : ''}`}>
                <td className="px-3 py-3 text-text-muted text-sm">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="text-text-primary text-sm">{order.customer_name || order.name || '--'}</div>
                  <div className="text-text-muted text-xs">{order.customer_email || order.email || ''}</div>
                </td>
                <td className="px-3 py-3 text-text-secondary text-sm">
                  {(order.items || []).map((it) => it.name || it.description).join(', ') || '--'}
                </td>
                <td className="px-3 py-3 text-accent-teal font-bold text-sm">
                  {formatCurrency(order.amount)}
                </td>
                <td className="px-3 py-3 text-text-secondary text-sm">
                  {order.shipping_name || order.shipping || '--'}
                </td>
                <td className="px-3 py-3 text-text-muted text-sm">
                  {formatDate(order.created_at || order.date)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-text-muted text-sm">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
