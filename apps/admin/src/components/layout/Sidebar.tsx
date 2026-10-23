import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingBag,
  Sparkles,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Products', to: '/products', icon: Shirt },
  { name: 'Inventory', to: '/inventory', icon: Boxes },
  { name: 'Orders', to: '/orders', icon: ShoppingBag },
  { name: 'Collections & CMS', to: '/collections', icon: Sparkles },
  { name: 'Customers', to: '/customers', icon: Users },
  { name: 'Support Tickets', to: '/support', icon: MessageSquare },
  { name: 'Settings & Staff', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-obsidian text-ivory border-r border-sandstone/15 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div className="px-4 py-6 border-b border-sandstone/15">
          <div className="flex items-center gap-3">
            <img src="/brand/logo.png" alt="Ateevibes" className="h-8 w-auto brightness-110" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gold block">
                Ateevibes Operations
              </span>
              <span className="text-xs font-serif italic text-sandstone/70 whitespace-nowrap">Mumbai, Maharashtra</span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                      : 'text-sandstone/80 hover:text-ivory hover:bg-graphite'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-sandstone/15 bg-graphite/40">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ivory truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-gold" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold truncate">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              aria-label="Logout"
              className="p-1.5 text-sandstone/60 hover:text-gold hover:bg-graphite rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
