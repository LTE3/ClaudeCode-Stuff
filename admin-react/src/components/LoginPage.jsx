import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(pw);
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4 relative overflow-hidden">
      {/* Aurora blob */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'rgba(255, 77, 141, 0.2)',
          filter: 'blur(100px)',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'auroraFloat 6s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes auroraFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateX(-50%) translateY(-30px) scale(1.1); opacity: 1; }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-brand text-5xl tracking-[8px] mb-2">
            LA CASITA
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">Admin Dashboard</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-bg-surface border border-border-default rounded-[8px] px-4 py-3 text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-brand focus:shadow-[0_0_12px_rgba(255,77,141,0.25)] transition-all duration-300"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full text-white font-semibold rounded-[12px] px-4 py-3 text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #FF4D8D, #F87171)' }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </div>

        {error && (
          <p className="text-accent-coral text-sm">{error}</p>
        )}
      </form>
    </div>
  );
}
