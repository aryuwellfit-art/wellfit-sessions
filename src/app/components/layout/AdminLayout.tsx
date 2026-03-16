import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Store, Users, CreditCard, ClipboardList,
  Dumbbell, LogOut, Menu, X, ChevronRight, UserCheck,
  BarChart2, AlertTriangle, Shield,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, loading } = useApp();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';
  const isAreaManager = currentUser?.role === 'area_manager';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role-based nav items
  const navItems = [
    { to: '/admin', label: 'ダッシュボード', icon: LayoutDashboard, end: true, show: true },
    { to: '/admin/stores', label: '店舗管理', icon: Store, show: true },
    { to: '/admin/trainers', label: 'トレーナー管理', icon: UserCheck, show: true },
    { to: '/admin/payments', label: '支払い管理', icon: CreditCard, show: isAdmin },
    { to: '/admin/clients', label: '顧客一覧', icon: Users, show: true },
    { to: '/admin/exercises', label: '種目管理', icon: Dumbbell, show: isAdmin },
    { to: '/admin/stats', label: '月次集計', icon: BarChart2, show: true },
    { to: '/admin/inactive', label: '未訪問アラート', icon: AlertTriangle, show: true },
  ].filter(item => item.show);

  if (loading) return <LoadingSpinner />;

  const roleLabel = isAdmin ? '管理者' : isAreaManager ? 'エリアマネージャー' : 'スタッフ';
  const roleBadgeColor = isAdmin ? 'text-red-500' : 'text-blue-500';

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
              <div className={`text-xs font-medium ${roleBadgeColor}`}>{roleLabel}</div>
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
              <div className={`text-xs ${roleBadgeColor}`}>{roleLabel}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
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

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <NavLink
            to="/trainer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ClipboardList size={18} className="text-gray-400" />
            <span>カルテ画面へ</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
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
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {isAdmin ? 'Admin Panel' : 'Manager Panel'}
          </span>
          {!isAdmin && (
            <span className="ml-auto text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
              支払い情報非表示
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
