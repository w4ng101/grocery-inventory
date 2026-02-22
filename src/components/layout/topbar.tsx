'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({ title = 'Dashboard', subtitle }: TopbarProps) {
  const { user } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?is_resolved=false&limit=1')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setUnreadAlerts(j.data?.unread_count ?? 0);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900 leading-none">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900">
            <Bell className="h-4 w-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </Button>

          {/* User avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs">
            {user?.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
