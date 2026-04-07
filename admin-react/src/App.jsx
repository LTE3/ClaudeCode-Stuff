import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PublicTicketing from './components/PublicTicketing';
import TicketConfirmation from './components/TicketConfirmation';
import TicketVerify from './components/TicketVerify';
import OrderLookup from './components/OrderLookup';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const params = new URLSearchParams(window.location.search);

  // Ticket confirmation page (after purchase)
  const ticketSessionId = params.get('ticket');
  if (ticketSessionId) return <TicketConfirmation sessionId={ticketSessionId} />;

  // Ticket verification page (door scan)
  const verifySessionId = params.get('verify');
  if (verifySessionId) return <TicketVerify sessionId={verifySessionId} />;

  // Order lookup page
  const isLookup = params.has('lookup');
  if (isLookup) return (
    <div className="min-h-screen bg-bg-deep">
      <div className="max-w-[600px] mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[6px] text-brand">LA CASITA</h1>
          <p className="text-text-secondary mt-2 text-sm">Find your tickets & orders</p>
        </div>
        <OrderLookup />
      </div>
    </div>
  );

  // Public ticketing mode — no login needed
  const isPublicTickets = params.has('tickets');
  if (isPublicTickets) return <PublicTicketing />;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="text-text-muted text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
