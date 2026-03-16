import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Users, Calendar, Activity, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { InactiveClientAlert } from '../../types';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const CONDITION_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: '不調', color: 'text-red-500', emoji: '😔' },
  2: { label: 'やや不調', color: 'text-orange-500', emoji: '😕' },
  3: { label: '普通', color: 'text-yellow-500', emoji: '😐' },
  4: { label: '好調', color: 'text-green-500', emoji: '😊' },
  5: { label: '絶好調', color: 'text-emerald-500', emoji: '😄' },
};

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d50cb12`;

export default function TrainerDashboard() {
  const { currentUser, clients, sessions, stores, trainers } = useApp();
  const [inactiveAlerts, setInactiveAlerts] = useState<InactiveClientAlert[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);

  const myStoreIds = currentUser?.storeIds || [];
  const myClients = clients.filter(c => myStoreIds.includes(c.storeId) && c.active);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today && myStoreIds.includes(s.storeId));
  const myTodaySessions = sessions.filter(s => s.date === today && s.trainerId === currentUser?.id);

  const recentSessions = sessions
    .filter(s => myStoreIds.includes(s.storeId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Fetch inactive alerts for this trainer's stores
  useEffect(() => {
    if (!currentUser || myStoreIds.length === 0) return;
    setAlertLoading(true);
    fetch(
      `${API_BASE}/alerts/inactive?storeIds=${myStoreIds.join(',')}`,
      { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
    )
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setInactiveAlerts(data);
      })
      .catch(e => console.error('inactive fetch error:', e))
      .finally(() => setAlertLoading(false));
  }, [currentUser?.id, myStoreIds.join(',')]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800">こんにちは、{currentUser?.name}さん</h1>
        <p className="text-sm text-gray-500">{today} の担当確認</p>
      </div>

      {/* 2週間未訪問アラート */}
      {inactiveAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
            <h3 className="text-orange-700 text-sm font-medium">
              2週間以上来店がない顧客 ({inactiveAlerts.length}名)
            </h3>
          </div>
          <div className="space-y-2">
            {inactiveAlerts.slice(0, 5).map(alert => (
              <Link
                key={alert.clientId}
                to={`/trainer/clients/${alert.clientId}`}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2 hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                  >
                    {alert.clientName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm text-gray-700">{alert.clientName}</div>
                    <div className="text-xs text-gray-400">最終来店: {alert.lastVisitDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    {alert.daysSince}日経過
                  </span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </Link>
            ))}
            {inactiveAlerts.length > 5 && (
              <p className="text-xs text-orange-500 text-center pt-1">
                他 {inactiveAlerts.length - 5} 名の未訪問顧客がいます
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>
            <Users size={18} className="text-white" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">{myClients.length}</div>
          <div className="text-xs text-gray-500">担当顧客数</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50">
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">{myTodaySessions.length}</div>
          <div className="text-xs text-gray-500">本日のセッション</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-purple-50">
            <Activity size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">
            {sessions.filter(s => s.trainerId === currentUser?.id && s.date.startsWith(monthPrefix)).length}
          </div>
          <div className="text-xs text-gray-500">今月のセッション</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50">
            <AlertTriangle size={18} className={`${inactiveAlerts.length > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
          </div>
          <div className={`text-2xl font-semibold ${inactiveAlerts.length > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
            {inactiveAlerts.length}
          </div>
          <div className="text-xs text-gray-500">未訪問（2週間↑）</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700">本日のセッション</h3>
            <span className="text-xs bg-[#BBD168]/20 text-[#7ab070] px-2 py-0.5 rounded-full">{today}</span>
          </div>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">本日のセッションはありません</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(session => {
                const client = clients.find(c => c.id === session.clientId);
                const trainer = trainers.find(t => t.id === session.trainerId);
                const cond = CONDITION_LABELS[session.condition];
                return (
                  <div key={session.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                    >
                      {client?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700">{client?.name}</div>
                      <div className="text-xs text-gray-400">{trainer?.name} ・ {session.exercises.length}種目</div>
                    </div>
                    <span className="text-lg">{cond?.emoji}</span>
                    <Link
                      to={`/trainer/clients/${session.clientId}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/trainer/clients" className="block mt-4 text-xs text-center text-[#99CEA0] hover:underline">
            顧客一覧を見る →
          </Link>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700">最近のセッション</h3>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">セッション記録がありません</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(session => {
                const client = clients.find(c => c.id === session.clientId);
                const trainer = trainers.find(t => t.id === session.trainerId);
                const cond = CONDITION_LABELS[session.condition];
                return (
                  <div key={session.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                    >
                      {client?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700">{client?.name}</div>
                      <div className="text-xs text-gray-400">{session.date} ・ {trainer?.name}</div>
                    </div>
                    <span className="text-sm">{cond?.emoji}</span>
                    <Link
                      to={`/trainer/clients/${session.clientId}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My clients quick access */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-700">担当顧客</h3>
          <Link to="/trainer/clients" className="text-xs text-[#99CEA0] hover:underline">すべて見る</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {myClients.slice(0, 8).map(client => {
            const thisMonthCount = sessions.filter(
              s => s.clientId === client.id && s.date.startsWith(monthPrefix)
            ).length;
            const isInactive = inactiveAlerts.some(a => a.clientId === client.id);
            return (
              <Link
                key={client.id}
                to={`/trainer/clients/${client.id}`}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-center relative ${
                  isInactive ? 'ring-1 ring-orange-200' : ''
                }`}
              >
                {isInactive && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
                )}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  <span className="text-lg">{client.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{client.name}</div>
                  <div className="text-xs text-gray-400">今月{thisMonthCount}回</div>
                </div>
              </Link>
            );
          })}
          <Link
            to="/trainer/clients/new"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#BBD168]/40 hover:border-[#BBD168] transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#BBD168]/10">
              <span className="text-2xl text-[#BBD168]">+</span>
            </div>
            <div className="text-xs text-[#7ab070]">顧客登録</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
