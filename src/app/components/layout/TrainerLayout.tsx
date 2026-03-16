import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, Dumbbell, LogOut, Menu, X,
  ChevronRight, Shield, AlertTriangle,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export default function TrainerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, loading } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <LoadingSpinner />;

  const navItems = [
    { to: '/trainer', label: 'ダッシュボード', icon: LayoutDashboard, end: true },
    { to: '/trainer/clients', label: '顧客一覧', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
            >
              <Dumbbell size={20} className="text-white" />
            </div>
            <div>
              <div className="text-gray-800 text-sm font-semibold">FitLab</div>
              <div className="text-xs text-[#7ab070] font-medium">カルテシステム</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#BBD168]/10 to-[#99CEA0]/10 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
            >
              {currentUser?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">{currentUser?.name}</div>
              <div className="text-xs text-gray-400">トレーナー</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={(item as any).end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: 'linear-gradient(135deg, #BBD168, #99CEA0)' } : {}
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          {(currentUser?.role === 'admin' || currentUser?.role === 'area_manager') && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Shield size={18} className="text-[#99CEA0]" />
              <span>管理画面へ</span>
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div
            className="h-1 w-16 rounded-full"
            style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
          />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Trainer Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
