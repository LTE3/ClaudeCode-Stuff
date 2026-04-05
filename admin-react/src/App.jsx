import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PublicTicketing from './components/PublicTicketing';
import TicketConfirmation from './components/TicketConfirmation';
import TicketVerify from './components/TicketVerify';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const params = new URLSearchParams(window.location.search);

  // Ticket confirmation page (after purchase)
  const ticketSessionId = params.get('ticket');
  if (ticketSessionId) return <TicketConfirmation sessionId={ticketSessionId} />;

  // Ticket verification page (door scan)
  const verifySessionId = params.get('verify');
  if (verifySessionId) return <TicketVerify sessionId={verifySessionId} />;

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
