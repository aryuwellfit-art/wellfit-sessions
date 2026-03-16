import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, Users, Clock, Store, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { TrainerMonthlyStat, StoreMonthlyStat } from '../../types';
import { useApp } from '../../context/AppContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d50cb12`;

function formatMinutes(min: number): string {
  if (min === 0) return '0分';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}時間${m > 0 ? m + '分' : ''}` : `${m}分`;
}

export default function MonthlyStats() {
  const { currentUser, stores, trainers } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const [trainerStats, setTrainerStats] = useState<TrainerMonthlyStat[]>([]);
  const [storeStats, setStoreStats] = useState<StoreMonthlyStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'trainer' | 'store'>('store');

  const fetchStats = async (month: string) => {
    setLoading(true);
    try {
      const [ts, ss] = await Promise.all([
        fetch(`${API_BASE}/stats/trainers?month=${month}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }).then(r => r.json()),
        fetch(`${API_BASE}/stats/stores?month=${month}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }).then(r => r.json()),
      ]);
      if (Array.isArray(ts)) setTrainerStats(ts);
      if (Array.isArray(ss)) setStoreStats(ss);
    } catch (e) {
      console.error('stats fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(selectedMonth); }, [selectedMonth]);

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Filter by accessible stores for area_manager
  const myStoreIds = currentUser?.storeIds || [];
  const filteredStoreStats = isAdmin
    ? storeStats
    : storeStats.filter(s => myStoreIds.includes(s.storeId));
  const filteredTrainerStats = isAdmin
    ? trainerStats.filter(t => t.role === 'trainer')
    : trainerStats.filter(t => t.role === 'trainer' && t.storeIds.some(sid => myStoreIds.includes(sid)));

  const totalSessions = filteredStoreStats.reduce((s, x) => s + x.sessionCount, 0);
  const totalMinutes = filteredStoreStats.reduce((s, x) => s + x.totalMinutes, 0);
  const totalClients = filteredStoreStats.reduce((s, x) => s + x.uniqueClientCount, 0);

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-');
    return `${y}年${parseInt(m)}月`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-gray-800">月次集計</h1>
          <p className="text-sm text-gray-500">セッション実績の月別集計</p>
        </div>
        {/* Month selector */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar size={15} className="text-[#99CEA0]" />
            <span className="text-sm font-medium text-gray-700">{monthLabel}</span>
          </div>
          <button
            onClick={() => shiftMonth(1)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            disabled={selectedMonth >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#99CEA0]" />
            <span className="text-xs text-gray-500">総セッション数</span>
          </div>
          <div className="text-2xl font-semibold text-gray-800">{loading ? '...' : totalSessions}<span className="text-sm text-gray-400 ml-1">本</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500">総セッション時間</span>
          </div>
          <div className="text-2xl font-semibold text-gray-800">{loading ? '...' : formatMinutes(totalMinutes)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-xs text-gray-500">来店顧客数</span>
          </div>
          <div className="text-2xl font-semibold text-gray-800">{loading ? '...' : totalClients}<span className="text-sm text-gray-400 ml-1">名</span></div>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'store', label: '店舗別', icon: Store },
          { key: 'trainer', label: 'トレーナー別', icon: UserCheck },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === t.key ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">データを集計中...</div>
      ) : tab === 'store' ? (
        <div className="space-y-4">
          {/* Store chart */}
          {filteredStoreStats.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-gray-700 mb-4">店舗別セッション数</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={filteredStoreStats.map(s => ({ name: s.storeName.replace('FitLab ', ''), sessions: s.sessionCount, clients: s.uniqueClientCount }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" name="セッション数" fill="#BBD168" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clients" name="来店顧客数" fill="#99CEA0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Store table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-gray-700">店舗別詳細 — {monthLabel}</h3>
            </div>
            {filteredStoreStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">この月のデータがありません</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">店舗名</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">セッション数</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">来店顧客数</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">総時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStoreStats.map(s => (
                      <tr key={s.storeId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-700 font-medium">{s.storeName}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.sessionCount}本</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.uniqueClientCount}名</td>
                        <td className="px-5 py-3 text-right text-gray-500">{formatMinutes(s.totalMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#BBD168]/5">
                    <tr>
                      <td className="px-5 py-3 text-gray-700 font-semibold">合計</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-semibold">{totalSessions}本</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-semibold">{totalClients}名</td>
                      <td className="px-5 py-3 text-right text-gray-500 font-semibold">{formatMinutes(totalMinutes)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Trainer chart */}
          {filteredTrainerStats.filter(t => t.sessionCount > 0).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-gray-700 mb-4">トレーナー別セッション数</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={filteredTrainerStats.filter(t => t.sessionCount > 0).map(t => ({ name: t.trainerName, sessions: t.sessionCount, minutes: t.totalMinutes }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" name="セッション数" fill="#BBD168" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trainer table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-gray-700">トレーナー別詳細 — {monthLabel}</h3>
            </div>
            {filteredTrainerStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">この月のデータがありません</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">トレーナー名</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">担当店舗</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">セッション数</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">総時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTrainerStats.map(t => {
                      const storeNames = t.storeIds
                        .map(sid => stores.find(s => s.id === sid)?.name?.replace('FitLab ', '') || sid)
                        .join(', ');
                      return (
                        <tr key={t.trainerId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-gray-700 font-medium">{t.trainerName}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{storeNames}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-medium ${t.sessionCount > 0 ? 'text-[#7ab070]' : 'text-gray-400'}`}>
                              {t.sessionCount}本
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500">{formatMinutes(t.totalMinutes)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
