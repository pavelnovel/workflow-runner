import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, PlayCircle, Layers, Settings, Zap } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'DASHBOARD' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ACTIVE_PROCESSES' as ViewState, label: 'Runs', icon: PlayCircle },
    { id: 'TEMPLATES' as ViewState, label: 'Workflows', icon: Layers },
  ];

  const isActive = (id: ViewState) => {
    if (id === 'DASHBOARD' && currentView === 'DASHBOARD') return true;
    if (id === 'ACTIVE_PROCESSES' && currentView === 'ACTIVE_PROCESSES') return true;
    if (id === 'TEMPLATES' && (currentView === 'TEMPLATES' || currentView === 'CREATE_TEMPLATE' || currentView === 'EDIT_TEMPLATE')) return true;
    if (id === 'SETTINGS' && currentView === 'SETTINGS') return true;
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap className="text-white" size={22} />
          </div>
          <span className="font-bold text-xl text-gray-900">Workflow Runner</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <Icon size={20} className={active ? 'text-brand-600' : 'text-gray-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => onNavigate('SETTINGS')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
            ${isActive('SETTINGS')
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:bg-gray-50 border border-transparent'
            }
          `}
        >
          <Settings size={20} className={isActive('SETTINGS') ? 'text-brand-600' : 'text-gray-400'} />
          Settings
        </button>
      </div>
    </aside>
  );
};
