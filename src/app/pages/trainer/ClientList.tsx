import React, { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Search, Plus, ChevronRight, Calendar, Ticket, CreditCard, Users } from 'lucide-react';

export default function ClientList() {
  const { currentUser, clients, sessions, stores } = useApp();
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  const myStoreIds = currentUser?.storeIds || [];
  const accessibleStores = stores.filter(s => myStoreIds.includes(s.id));

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const baseClients = currentUser?.role === 'admin'
    ? clients
    : clients.filter(c => myStoreIds.includes(c.storeId));

  const filtered = baseClients.filter(c => {
    const matchSearch = !search ||
      c.name.includes(search) ||
      c.nameKana.includes(search) ||
      c.phone.includes(search);
    const matchStore = !filterStore || c.storeId === filterStore;
    const matchPlan = !filterPlan || c.planType === filterPlan;
    return matchSearch && matchStore && matchPlan;
  });

  const getLastSession = (clientId: string) => {
    return sessions.filter(s => s.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  const getThisMonthCount = (clientId: string) => {
    return sessions.filter(s => s.clientId === clientId && s.date.startsWith(monthPrefix)).length;
  };

  const getRemainingTickets = (client: typeof clients[0]) => {
    if (client.planType !== 'ticket') return null;
    return (client.ticketTotal || 0) - (client.ticketUsed || 0);
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-800">顧客一覧</h1>
          <p className="text-sm text-gray-500">{filtered.length}名</p>
        </div>
        <Link
          to="/trainer/clients/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Plus size={16} />
          顧客登録
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="名前・カナ・電話で検索"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
          />
        </div>
        {accessibleStores.length > 1 && (
          <select
            value={filterStore}
            onChange={e => setFilterStore(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
          >
            <option value="">全店舗</option>
            {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
        >
          <option value="">全プラン</option>
          <option value="monthly">月額制</option>
          <option value="ticket">チケット制</option>
        </select>
      </div>

      {/* Client list */}
      <div className="space-y-3">
        {filtered.map(client => {
          const lastSession = getLastSession(client.id);
          const thisMonthCount = getThisMonthCount(client.id);
          const store = stores.find(s => s.id === client.storeId);
          const remaining = getRemainingTickets(client);
          const daysToExpiry = getDaysUntilExpiry(client.ticketExpiryDate);
          const isTicketLow = remaining !== null && remaining <= 4;
          const isExpiryClose = daysToExpiry !== null && daysToExpiry <= 30;

          return (
            <Link
              key={client.id}
              to={`/trainer/clients/${client.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#BBD168] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 text-lg"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  {client.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{client.name}</span>
                    <span className="text-xs text-gray-400">{client.nameKana}</span>
                    {store && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full hidden sm:inline">
                        {store.name}
                      </span>
                    )}
                    {isTicketLow && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                        残{remaining}回
                      </span>
                    )}
                    {isExpiryClose && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        期限{daysToExpiry}日
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {client.planType === 'monthly' ? (
                        <>
                          <CreditCard size={11} />
                          <span>月額 ¥{client.monthlyFee?.toLocaleString()} / {client.monthlyFrequency}回</span>
                        </>
                      ) : (
                        <>
                          <Ticket size={11} />
                          <span>{client.ticketUsed}/{client.ticketTotal}回 使用</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} />
                      <span>今月 {thisMonthCount}回</span>
                    </div>
                    {lastSession && (
                      <span className="text-xs text-gray-400">
                        前回: {lastSession.date}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#99CEA0] transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-sm">顧客が見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}
