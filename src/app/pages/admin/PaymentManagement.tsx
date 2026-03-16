import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Payment, PaymentMethod, PaymentStatus } from '../../types';
import { Plus, Check, X, CreditCard, Banknote, Building2, AlertCircle, CheckCircle2, Clock, Filter } from 'lucide-react';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金', card: 'カード', transfer: '振込', other: 'その他',
};

const STATUS_LABELS: Record<PaymentStatus, { label: string; class: string }> = {
  paid: { label: '支払済', class: 'bg-green-100 text-green-600' },
  unpaid: { label: '未払い', class: 'bg-red-100 text-red-600' },
  partial: { label: '一部支払', class: 'bg-yellow-100 text-yellow-600' },
};

const defaultPayment = {
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  method: 'cash' as PaymentMethod,
  status: 'paid' as PaymentStatus,
  description: '',
  notes: '',
};

export default function PaymentManagement() {
  const { clients, stores, addPayment, updatePayment, deletePayment, getTrainerById } = useApp();
  const [filterStore, setFilterStore] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ ...defaultPayment });

  const filteredClients = clients.filter(c => {
    if (filterStore && c.storeId !== filterStore) return false;
    if (filterStatus) {
      const hasStatus = c.paymentHistory.some(p => p.status === filterStatus);
      if (!hasStatus) return false;
    }
    return true;
  });

  const totalUnpaid = clients.reduce((sum, c) =>
    sum + c.paymentHistory.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0), 0
  );

  const totalPaid = clients.reduce((sum, c) =>
    sum + c.paymentHistory.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), 0
  );

  const openAddPayment = (clientId: string) => {
    setSelectedClient(clientId);
    setPaymentForm({ ...defaultPayment });
    setAddPaymentModal(true);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    addPayment(selectedClient, paymentForm);
    setAddPaymentModal(false);
  };

  const togglePaymentStatus = (clientId: string, paymentId: string, currentStatus: PaymentStatus) => {
    const newStatus: PaymentStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    updatePayment(clientId, paymentId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800">支払い管理</h1>
        <p className="text-sm text-gray-500">顧客の支払状況を管理します</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm text-gray-600">確認済み売上</span>
          </div>
          <div className="text-2xl font-semibold text-green-600">¥{totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-sm text-gray-600">未払い合計</span>
          </div>
          <div className="text-2xl font-semibold text-red-500">¥{totalUnpaid.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-600">未払い顧客数</span>
          </div>
          <div className="text-2xl font-semibold text-yellow-600">
            {clients.filter(c => c.paymentHistory.some(p => p.status === 'unpaid')).length}名
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStore}
          onChange={e => setFilterStore(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
        >
          <option value="">全店舗</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
        >
          <option value="">全ステータス</option>
          <option value="paid">支払済</option>
          <option value="unpaid">未払い</option>
          <option value="partial">一部支払</option>
        </select>
      </div>

      {/* Client payment list */}
      <div className="space-y-4">
        {filteredClients.map(client => {
          const store = stores.find(s => s.id === client.storeId);
          const unpaidCount = client.paymentHistory.filter(p => p.status === 'unpaid').length;

          return (
            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{client.name}</span>
                    <span className="text-xs text-gray-400">{client.nameKana}</span>
                    {unpaidCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        未払い {unpaidCount}件
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {store?.name} ・ {client.planType === 'monthly' ? `月額 ¥${client.monthlyFee?.toLocaleString()}` : `チケット ${client.ticketUsed}/${client.ticketTotal}回`}
                  </div>
                </div>
                <button
                  onClick={() => openAddPayment(client.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  <Plus size={12} />
                  追加
                </button>
              </div>

              {client.paymentHistory.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {client.paymentHistory.slice().reverse().slice(0, 5).map(payment => (
                    <div key={payment.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-700">{payment.description}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {payment.date} ・ {METHOD_LABELS[payment.method]}
                          {payment.notes && ` ・ ${payment.notes}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-gray-800">¥{payment.amount.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => togglePaymentStatus(client.id, payment.id, payment.status)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${STATUS_LABELS[payment.status].class}`}
                      >
                        {payment.status === 'paid' ? <Check size={12} /> : <AlertCircle size={12} />}
                        {STATUS_LABELS[payment.status].label}
                      </button>
                      <button
                        onClick={() => deletePayment(client.id, payment.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {client.paymentHistory.length > 5 && (
                    <div className="px-4 py-2 text-xs text-gray-400 text-center">
                      他 {client.paymentHistory.length - 5} 件の記録
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={addPaymentModal} onClose={() => setAddPaymentModal(false)} title="支払い記録を追加">
        <form onSubmit={handleAddPayment} className="space-y-4">
          {selectedClient && (
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              顧客: {clients.find(c => c.id === selectedClient)?.name}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">日付 *</label>
              <input
                type="date"
                value={paymentForm.date}
                onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">金額 *</label>
              <input
                type="number"
                value={paymentForm.amount || ''}
                onChange={e => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="30000"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">内容</label>
            <input
              value={paymentForm.description}
              onChange={e => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="2025年4月分など"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">支払方法</label>
              <select
                value={paymentForm.method}
                onChange={e => setPaymentForm(prev => ({ ...prev, method: e.target.value as PaymentMethod }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
              >
                <option value="cash">現金</option>
                <option value="card">カード</option>
                <option value="transfer">振込</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ステータス</label>
              <select
                value={paymentForm.status}
                onChange={e => setPaymentForm(prev => ({ ...prev, status: e.target.value as PaymentStatus }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
              >
                <option value="paid">支払済</option>
                <option value="unpaid">未払い</option>
                <option value="partial">一部支払</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">備考</label>
            <input
              value={paymentForm.notes}
              onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="備考・メモ"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddPaymentModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">キャンセル</button>
            <button type="submit" className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>追加</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
