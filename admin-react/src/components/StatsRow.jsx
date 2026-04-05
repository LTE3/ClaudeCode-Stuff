import StatCard from './StatCard';

export default function StatsRow({ stats, columns = 3 }) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns] || 'grid-cols-3'} gap-3 mb-6`}>
      {stats.map((stat, i) => (
        <StatCard key={i} value={stat.value} label={stat.label} color={stat.color} />
      ))}
    </div>
  );
}
