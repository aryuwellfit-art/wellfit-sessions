import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Store, Machine, MachineType } from '../../types';
import { Plus, Edit2, Trash2, MapPin, Phone, Wrench, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';

const MACHINE_TYPES: { value: MachineType; label: string }[] = [
  { value: 'smith', label: 'スミスマシン' },
  { value: 'cable', label: 'ケーブルマシン' },
  { value: 'free_weight', label: 'フリーウェイト' },
  { value: 'plate_loaded', label: 'プレートロード式' },
  { value: 'selectorized', label: 'セレクタライズド' },
  { value: 'other', label: 'その他' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const defaultForm = {
  name: '',
  address: '',
  phone: '',
  machines: [] as Machine[],
  active: true,
};

export default function StoreManagement() {
  const { stores, addStore, updateStore, deleteStore, trainers, clients } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const openAdd = () => {
    setEditingStore(null);
    setForm({ ...defaultForm, machines: [] });
    setModalOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      address: store.address,
      phone: store.phone,
      machines: [...store.machines],
      active: store.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingStore) {
      updateStore(editingStore.id, form);
    } else {
      addStore(form);
    }
    setModalOpen(false);
  };

  const addMachine = () => {
    setForm(prev => ({
      ...prev,
      machines: [...prev.machines, { id: generateId(), name: '', type: 'other' }],
    }));
  };

  const updateMachine = (idx: number, data: Partial<Machine>) => {
    setForm(prev => ({
      ...prev,
      machines: prev.machines.map((m, i) => i === idx ? { ...m, ...data } : m),
    }));
  };

  const removeMachine = (idx: number) => {
    setForm(prev => ({
      ...prev,
      machines: prev.machines.filter((_, i) => i !== idx),
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-800">店舗管理</h1>
          <p className="text-sm text-gray-500">{stores.length}店舗登録中</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Plus size={16} />
          店舗を追加
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {stores.map(store => {
          const storeTrainers = trainers.filter(t => t.storeIds.includes(store.id) && t.role === 'trainer');
          const storeClients = clients.filter(c => c.storeId === store.id);
          const isExpanded = expandedStores.has(store.id);

          return (
            <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                  >
                    <span className="text-white text-sm font-semibold">{store.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-gray-800">{store.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${store.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {store.active ? '稼働中' : '停止中'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={12} />
                      <span>{store.address}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone size={12} />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center px-3">
                      <div className="text-sm font-semibold text-gray-700">{storeTrainers.length}</div>
                      <div className="text-xs text-gray-400">TR</div>
                    </div>
                    <div className="text-center px-3">
                      <div className="text-sm font-semibold text-gray-700">{storeClients.length}</div>
                      <div className="text-xs text-gray-400">顧客</div>
                    </div>
                    <button
                      onClick={() => openEdit(store)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteStore(store.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleExpand(store.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">マシン一覧</span>
                    </div>
                    {store.machines.length === 0 ? (
                      <p className="text-sm text-gray-400">マシン未登録</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {store.machines.map(m => (
                          <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className="text-gray-700">{m.name}</span>
                            {m.type === 'smith' && m.barWeight && (
                              <span className="text-xs text-[#99CEA0] ml-auto">バー{m.barWeight}kg</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <span className="text-sm text-gray-600">担当トレーナー: </span>
                      <span className="text-sm text-gray-400">
                        {storeTrainers.length > 0 ? storeTrainers.map(t => t.name).join('、') : 'なし'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStore ? '店舗を編集' : '店舗を追加'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">店舗名 *</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="FitLab 渋谷店"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">電話番号</label>
              <input
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="03-0000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">住所</label>
            <input
              value={form.address}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="東京都渋谷区..."
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">ステータス:</span>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg ${form.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
            >
              {form.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {form.active ? '稼働中' : '停止中'}
            </button>
          </div>

          {/* Machines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600">マシン一覧</label>
              <button
                type="button"
                onClick={addMachine}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-[#99CEA0] text-[#7ab070]"
              >
                <Plus size={12} />
                追加
              </button>
            </div>
            <div className="space-y-2">
              {form.machines.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <input
                    value={m.name}
                    onChange={e => updateMachine(idx, { name: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#99CEA0]"
                    placeholder="マシン名"
                  />
                  <select
                    value={m.type}
                    onChange={e => updateMachine(idx, { type: e.target.value as MachineType })}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#99CEA0] bg-white"
                  >
                    {MACHINE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {m.type === 'smith' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={m.barWeight || ''}
                        onChange={e => updateMachine(idx, { barWeight: Number(e.target.value) })}
                        className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#99CEA0]"
                        placeholder="20"
                        min="0"
                      />
                      <span className="text-xs text-gray-400">kg</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMachine(idx)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
            >
              {editingStore ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
