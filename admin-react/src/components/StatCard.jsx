const colorMap = {
  pink: {
    text: 'text-brand',
    accent: 'bg-brand',
    glow: 'shadow-[0_0_20px_var(--color-brand-glow)]'
  },
  blue: {
    text: 'text-accent-blue',
    accent: 'bg-accent-blue',
    glow: 'shadow-[0_0_20px_var(--color-blue-glow)]'
  },
  green: {
    text: 'text-accent-teal',
    accent: 'bg-accent-teal',
    glow: 'shadow-[0_0_20px_var(--color-teal-glow)]'
  },
  gold: {
    text: 'text-accent-gold',
    accent: 'bg-accent-gold',
    glow: 'shadow-[0_0_20px_var(--color-gold-glow)]'
  },
  coral: {
    text: 'text-accent-coral',
    accent: 'bg-accent-coral',
    glow: 'shadow-[0_0_20px_var(--color-coral-glow)]'
  }
};

export default function StatCard({ value, label, color = 'pink' }) {
  const c = colorMap[color] || colorMap.pink;

  return (
    <div className="group relative bg-bg-elevated border border-border-default rounded-[16px] p-5 md:p-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-border-hover hover:shadow-lg overflow-hidden cursor-default min-w-0">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className={`text-xl md:text-[2.2rem] font-bold leading-tight ${c.text} truncate animate-[shimmerGlow_4s_ease-in-out_infinite]`}>
        {value ?? '--'}
      </div>
      <div className="text-text-muted text-[0.62rem] md:text-[0.72rem] uppercase tracking-[1px] md:tracking-[1.5px] mt-1.5 font-medium">
        {label}
      </div>
    </div>
  );
}
