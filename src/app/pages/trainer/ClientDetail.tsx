import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft, Plus, Calendar, Dumbbell, CreditCard, Ticket, FileText,
  Edit2, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, Clock,
  CheckCircle2, AlertCircle, Activity, Heart, BookOpen
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { CounselingSheet } from '../../types';

const CONDITION_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: '不調', emoji: '😔', color: 'text-red-500' },
  2: { label: 'やや不調', emoji: '😕', color: 'text-orange-500' },
  3: { label: '普通', emoji: '😐', color: 'text-yellow-500' },
  4: { label: '好調', emoji: '😊', color: 'text-green-500' },
  5: { label: '絶好調', emoji: '😄', color: 'text-emerald-500' },
};

type Tab = 'overview' | 'sessions' | 'counseling' | 'notes';

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { getClientById, getClientSessions, getTrainerById, getStoreById, updateClient, currentUser, getCourseById } = useApp();

  const client = getClientById(clientId!);
  const sessions = getClientSessions(clientId!);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [editNotesModal, setEditNotesModal] = useState(false);
  const [notesValue, setNotesValue] = useState(client?.notes || '');
  const [counselingModal, setCounselingModal] = useState(false);
  const [counselingForm, setCounselingForm] = useState<CounselingSheet>(
    client?.counselingSheet || {
      goals: '', healthIssues: '', injuries: '', exerciseHistory: '',
      currentActivity: '', diet: '', sleepHours: '', stressLevel: '',
      medications: '', notes: '', completedAt: new Date().toISOString().split('T')[0],
    }
  );

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">顧客が見つかりません</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[#99CEA0]">戻る</button>
      </div>
    );
  }

  const store = getStoreById(client.storeId);
  const primaryTrainer = getTrainerById(client.primaryTrainerId);
  const course = client.courseId ? getCourseById(client.courseId) : undefined;

  // Hide payment info for area_manager
  const showPayments = currentUser?.role === 'admin' || currentUser?.role === 'trainer';

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSessions = sessions.filter(s => s.date.startsWith(monthPrefix));
  const startDate = new Date(client.startDate);
  const monthsActive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  const remainingTickets = client.planType === 'ticket'
    ? (client.ticketTotal || 0) - (client.ticketUsed || 0)
    : null;

  const daysToExpiry = client.ticketExpiryDate
    ? Math.ceil((new Date(client.ticketExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const toggleSession = (id: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveNotes = () => {
    updateClient(client.id, { notes: notesValue });
    setEditNotesModal(false);
  };

  const handleSaveCounseling = () => {
    updateClient(client.id, { counselingSheet: counselingForm });
    setCounselingModal(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: '概要', icon: User },
    { key: 'sessions', label: 'セッション', icon: Dumbbell },
    { key: 'counseling', label: 'カウンセリング', icon: FileText },
    { key: 'notes', label: 'メモ', icon: Edit2 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          {client.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-gray-800">{client.name}</h1>
          <p className="text-xs text-gray-400">{client.nameKana} ・ {store?.name}</p>
        </div>
        <Link
          to={`/trainer/clients/${client.id}/session/new`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">セッション記録</span>
          <span className="sm:hidden">記録</span>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="text-lg font-semibold text-gray-800">{monthsActive}</div>
          <div className="text-xs text-gray-400">継続ヶ月</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="text-lg font-semibold text-gray-800">{sessions.length}</div>
          <div className="text-xs text-gray-400">総回数</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="text-lg font-semibold text-gray-800">{thisMonthSessions.length}</div>
          <div className="text-xs text-gray-400">今月</div>
        </div>
        {client.planType === 'ticket' ? (
          <>
            <div className={`bg-white rounded-2xl p-3 shadow-sm border text-center ${remainingTickets !== null && remainingTickets <= 4 ? 'border-orange-200' : 'border-gray-100'}`}>
              <div className={`text-lg font-semibold ${remainingTickets !== null && remainingTickets <= 4 ? 'text-orange-500' : 'text-gray-800'}`}>{remainingTickets}</div>
              <div className="text-xs text-gray-400">残回数</div>
            </div>
            <div className={`bg-white rounded-2xl p-3 shadow-sm border text-center ${daysToExpiry !== null && daysToExpiry <= 30 ? 'border-red-200' : 'border-gray-100'}`}>
              <div className={`text-lg font-semibold ${daysToExpiry !== null && daysToExpiry <= 30 ? 'text-red-500' : 'text-gray-800'}`}>{daysToExpiry}</div>
              <div className="text-xs text-gray-400">残日数</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="text-lg font-semibold text-gray-800">
                {thisMonthSessions.length}/{client.monthlyFrequency}
              </div>
              <div className="text-xs text-gray-400">今月進捗</div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="text-xs font-medium text-gray-600">¥{client.monthlyFee?.toLocaleString()}</div>
              <div className="text-xs text-gray-400">月額</div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#99CEA0] text-[#7ab070]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Personal info */}
                <div className="space-y-3">
                  <h4 className="text-gray-600">基本情報</h4>
                  {[
                    { icon: User, label: '性別', value: client.gender === 'male' ? '男性' : client.gender === 'female' ? '女性' : 'その他' },
                    { icon: Calendar, label: '生年月日', value: client.birthDate || '-' },
                    { icon: Phone, label: '電話番号', value: client.phone || '-' },
                    { icon: Mail, label: 'メール', value: client.email || '-' },
                    { icon: MapPin, label: '住所', value: client.address || '-' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2 text-sm">
                      <item.icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400 w-20 flex-shrink-0">{item.label}</span>
                      <span className="text-gray-700 break-all">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Contract info */}
                <div className="space-y-3">
                  <h4 className="text-gray-600">契約情報</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 w-20">入会日</span>
                    <span className="text-gray-700">{client.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 w-20">プラン</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      client.planType === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {client.planType === 'monthly' ? '月額制' : 'チケット制'}
                    </span>
                  </div>

                  {/* Course info */}
                  {course && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400 w-20">コース</span>
                      <span className="text-[#7ab070] text-xs font-medium">
                        {course.name}（{course.sessionMinutes}分/回）
                      </span>
                    </div>
                  )}

                  {client.planType === 'monthly' ? (
                    <>
                      {showPayments && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 w-24 ml-5">月額料金</span>
                          <span className="text-gray-700">¥{client.monthlyFee?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 w-24 ml-5">月間回数</span>
                        <span className="text-gray-700">{client.monthlyFrequency}回/月</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400 w-20">使用状況</span>
                        <span className="text-gray-700">{client.ticketUsed}/{client.ticketTotal}回</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 ml-5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(((client.ticketUsed || 0) / (client.ticketTotal || 1)) * 100, 100)}%`,
                            background: 'linear-gradient(135deg, #BBD168, #99CEA0)'
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400 w-20">有効期限</span>
                        <span className={`text-gray-700 ${daysToExpiry !== null && daysToExpiry <= 30 ? 'text-red-500' : ''}`}>
                          {client.ticketExpiryDate} ({daysToExpiry}日)
                        </span>
                      </div>
                      {showPayments && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 w-24 ml-5">チケット料金</span>
                          <span className="text-gray-700">¥{client.ticketFee?.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
                    <User size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 w-20">担当TR</span>
                    <span className="text-gray-700">{primaryTrainer?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Payment status - admin/trainer only */}
              {showPayments && (
              <div>
                <h4 className="text-gray-600 mb-3">直近の支払い状況</h4>
                {client.paymentHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">支払い記録なし</p>
                ) : (
                  <div className="space-y-2">
                    {client.paymentHistory.slice().reverse().slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3 text-sm">
                        {p.status === 'paid' ? (
                          <CheckCircle2 size={15} className="text-green-500" />
                        ) : (
                          <AlertCircle size={15} className="text-red-500" />
                        )}
                        <span className="text-gray-600 flex-1">{p.description || p.date}</span>
                        <span className="text-gray-700">¥{p.amount.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {p.status === 'paid' ? '支払済' : '未払い'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Last session preview */}
              {sessions.length > 0 && (
                <div>
                  <h4 className="text-gray-600 mb-3">前回セッション</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">{sessions[0].date}</span>
                      <span className="text-lg">{CONDITION_LABELS[sessions[0].condition]?.emoji}</span>
                      <span className="text-xs text-gray-400">
                        担当: {getTrainerById(sessions[0].trainerId)?.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sessions[0].exercises.map((ex, i) => (
                        <span key={i} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          {ex.exerciseName}
                        </span>
                      ))}
                    </div>
                    {sessions[0].notes && (
                      <p className="text-xs text-gray-500 mt-2">{sessions[0].notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">全{sessions.length}回のセッション</p>
                <Link
                  to={`/trainer/clients/${client.id}/session/new`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                >
                  <Plus size={12} />
                  記録追加
                </Link>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">セッション記録がありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(session => {
                    const trainer = getTrainerById(session.trainerId);
                    const cond = CONDITION_LABELS[session.condition];
                    const isExpanded = expandedSessions.has(session.id);

                    return (
                      <div key={session.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleSession(session.id)}
                        >
                          <span className="text-xl">{cond?.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-700">第{session.sessionNumber}回</span>
                              <span className="text-xs text-gray-500">{session.date}</span>
                              <span className="text-xs text-[#99CEA0]">{trainer?.name}</span>
                            </div>
                            <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-0.5">
                              <span>{session.exercises.length}種目</span>
                              {session.stretchingDone && <span>✅ストレッチ</span>}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                            {session.conditionNotes && (
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-3">
                                💬 {session.conditionNotes}
                              </div>
                            )}
                            {session.stretchingDone && session.stretchingNotes && (
                              <div className="text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2">
                                🧘 {session.stretchingNotes}
                              </div>
                            )}
                            <div className="space-y-2 mt-2">
                              {session.exercises.map((ex, i) => (
                                <div key={i} className="border border-gray-100 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Dumbbell size={13} className="text-[#99CEA0]" />
                                    <span className="text-sm font-medium text-gray-700">{ex.exerciseName}</span>
                                    {ex.isSmithMachine && (
                                      <span className="text-xs bg-[#BBD168]/20 text-[#7ab070] px-1.5 py-0.5 rounded">スミス</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 mb-1 px-1">
                                    <span>セット</span><span>重量</span><span>回数</span>
                                  </div>
                                  {ex.sets.map((set, si) => {
                                    const total = ex.isSmithMachine ? set.weight + (ex.barWeight || 0) : set.weight;
                                    return (
                                      <div key={si} className="grid grid-cols-3 gap-1 text-xs px-1">
                                        <span className="text-gray-500">{set.setNumber}セット</span>
                                        <span className="text-gray-700">
                                          {ex.isSmithMachine ? `${set.weight}+${ex.barWeight}=${total}` : total}kg
                                        </span>
                                        <span className="text-gray-700">{set.reps}回</span>
                                      </div>
                                    );
                                  })}
                                  {ex.notes && <p className="text-xs text-gray-400 mt-2 px-1">{ex.notes}</p>}
                                </div>
                              ))}
                            </div>
                            {session.notes && (
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                📝 {session.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Counseling tab */}
          {activeTab === 'counseling' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700">カウンセリングシート</h3>
                <button
                  onClick={() => {
                    setCounselingForm(client.counselingSheet || {
                      goals: '', healthIssues: '', injuries: '', exerciseHistory: '',
                      currentActivity: '', diet: '', sleepHours: '', stressLevel: '',
                      medications: '', notes: '', completedAt: new Date().toISOString().split('T')[0],
                    });
                    setCounselingModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl border border-[#99CEA0] text-[#7ab070]"
                >
                  <Edit2 size={12} />
                  編集
                </button>
              </div>
              {!client.counselingSheet ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">カウンセリングシート未記入</p>
                  <button onClick={() => setCounselingModal(true)} className="mt-3 text-xs text-[#99CEA0]">記入する</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'トレーニング目標', value: client.counselingSheet.goals },
                    { label: '健康上の問題', value: client.counselingSheet.healthIssues },
                    { label: '怪我・故障歴', value: client.counselingSheet.injuries },
                    { label: '運動歴', value: client.counselingSheet.exerciseHistory },
                    { label: '現在の活動', value: client.counselingSheet.currentActivity },
                    { label: '食事傾向', value: client.counselingSheet.diet },
                    { label: '睡眠時間', value: client.counselingSheet.sleepHours },
                    { label: 'ストレスレベル', value: client.counselingSheet.stressLevel },
                    { label: '服薬', value: client.counselingSheet.medications },
                    { label: 'メモ', value: client.counselingSheet.notes },
                  ].filter(item => item.value).map(item => (
                    <div key={item.label} className="flex gap-3 text-sm">
                      <span className="text-gray-400 w-32 flex-shrink-0">{item.label}</span>
                      <span className="text-gray-700">{item.value}</span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    記入日: {client.counselingSheet.completedAt}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700">トレーナーメモ</h3>
                <button
                  onClick={() => { setNotesValue(client.notes); setEditNotesModal(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl border border-[#99CEA0] text-[#7ab070]"
                >
                  <Edit2 size={12} />
                  編集
                </button>
              </div>
              {client.notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4">{client.notes}</p>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Edit2 className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">メモがありません</p>
                  <button onClick={() => { setNotesValue(''); setEditNotesModal(true); }} className="mt-3 text-xs text-[#99CEA0]">追加する</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Notes Modal */}
      <Modal isOpen={editNotesModal} onClose={() => setEditNotesModal(false)} title="トレーナーメモを編集">
        <div className="space-y-4">
          <textarea
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
            rows={6}
            placeholder="注意事項、引き継ぎ事項など"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditNotesModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">キャンセル</button>
            <button onClick={handleSaveNotes} className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>保存</button>
          </div>
        </div>
      </Modal>

      {/* Counseling Modal */}
      <Modal isOpen={counselingModal} onClose={() => setCounselingModal(false)} title="カウンセリングシートを編集" size="lg">
        <div className="space-y-4">
          {[
            { field: 'goals', label: 'トレーニング目標', placeholder: 'ダイエット、筋力アップなど' },
            { field: 'healthIssues', label: '健康上の問題', placeholder: '持病、通院中など' },
            { field: 'injuries', label: '怪我・故障歴', placeholder: '腰痛、膝痛など' },
            { field: 'exerciseHistory', label: '運動歴', placeholder: '学生時代のスポーツなど' },
            { field: 'currentActivity', label: '現在の活動', placeholder: '週1ジムなど' },
            { field: 'diet', label: '食事傾向', placeholder: '外食多め、野菜不足など' },
            { field: 'sleepHours', label: '睡眠時間', placeholder: '7時間' },
            { field: 'stressLevel', label: 'ストレスレベル', placeholder: '高め・中程度・低め' },
            { field: 'medications', label: '服薬', placeholder: 'なし、降圧剤など' },
            { field: 'notes', label: 'メモ', placeholder: 'その他備考' },
          ].map(item => (
            <div key={item.field}>
              <label className="block text-sm text-gray-600 mb-1">{item.label}</label>
              <input
                value={(counselingForm as any)[item.field]}
                onChange={e => setCounselingForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
                placeholder={item.placeholder}
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCounselingModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">キャンセル</button>
            <button onClick={handleSaveCounseling} className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}>保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}