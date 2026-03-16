import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Exercise, ExerciseCategory } from '../../types';
import { Plus, Edit2, Trash2, Dumbbell } from 'lucide-react';

const CATEGORIES: { value: ExerciseCategory; label: string; color: string }[] = [
  { value: 'chest', label: '胸', color: 'bg-red-100 text-red-600' },
  { value: 'back', label: '背中', color: 'bg-blue-100 text-blue-600' },
  { value: 'legs', label: '脚', color: 'bg-green-100 text-green-600' },
  { value: 'shoulders', label: '肩', color: 'bg-yellow-100 text-yellow-600' },
  { value: 'arms', label: '腕', color: 'bg-purple-100 text-purple-600' },
  { value: 'core', label: '体幹', color: 'bg-orange-100 text-orange-600' },
  { value: 'other', label: 'その他', color: 'bg-gray-100 text-gray-600' },
];

const defaultForm = {
  name: '',
  category: 'chest' as ExerciseCategory,
  bodyPart: '',
  isSmithMachineCompatible: false,
  defaultBarWeight: 20,
  notes: '',
};

export default function ExerciseManagement() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [filterCategory, setFilterCategory] = useState('');

  const openAdd = () => {
    setEditingExercise(null);
    setForm({ ...defaultForm });
    setModalOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setForm({
      name: ex.name,
      category: ex.category,
      bodyPart: ex.bodyPart,
      isSmithMachineCompatible: ex.isSmithMachineCompatible,
      defaultBarWeight: ex.defaultBarWeight || 20,
      notes: ex.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExercise) {
      updateExercise(editingExercise.id, form);
    } else {
      addExercise(form);
    }
    setModalOpen(false);
  };

  const filtered = exercises.filter(e => !filterCategory || e.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-800">種目管理</h1>
          <p className="text-sm text-gray-500">{exercises.length}種目登録中</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Plus size={16} />
          種目を追加
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${!filterCategory ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={!filterCategory ? { background: 'linear-gradient(135deg, #BBD168, #99CEA0)' } : {}}
        >
          すべて
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${filterCategory === cat.value ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
            style={filterCategory === cat.value ? { background: 'linear-gradient(135deg, #BBD168, #99CEA0)' } : {}}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ex => {
          const cat = CATEGORIES.find(c => c.value === ex.category);
          return (
            <div key={ex.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  <Dumbbell size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{ex.name}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {cat && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                    )}
                    {ex.bodyPart && (
                      <span className="text-xs text-gray-400">{ex.bodyPart}</span>
                    )}
                    {ex.isSmithMachineCompatible && (
                      <span className="text-xs bg-[#BBD168]/20 text-[#7ab070] px-2 py-0.5 rounded-full">
                        スミス対応 {ex.defaultBarWeight}kg
                      </span>
                    )}
                  </div>
                  {ex.notes && <div className="text-xs text-gray-400 mt-1">{ex.notes}</div>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(ex)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteExercise(ex.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExercise ? '種目を編集' : '種目を追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">種目名 *</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="ベンチプレス"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as ExerciseCategory }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">部位</label>
              <input
                value={form.bodyPart}
                onChange={e => setForm(prev => ({ ...prev, bodyPart: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="胸・大腿四頭筋..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smith"
              checked={form.isSmithMachineCompatible}
              onChange={e => setForm(prev => ({ ...prev, isSmithMachineCompatible: e.target.checked }))}
            />
            <label htmlFor="smith" className="text-sm text-gray-600">スミスマシン対応</label>
          </div>

          {form.isSmithMachineCompatible && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">デフォルトバー重量 (kg)</label>
              <input
                type="number"
                value={form.defaultBarWeight}
                onChange={e => setForm(prev => ({ ...prev, defaultBarWeight: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                min="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">メモ</label>
            <input
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="注意点など"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">キャンセル</button>
            <button type="submit" className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>
              {editingExercise ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
