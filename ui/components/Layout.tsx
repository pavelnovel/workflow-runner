import React from 'react';
import { ViewState } from '../types';
import { Sidebar } from './Sidebar';
import { Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  title: string;
  userName?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
  title,
  userName = 'JD',
  showSearch = true,
  onSearch,
  searchPlaceholder = 'Search...'
}) => {
  // Get initials for header avatar
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onNavigate={onNavigate} userName={userName} />

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-5">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            <div className="flex items-center gap-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
                    onChange={(e) => onSearch?.(e.target.value)}
                  />
                </div>
              )}

              {/* User Avatar */}
              <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold text-white cursor-pointer hover:bg-gray-700 transition-colors">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
