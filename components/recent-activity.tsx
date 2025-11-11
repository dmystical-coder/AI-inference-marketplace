'use client';

import { useEffect, useState } from 'react';
import { Clock, Zap, Activity as ActivityIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  service: string;
  timestamp: Date;
  user: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('/api/activity/recent');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null;
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-20 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <ActivityIcon className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Live Activity</h3>
        </div>
      </div>

      {/* Activity List */}
      <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
        {activities.slice(0, 8).map((activity, index) => (
          <div
            key={activity.id}
            className="relative p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate mb-1">
                  {activity.service}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">
                    {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/80">
        <p className="text-xs text-zinc-500 text-center">
          Updates every 10 seconds
        </p>
      </div>
    </div>
  );
}

