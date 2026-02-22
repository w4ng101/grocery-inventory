'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Clock, BarChart3,
  Users, Settings, LogOut, Menu, X, ChevronRight, ChevronDown,
  Boxes, Tag, Truck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn, getInitials } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/expiry', label: 'Expiry Monitor', icon: Clock },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const ADMIN_NAV_ITEMS = [
  { href: '/users', label: 'Users', icon: Users },
];

const SETTINGS_SUB_ITEMS = [
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
];

export function AppSidebar() {
  const { user, logout, can } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSettingsActive = SETTINGS_SUB_ITEMS.some(i => pathname.startsWith(i.href));
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900">GroceryIMS</span>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">Inventory System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Main Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-600' : 'text-gray-400')} />
              {label}
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-400" />}
            </Link>
          );
        })}

        {can('users:read') && (
          <>
            <p className="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Administration</p>
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-600' : 'text-gray-400')} />
                  {label}
                </Link>
              );
            })}

            {/* Settings collapsible */}
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isSettingsActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Settings className={cn('h-4 w-4 shrink-0', isSettingsActive ? 'text-emerald-600' : 'text-gray-400')} />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown className={cn(
                'h-3.5 w-3.5 transition-transform',
                settingsOpen ? 'rotate-180' : '',
                isSettingsActive ? 'text-emerald-400' : 'text-gray-300'
              )} />
            </button>

            {settingsOpen && (
              <div className="ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
                {SETTINGS_SUB_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-emerald-600' : 'text-gray-400')} />
                      {label}
                      {isActive && <ChevronRight className="ml-auto h-3 w-3 text-emerald-400" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs">
            {user ? getInitials(user.full_name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-gray-100 text-gray-500"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
