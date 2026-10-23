import React from 'react';
import { Menu, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  title: string;
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenMobileMenu }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-ivory/95 backdrop-blur border-b border-sandstone px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar"
          className="lg:hidden p-2 text-obsidian hover:bg-sandstone/30 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center bg-white border border-sandstone rounded-full px-3.5 py-1.5 shadow-subtle focus-within:border-gold">
          <Search className="w-3.5 h-3.5 text-ink-600 mr-2" />
          <input
            type="text"
            placeholder="Search orders, SKUs, styles..."
            className="text-xs bg-transparent text-obsidian placeholder:text-ink-500 focus:outline-none w-48 xl:w-64"
          />
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 bg-white border border-sandstone px-3 py-1.5 rounded-full shadow-subtle">
          <div className="w-6 h-6 rounded-full bg-obsidian text-gold flex items-center justify-center font-bold text-[10px]">
            {user?.name?.charAt(0) || <User className="w-3 h-3" />}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-obsidian block leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
