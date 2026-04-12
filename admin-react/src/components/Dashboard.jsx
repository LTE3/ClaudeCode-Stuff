import { useAuth } from '../hooks/useAuth';
import { useSignupCounts } from '../hooks/useSignupCounts';
import { useAnalytics } from '../hooks/useAnalytics';
import { useOrders } from '../hooks/useOrders';
import DashboardHeader from './DashboardHeader';
import StatsRow from './StatsRow';
import OrdersSection from './OrdersSection';
import SignupsTable from './SignupsTable';
import TicketCheckoutCards from './TicketCheckoutCards';
import MerchSection from './MerchSection';
import TicketingSection from './TicketingSection';
import FailedPayments from './FailedPayments';

export default function Dashboard() {
  const { password } = useAuth();
  const signupCounts = useSignupCounts(password);
  const analytics = useAnalytics(password);
  const ordersData = useOrders(password);

  const signupStats = [
    { value: signupCounts.loading ? '...' : signupCounts.total, label: 'Total Signups', color: 'pink' },
    { value: signupCounts.loading ? '...' : signupCounts.today, label: 'Today', color: 'pink' },
    { value: signupCounts.loading ? '...' : signupCounts.withEmail, label: 'With Email', color: 'pink' }
  ];

  const viewStats = [
    { value: analytics.loading ? '...' : analytics.totalViews, label: 'Total Views', color: 'blue' },
    { value: analytics.loading ? '...' : analytics.todayViews, label: 'Today', color: 'blue' },
    { value: analytics.loading ? '...' : analytics.weekViews, label: 'This Week', color: 'blue' }
  ];

  const orderStats = [
    { value: ordersData.loading ? '...' : ordersData.totalOrders, label: 'Total Orders', color: 'green' },
    {
      value: ordersData.loading ? '...' : `$${ordersData.totalRevenue.toFixed(ordersData.totalRevenue % 1 === 0 ? 0 : 2)}`,
      label: 'Revenue',
      color: 'green'
    },
    { value: ordersData.loading ? '...' : ordersData.orders.length, label: 'Fulfilled', color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        <DashboardHeader />
        <StatsRow stats={signupStats} />
        <StatsRow stats={viewStats} />
        <StatsRow stats={orderStats} />
        <OrdersSection
          totalOrders={ordersData.totalOrders}
          totalRevenue={ordersData.totalRevenue}
          itemCounts={ordersData.itemCounts}
          orders={ordersData.orders}
          loading={ordersData.loading}
        />
        <SignupsTable />
        <TicketCheckoutCards />
        <FailedPayments />
        <MerchSection />
        <TicketingSection />
      </div>
    </div>
  );
}
