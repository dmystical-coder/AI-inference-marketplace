'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity } from 'lucide-react';

interface Stats {
  totalRequests: number;
  totalProviders: number;
  totalVolume: number;
}

export function StatsCounter() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    totalProviders: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/global');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      label: 'Requests Processed',
      value: stats.totalRequests.toLocaleString(),
      icon: Activity,
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Active Providers',
      value: stats.totalProviders,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Total Volume (SOL)',
      value: stats.totalVolume.toFixed(2),
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${stat.iconBg} border border-zinc-800`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </div>
            </div>
            <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

