import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Clock } from 'lucide-react';
import { PlanType } from '../../types';

const PLAN_TYPE_LABELS: Record<string, string> = {
  monthly: '月額コース',
  ticket: 'チケットコース',
  intensive: '集中コース',
  nano: 'nano＋',
};

export default function ClientForm() {
  const navigate = useNavigate();
  const { currentUser, stores, addClient, courses } = useApp();
  const myStoreIds = Array.isArray(currentUser?.storeIds) ? currentUser.storeIds : [];
  const accessibleStores = stores.filter(s => myStoreIds.includes(s.id));

  const activeCourses = courses.filter(c => c.active);
  const coursesByType = activeCourses.reduce<Record<string, typeof activeCourses>>((acc, c) => {
    if (!acc[c.planType]) acc[c.planType] = [];
    acc[c.planType].push(c);
    return acc;
  }, {});

  const [form, setForm] = useState({
    name: '',
    nameKana: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    email: '',
    address: '',
    storeId: accessibleStores[0]?.id || '',
    primaryTrainerId: currentUser?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    planType: 'monthly' as PlanType,
    courseId: '',
    // Monthly
    monthlyFee: 30000,
    monthlyFrequency: 8,
    // Ticket
    ticketTotal: 24,
    ticketFee: 120000,
    // Counseling
    goals: '',
    healthIssues: '',
    injuries: '',
    exerciseHistory: '',
    diet: '',
    notes: '',
  });

  const selectedCourse = form.courseId ? courses.find(c => c.id === form.courseId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(form.startDate);
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + 8);

    await addClient({
      name: form.name,
      nameKana: form.nameKana,
      birthDate: form.birthDate,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      address: form.address,
      storeId: form.storeId,
      primaryTrainerId: form.primaryTrainerId,
      startDate: form.startDate,
      planType: form.planType,
      courseId: form.courseId || undefined,
      monthlyFee: form.planType === 'monthly' ? form.monthlyFee : undefined,
      monthlyFrequency: form.planType === 'monthly' ? form.monthlyFrequency : undefined,
      ticketTotal: form.planType === 'ticket' ? form.ticketTotal : undefined,
      ticketUsed: form.planType === 'ticket' ? 0 : undefined,
      ticketStartDate: form.planType === 'ticket' ? form.startDate : undefined,
      ticketExpiryDate: form.planType === 'ticket' ? expiryDate.toISOString().split('T')[0] : undefined,
      ticketFee: form.planType === 'ticket' ? form.ticketFee : undefined,
      paymentHistory: [],
      counselingSheet: {
        goals: form.goals,
        healthIssues: form.healthIssues,
        injuries: form.injuries,
        exerciseHistory: form.exerciseHistory,
        currentActivity: '',
        diet: form.diet,
        sleepHours: '',
        stressLevel: '',
        medications: '',
        notes: '',
        completedAt: new Date().toISOString().split('T')[0],
      },
      notes: form.notes,
      active: true,
    });

    navigate('/trainer/clients');
  };

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-gray-800">顧客登録</h1>
          <p className="text-sm text-gray-500">新しい顧客を登録します</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-gray-700">基本情報</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">お名前 *</label>
              <input
                value={form.name}
                onChange={e => f('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="山田 太郎"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">フリガナ</label>
              <input
                value={form.nameKana}
                onChange={e => f('nameKana', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="ヤマダ タロウ"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">生年月日</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={e => f('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">性別</label>
              <div className="flex gap-2">
                {[['male', '男性'], ['female', '女性'], ['other', 'その他']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => f('gender', val)}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                      form.gender === val ? 'border-[#99CEA0] bg-[#99CEA0]/10 text-[#7ab070]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">電話番号</label>
              <input
                value={form.phone}
                onChange={e => f('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="090-0000-0000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">メールアドレス</label>
              <input
                type="email"
                value={form.email}
                onChange={e => f('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">住所</label>
            <input
              value={form.address}
              onChange={e => f('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="東京都..."
            />
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-gray-700">契約情報</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">担当店舗 *</label>
              <select
                value={form.storeId}
                onChange={e => f('storeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
                required
              >
                <option value="">店舗を選択</option>
                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">入会日 *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => f('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                required
              />
            </div>
          </div>

          {/* Plan type */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">プランタイプ *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => f('planType', 'monthly')}
                className={`flex-1 py-3 rounded-xl border transition-colors text-sm ${
                  form.planType === 'monthly' ? 'border-[#99CEA0] bg-[#99CEA0]/10 text-[#7ab070]' : 'border-gray-200 text-gray-500'
                }`}
              >
                📅 月額制
              </button>
              <button
                type="button"
                onClick={() => f('planType', 'ticket')}
                className={`flex-1 py-3 rounded-xl border transition-colors text-sm ${
                  form.planType === 'ticket' ? 'border-[#99CEA0] bg-[#99CEA0]/10 text-[#7ab070]' : 'border-gray-200 text-gray-500'
                }`}
              >
                🎫 チケット制
              </button>
            </div>
          </div>

          {form.planType === 'monthly' && (
            <div className="grid grid-cols-2 gap-4 bg-green-50 rounded-xl p-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">月額料金 (円)</label>
                <input
                  type="number"
                  value={form.monthlyFee}
                  onChange={e => f('monthlyFee', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">月間回数</label>
                <input
                  type="number"
                  value={form.monthlyFrequency}
                  onChange={e => f('monthlyFrequency', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
                  min="1"
                />
              </div>
            </div>
          )}

          {form.planType === 'ticket' && (
            <div className="grid grid-cols-2 gap-4 bg-purple-50 rounded-xl p-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">チケット総回数</label>
                <input
                  type="number"
                  value={form.ticketTotal}
                  onChange={e => f('ticketTotal', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">チケット料金 (円)</label>
                <input
                  type="number"
                  value={form.ticketFee}
                  onChange={e => f('ticketFee', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
                  min="0"
                />
              </div>
              <div className="col-span-2 text-xs text-purple-500">
                ※ チケット有効期限は入会日から8ヶ月間です
              </div>
            </div>
          )}

          {/* Course selector */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              受講コース
              <span className="text-xs text-gray-400 ml-1">（セッション時間の自動計算に使用）</span>
            </label>
            <select
              value={form.courseId}
              onChange={e => f('courseId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm bg-white"
            >
              <option value="">コースを選択（任意）</option>
              {Object.entries(coursesByType).map(([type, cs]) => (
                <optgroup key={type} label={PLAN_TYPE_LABELS[type] || type}>
                  {cs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}（{c.sessionMinutes}分/回）
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedCourse && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[#7ab070] bg-[#BBD168]/10 px-3 py-2 rounded-lg">
                <Clock size={14} />
                <span>{selectedCourse.name} — 1回 {selectedCourse.sessionMinutes}分</span>
                {selectedCourse.monthlyCount && <span>・月{selectedCourse.monthlyCount}回</span>}
                {selectedCourse.totalSessions && <span>・全{selectedCourse.totalSessions}回</span>}
              </div>
            )}
          </div>
        </div>

        {/* Counseling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-gray-700">カウンセリング情報</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">トレーニング目標</label>
            <textarea
              value={form.goals}
              onChange={e => f('goals', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
              rows={2}
              placeholder="ダイエット、筋力アップ、体型維持など"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">健康上の問題</label>
              <textarea
                value={form.healthIssues}
                onChange={e => f('healthIssues', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
                rows={2}
                placeholder="持病、通院中など"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">怪我・故障歴</label>
              <textarea
                value={form.injuries}
                onChange={e => f('injuries', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
                rows={2}
                placeholder="腰痛、膝痛など"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">運動歴</label>
              <textarea
                value={form.exerciseHistory}
                onChange={e => f('exerciseHistory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
                rows={2}
                placeholder="学生時代のスポーツなど"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">食事傾向</label>
              <textarea
                value={form.diet}
                onChange={e => f('diet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
                rows={2}
                placeholder="外食多め、野菜不足など"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">トレーナーメモ</label>
            <textarea
              value={form.notes}
              onChange={e => f('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
              rows={2}
              placeholder="注意事項、引継ぎ事項など"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
          >
            登録する
          </button>
        </div>
      </form>
    </div>
  );
}
