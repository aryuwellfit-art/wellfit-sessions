import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { InactiveClientAlert } from '../../types';
import { useApp } from '../../context/AppContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d50cb12`;

export default function InactiveClientsPage() {
  const { stores, trainers, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const myStoreIds = currentUser?.storeIds || [];

  const [alerts, setAlerts] = useState<InactiveClientAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStore, setFilterStore] = useState('');

  const accessibleStores = isAdmin
    ? stores.filter(s => s.active)
    : stores.filter(s => s.active && myStoreIds.includes(s.id));

  const fetchInactive = async () => {
    setLoading(true);
    try {
      const storeParam = filterStore
        ? `?storeIds=${filterStore}`
        : isAdmin
          ? ''
          : `?storeIds=${myStoreIds.join(',')}`;
      const res = await fetch(`${API_BASE}/alerts/inactive${storeParam}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data);
    } catch (e) {
      console.error('inactive fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInactive(); }, [filterStore]);

  const getDaysColor = (days: number) => {
    if (days >= 30) return 'text-red-600 bg-red-100';
    if (days >= 21) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-700 bg-yellow-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-gray-800">未訪問顧客アラート</h1>
          <p className="text-sm text-gray-500">最終来店から2週間以上経過している顧客</p>
        </div>
        <button
          onClick={fetchInactive}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 text-gray-600"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {/* Store filter */}
      <div className="flex items-center gap-3">
        <Filter size={15} className="text-gray-400 flex-shrink-0" />
        <select
          value={filterStore}
          onChange={e => setFilterStore(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#99CEA0] w-full max-w-xs"
        >
          <option value="">すべての店舗</option>
          {accessibleStores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">データを取得中...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-green-400" />
          </div>
          <h3 className="text-gray-600 mb-1">未訪問顧客はいません</h3>
          <p className="text-sm text-gray-400">すべての顧客が2週間以内に来店しています</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-gray-700">{alerts.length}名が2週間以上未来店</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {alerts.map(alert => {
              const store = stores.find(s => s.id === alert.storeId);
              const trainer = trainers.find(t => t.id === alert.primaryTrainerId);
              const daysColor = getDaysColor(alert.daysSince);

              return (
                <div key={alert.clientId} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                  >
                    {alert.clientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700">{alert.clientName}</div>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {store && (
                        <span className="text-xs text-gray-400">{store.name}</span>
                      )}
                      {trainer && (
                        <span className="text-xs text-gray-400">担当: {trainer.name}</span>
                      )}
                      <span className="text-xs text-gray-400">最終来店: {alert.lastVisitDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${daysColor}`}>
                      {alert.daysSince}日経過
                    </span>
                    <Link
                      to={`/trainer/clients/${alert.clientId}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
