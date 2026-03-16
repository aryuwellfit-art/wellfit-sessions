import React, { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Search, Filter, Users, Calendar, CreditCard, ChevronRight } from 'lucide-react';

export default function ClientOverview() {
  const { clients, stores, trainers, sessions } = useApp();
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.nameKana.includes(search) || c.phone.includes(search);
    const matchStore = !filterStore || c.storeId === filterStore;
    const matchPlan = !filterPlan || c.planType === filterPlan;
    return matchSearch && matchStore && matchPlan;
  });

  const getMonthsActive = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const getThisMonthCount = (clientId: string) => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return sessions.filter(s => s.clientId === clientId && s.date.startsWith(prefix)).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800">顧客一覧</h1>
        <p className="text-sm text-gray-500">全{clients.length}名の顧客</p>
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
        <select
          value={filterStore}
          onChange={e => setFilterStore(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
        >
          <option value="">全店舗</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">顧客名</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden sm:table-cell">店舗</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden md:table-cell">プラン</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden lg:table-cell">継続期間</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden lg:table-cell">今月回数</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">支払</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(client => {
                const store = stores.find(s => s.id === client.storeId);
                const primaryTrainer = trainers.find(t => t.id === client.primaryTrainerId);
                const monthsActive = getMonthsActive(client.startDate);
                const thisMonthCount = getThisMonthCount(client.id);
                const latestPayment = client.paymentHistory[client.paymentHistory.length - 1];
                const hasUnpaid = client.paymentHistory.some(p => p.status === 'unpaid');

                return (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                        >
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm text-gray-800">{client.name}</div>
                          <div className="text-xs text-gray-400">{client.nameKana}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-600">{store?.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          client.planType === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {client.planType === 'monthly' ? '月額制' : 'チケット制'}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {client.planType === 'monthly'
                            ? `¥${client.monthlyFee?.toLocaleString()}/月`
                            : `${client.ticketUsed}/${client.ticketTotal}回`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{monthsActive}ヶ月</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{thisMonthCount}回</span>
                      {client.planType === 'monthly' && client.monthlyFrequency && (
                        <span className="text-xs text-gray-400">/{client.monthlyFrequency}回</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasUnpaid ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">未払い</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">支払済</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/trainer/clients/${client.id}`}
                        className="text-xs text-[#99CEA0] hover:text-[#7ab070] flex items-center gap-1 justify-end"
                      >
                        カルテ
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    顧客が見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
