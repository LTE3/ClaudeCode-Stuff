import { useAuth } from '../hooks/useAuth';

export default function DashboardHeader() {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="font-[family-name:var(--font-display)] text-brand text-3xl tracking-[3px]">
        LA CASITA
      </h1>
      <button
        onClick={logout}
        className="bg-bg-surface border border-border-default rounded-[12px] px-5 py-2 text-text-secondary text-sm hover:border-border-hover hover:text-text-primary transition-all duration-300 cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
