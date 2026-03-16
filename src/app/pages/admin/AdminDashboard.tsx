import React from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Store, Users, UserCheck, CreditCard, TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart2, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { stores, trainers, clients, sessions, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const isAreaManager = currentUser?.role === 'area_manager';
  const myStoreIds = currentUser?.storeIds || [];

  const activeStores = stores.filter(s => s.active).length;
  const activeTrainers = trainers.filter(t => t.active && t.role === 'trainer').length;
  const activeClients = clients.filter(c => c.active).length;

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today).length;

  const unpaidClients = isAdmin ? clients.filter(c => {
    const latest = c.paymentHistory[c.paymentHistory.length - 1];
    return latest && latest.status === 'unpaid';
  }) : [];

  const totalRevenue = isAdmin ? clients.reduce((sum, c) => {
    return sum + c.paymentHistory.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  }, 0) : 0;

  const expiringTickets = isAdmin ? clients.filter(c => {
    if (c.planType !== 'ticket' || !c.ticketExpiryDate) return false;
    const expiry = new Date(c.ticketExpiryDate);
    const diff = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }) : [];

  // 2-week inactive (frontend estimate)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const cutoff = twoWeeksAgo.toISOString().split('T')[0];
  const inactiveCount = clients.filter(c => {
    if (!c.active) return false;
    if (isAreaManager && !myStoreIds.includes(c.storeId)) return false;
    const cs = sessions.filter(s => s.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = cs[0]?.date || c.startDate;
    return lastDate <= cutoff;
  }).length;

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSessions = sessions.filter(s => s.date.startsWith(monthPrefix)).length;

  const stats = [
    { label: '稼働店舗', value: activeStores, icon: Store, color: '#BBD168', bg: '#f8fce8' },
    { label: 'トレーナー数', value: activeTrainers, icon: UserCheck, color: '#99CEA0', bg: '#f0faf1' },
    { label: '顧客数', value: activeClients, icon: Users, color: '#7ab8d4', bg: '#f0f8fc' },
    { label: '本日のセッション', value: todaySessions, icon: TrendingUp, color: '#d4a574', bg: '#fdf5ee' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800">
          {isAdmin ? '管理ダッシュボード' : 'エリアマネージャー ダッシュボード'}
        </h1>
        <p className="text-sm text-gray-500">FitLab 管理システム</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: stat.bg }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick action links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '月次集計', to: '/admin/stats', icon: BarChart2, color: '#7ab8d4', bg: '#f0f8fc', show: true },
          { label: '未訪問アラート', to: '/admin/inactive', icon: AlertTriangle, color: '#f97316', bg: '#fff7ed',
            badge: inactiveCount > 0 ? `${inactiveCount}名` : null, show: true },
          { label: '支払い管理', to: '/admin/payments', icon: CreditCard, color: '#d4a574', bg: '#fdf5ee', show: isAdmin },
          { label: '顧客一覧', to: '/admin/clients', icon: Users, color: '#99CEA0', bg: '#f0faf1', show: true },
        ].filter(x => x.show).map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#BBD168] transition-colors group relative"
          >
            {item.badge && (
              <span className="absolute top-3 right-3 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: item.bg }}
            >
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <div className="text-sm text-gray-700 group-hover:text-[#7ab070]">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">クリックして確認 →</div>
          </Link>
        ))}
      </div>

      {/* Alerts (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unpaid */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-orange-500" />
              <h3 className="text-gray-700">未払い顧客</h3>
              {unpaidClients.length > 0 && (
                <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  {unpaidClients.length}件
                </span>
              )}
            </div>
            {unpaidClients.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 size={16} />
                <span>未払いはありません</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {unpaidClients.slice(0, 5).map(c => {
                  const latest = c.paymentHistory.find(p => p.status === 'unpaid');
                  return (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-orange-500">¥{latest?.amount.toLocaleString()}</span>
                    </li>
                  );
                })}
                {unpaidClients.length > 5 && (
                  <li className="text-xs text-gray-400">他 {unpaidClients.length - 5} 件</li>
                )}
              </ul>
            )}
            <Link to="/admin/payments" className="block mt-4 text-xs text-[#99CEA0] hover:underline">
              支払い管理を開く →
            </Link>
          </div>

          {/* Expiring tickets */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-yellow-500" />
              <h3 className="text-gray-700">チケット期限が近い顧客</h3>
              {expiringTickets.length > 0 && (
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                  {expiringTickets.length}件
                </span>
              )}
            </div>
            {expiringTickets.length === 0 ? (
              <div className="text-sm text-gray-500">期限が近いチケットはありません</div>
            ) : (
              <ul className="space-y-2">
                {expiringTickets.map(c => {
                  const daysLeft = Math.ceil(
                    (new Date(c.ticketExpiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-yellow-600">残{daysLeft}日</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Area manager: inactive alert */}
      {isAreaManager && inactiveCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-orange-700">未訪問顧客が {inactiveCount} 名います</h3>
          </div>
          <p className="text-sm text-orange-600 mb-3">2週間以上来店のない顧客を確認してください</p>
          <Link
            to="/admin/inactive"
            className="inline-flex items-center gap-1 text-sm text-orange-600 border border-orange-300 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"
          >
            未訪問一覧を確認 →
          </Link>
        </div>
      )}

      {/* Revenue summary (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-gray-700 mb-4">売上サマリー</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">累計売上（確定分）</div>
              <div className="text-xl font-semibold" style={{ color: '#7ab070' }}>
                ¥{totalRevenue.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">月額プラン顧客</div>
              <div className="text-xl font-semibold text-gray-700">
                {clients.filter(c => c.planType === 'monthly').length}名
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">チケットプラン顧客</div>
              <div className="text-xl font-semibold text-gray-700">
                {clients.filter(c => c.planType === 'ticket').length}名
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">今月のセッション数</div>
              <div className="text-xl font-semibold text-gray-700">{thisMonthSessions}本</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
