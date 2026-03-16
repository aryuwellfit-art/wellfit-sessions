import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Trainer, UserRole } from '../../types';
import { Plus, Edit2, Trash2, Mail, Eye, EyeOff, Shield, UserCheck, Store } from 'lucide-react';

const defaultForm = {
  name: '',
  email: '',
  password: '',
  role: 'trainer' as UserRole,
  storeIds: [] as string[],
  active: true,
  memo: '',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  area_manager: 'エリアMgr',
  trainer: 'トレーナー',
};
const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-600',
  area_manager: 'bg-blue-100 text-blue-600',
  trainer: 'bg-green-100 text-green-600',
};

export default function TrainerManagement() {
  const { trainers, stores, addTrainer, updateTrainer, deleteTrainer } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const openAdd = () => {
    setEditingTrainer(null);
    setForm({ ...defaultForm });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setForm({
      name: trainer.name,
      email: trainer.email,
      password: trainer.password,
      role: trainer.role,
      storeIds: Array.isArray(trainer.storeIds) ? [...trainer.storeIds] : [],
      active: trainer.active,
      memo: trainer.memo || '',
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrainer) {
      updateTrainer(editingTrainer.id, form);
    } else {
      addTrainer(form);
    }
    setModalOpen(false);
  };

  const toggleStore = (storeId: string) => {
    setForm(prev => ({
      ...prev,
      storeIds: prev.storeIds.includes(storeId)
        ? prev.storeIds.filter(id => id !== storeId)
        : [...prev.storeIds, storeId],
    }));
  };

  const filtered = trainers.filter(t =>
    t.name.includes(searchTerm) || t.email.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-800">トレーナー管理</h1>
          <p className="text-sm text-gray-500">
            {trainers.filter(t => t.role === 'trainer').length}名のトレーナー・
            {trainers.filter(t => t.role === 'area_manager').length}名のエリアMgr登録中
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
        placeholder="名前・メールで検索..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(trainer => {
          const safeStoreIds = Array.isArray(trainer.storeIds) ? trainer.storeIds : [];
          const trainerStores = stores.filter(s => safeStoreIds.includes(s.id));
          return (
            <div key={trainer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  <span className="text-lg">{trainer.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-800 text-sm font-medium">{trainer.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[trainer.role] || 'bg-gray-100 text-gray-500'}`}>
                      {ROLE_LABELS[trainer.role] || trainer.role}
                    </span>
                    {!trainer.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">無効</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Mail size={11} />
                    <span>{trainer.email}</span>
                  </div>
                  {trainer.memo && (
                    <div className="text-xs text-gray-400 mt-1">{trainer.memo}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {trainerStores.map(s => (
                      <span key={s.id} className="text-xs bg-[#BBD168]/20 text-[#7ab070] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Store size={10} />
                        {s.name.replace('FitLab ', '')}
                      </span>
                    ))}
                    {trainerStores.length === 0 && (
                      <span className="text-xs text-gray-300">店舗未割り当て</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(trainer)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                    <Edit2 size={15} />
                  </button>
                  {trainer.role !== 'admin' && (
                    <button onClick={() => deleteTrainer(trainer.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTrainer ? 'アカウントを編集' : 'アカウントを追加'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">名前 *</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="田中 健太"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">メールアドレス *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="tanaka@fitlab.jp"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">パスワード *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="パスワード"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">権限</label>
            <div className="flex gap-2">
              {(['trainer', 'area_manager', 'admin'] as UserRole[]).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role }))}
                  className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                    form.role === role
                      ? 'border-[#99CEA0] bg-[#99CEA0]/10 text-[#7ab070]'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.role === 'area_manager' ? '※ 支払い情報は非表示になります' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">担当店舗</label>
            <div className="grid grid-cols-1 gap-2">
              {stores.map(store => (
                <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.storeIds.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{store.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">メモ</label>
            <input
              value={form.memo}
              onChange={e => setForm(prev => ({ ...prev, memo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="資格・備考など"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
            />
            <label htmlFor="active" className="text-sm text-gray-600">アクティブ</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
              キャンセル
            </button>
            <button type="submit" className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>
              {editingTrainer ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}