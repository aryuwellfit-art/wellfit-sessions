import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Clock } from 'lucide-react';
import { ExerciseRecord, SetRecord, ConditionLevel, Session } from '../../types';

const CONDITION_OPTIONS: { value: ConditionLevel; label: string; emoji: string; color: string }[] = [
  { value: 1, label: '不調', emoji: '😔', color: 'border-red-400 bg-red-50 text-red-600' },
  { value: 2, label: 'やや不調', emoji: '😕', color: 'border-orange-400 bg-orange-50 text-orange-600' },
  { value: 3, label: '普通', emoji: '😐', color: 'border-yellow-400 bg-yellow-50 text-yellow-600' },
  { value: 4, label: '好調', emoji: '😊', color: 'border-green-400 bg-green-50 text-green-600' },
  { value: 5, label: '絶好調', emoji: '😄', color: 'border-emerald-400 bg-emerald-50 text-emerald-600' },
];

const ASSIST_PRESETS = ['補助なし', 'ネガティブあり', '補助あり', '強補助'];

/** 直近の前回記録を返す（同顧客・同種目） */
function getPrevRecord(
  sessions: Session[],
  clientId: string,
  exerciseId: string
): ExerciseRecord | null {
  const sorted = sessions
    .filter(s => s.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const found = session.exercises.find(e => e.exerciseId === exerciseId);
    if (found) return found;
  }
  return null;
}

export default function SessionForm() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { getClientById, exercises, sessions, addSession, getClientSessions, currentUser, updateClient, getCourseById } = useApp();

  const client = getClientById(clientId!);
  const allSessions = getClientSessions(clientId!);
  const nextSessionNumber = allSessions.length + 1;

  const course = client?.courseId ? getCourseById(client.courseId) : undefined;

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    condition: 3 as ConditionLevel,
    conditionNotes: '',
    stretchingDone: true,
    stretchingNotes: '',
    notes: '',
  });

  const [selectedExercises, setSelectedExercises] = useState<ExerciseRecord[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set([0]));

  // Build prev records map: exerciseId → ExerciseRecord
  const prevRecordsMap = useMemo(() => {
    const map: Record<string, ExerciseRecord> = {};
    for (const ex of selectedExercises) {
      const prev = getPrevRecord(sessions, clientId!, ex.exerciseId);
      if (prev) map[ex.exerciseId] = prev;
    }
    return map;
  }, [selectedExercises, sessions, clientId]);

  const addExercise = (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const prev = getPrevRecord(sessions, clientId!, exerciseId);
    const newRecord: ExerciseRecord = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      isSmithMachine: false,
      barWeight: ex.defaultBarWeight,
      sets: [{ setNumber: 1, weight: prev?.sets[0]?.weight || 0, reps: prev?.sets[0]?.reps || 10, completed: true }],
      notes: '',
    };
    setSelectedExercises(prev => {
      const next = [...prev, newRecord];
      setExpandedExercises(prev2 => new Set([...prev2, next.length - 1]));
      return next;
    });
    setShowExerciseSelector(false);
  };

  const removeExercise = (idx: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, data: Partial<ExerciseRecord>) => {
    setSelectedExercises(prev => prev.map((e, i) => i === idx ? { ...e, ...data } : e));
  };

  const addSet = (exIdx: number) => {
    setSelectedExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      const lastSet = e.sets[e.sets.length - 1];
      const newSet: SetRecord = {
        setNumber: e.sets.length + 1,
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 10,
        completed: true,
      };
      return { ...e, sets: [...e.sets, newSet] };
    }));
  };

  const updateSet = (exIdx: number, setIdx: number, data: Partial<SetRecord>) => {
    setSelectedExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, ...data } : s) };
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setSelectedExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.filter((_, j) => j !== setIdx).map((s, j) => ({ ...s, setNumber: j + 1 })) };
    }));
  };

  const toggleExpanded = (idx: number) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !currentUser) return;

    await addSession({
      clientId: client.id,
      trainerId: currentUser.id,
      storeId: client.storeId,
      date: form.date,
      sessionNumber: nextSessionNumber,
      courseId: client.courseId,
      sessionDurationMinutes: course?.sessionMinutes,
      condition: form.condition,
      conditionNotes: form.conditionNotes,
      stretchingDone: form.stretchingDone,
      stretchingNotes: form.stretchingNotes,
      exercises: selectedExercises,
      notes: form.notes,
    });

    if (client.planType === 'ticket') {
      await updateClient(client.id, { ticketUsed: (client.ticketUsed || 0) + 1 });
    }

    navigate(`/trainer/clients/${clientId}`);
  };

  const exerciseForRecord = (record: ExerciseRecord) => exercises.find(e => e.id === record.exerciseId);

  if (!client) return <div className="text-center py-8 text-gray-400">顧客が見つかりません</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-gray-800">セッション記録</h1>
          <p className="text-sm text-gray-500">
            {client.name} ・ 第{nextSessionNumber}回目
            {course && (
              <span className="ml-2 text-xs bg-[#BBD168]/20 text-[#7ab070] px-2 py-0.5 rounded-full">
                <Clock size={10} className="inline mr-0.5" />
                {course.name} ({course.sessionMinutes}分)
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date & Condition */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-gray-700">基本情報</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">日付 *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">体調 *</label>
            <div className="flex gap-2 flex-wrap">
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, condition: opt.value }))}
                  className={`flex-1 min-w-[60px] py-2.5 rounded-xl border-2 transition-all text-center ${
                    form.condition === opt.value ? opt.color : 'border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="text-lg leading-none">{opt.emoji}</div>
                  <div className="text-xs mt-1">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">体調メモ</label>
            <input
              value={form.conditionNotes}
              onChange={e => setForm(prev => ({ ...prev, conditionNotes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="疲れ気味、気分が優れないなど"
            />
          </div>
        </div>

        {/* Stretching */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-gray-700 flex-1">ストレッチ</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, stretchingDone: true }))}
                className={`px-4 py-1.5 rounded-xl text-sm border-2 transition-colors ${
                  form.stretchingDone ? 'border-green-400 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'
                }`}
              >
                実施あり
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, stretchingDone: false }))}
                className={`px-4 py-1.5 rounded-xl text-sm border-2 transition-colors ${
                  !form.stretchingDone ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-400'
                }`}
              >
                なし
              </button>
            </div>
          </div>
          {form.stretchingDone && (
            <input
              value={form.stretchingNotes}
              onChange={e => setForm(prev => ({ ...prev, stretchingNotes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm"
              placeholder="ストレッチ内容・部位など"
            />
          )}
        </div>

        {/* Exercises */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700">トレーニング種目</h3>
            <button
              type="button"
              onClick={() => setShowExerciseSelector(!showExerciseSelector)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
            >
              <Plus size={14} />
              種目追加
            </button>
          </div>

          {showExerciseSelector && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2">種目を選択</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {exercises.map(ex => {
                  const prev = getPrevRecord(sessions, clientId!, ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => addExercise(ex.id)}
                      className="text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#99CEA0] text-sm text-gray-700 transition-colors"
                    >
                      <div className="text-xs font-medium truncate">{ex.name}</div>
                      {ex.isSmithMachineCompatible && <div className="text-xs text-[#99CEA0]">スミス対応</div>}
                      {prev && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          前回: {prev.sets[prev.sets.length - 1]?.weight}kg×{prev.sets[prev.sets.length - 1]?.reps}回
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedExercises.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Dumbbell className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">種目を追加してください</p>
            </div>
          )}

          <div className="space-y-4">
            {selectedExercises.map((record, exIdx) => {
              const ex = exerciseForRecord(record);
              const isExpanded = expandedExercises.has(exIdx);
              const prevRecord = prevRecordsMap[record.exerciseId];

              return (
                <div key={exIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Exercise header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpanded(exIdx)}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
                    >
                      <Dumbbell size={13} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">{record.exerciseName}</span>
                    <span className="text-xs text-gray-400">{record.sets.length}セット</span>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeExercise(exIdx); }}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {/* Previous record indicator */}
                      {prevRecord && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp size={12} className="text-blue-400" />
                            <span className="text-xs text-blue-500 font-medium">前回の記録</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {prevRecord.sets.map((s, si) => {
                              const totalW = prevRecord.isSmithMachine ? s.weight + (prevRecord.barWeight || 0) : s.weight;
                              return (
                                <span key={si} className="text-xs text-blue-400 bg-white px-2 py-0.5 rounded border border-blue-100">
                                  {s.setNumber}セット: {totalW}kg × {s.reps}回
                                  {s.assistReps ? ` (+${s.assistReps}補助)` : ''}
                                </span>
                              );
                            })}
                          </div>
                          {prevRecord.notes && (
                            <p className="text-xs text-blue-400 mt-1 opacity-70">{prevRecord.notes}</p>
                          )}
                        </div>
                      )}

                      {/* Smith machine toggle */}
                      {ex?.isSmithMachineCompatible && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">スミスマシン使用:</span>
                          <button
                            type="button"
                            onClick={() => updateExercise(exIdx, { isSmithMachine: !record.isSmithMachine })}
                            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                              record.isSmithMachine
                                ? 'border-[#99CEA0] bg-[#99CEA0]/10 text-[#7ab070]'
                                : 'border-gray-200 text-gray-400'
                            }`}
                          >
                            {record.isSmithMachine ? 'ON' : 'OFF'}
                          </button>
                          {record.isSmithMachine && (
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="text-xs text-gray-400">バー重量:</span>
                              <input
                                type="number"
                                value={record.barWeight || ''}
                                onChange={e => updateExercise(exIdx, { barWeight: Number(e.target.value) })}
                                className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#99CEA0]"
                                min="0"
                              />
                              <span className="text-xs text-gray-400">kg</span>
                            </div>
                          )}
                        </div>
                      )}

                      {record.isSmithMachine && (
                        <div className="text-xs text-[#7ab070] bg-[#BBD168]/10 px-3 py-2 rounded-lg">
                          ※ 以下の重量はバーを除いた追加重量で入力してください（合計 = 追加重量 + バー{record.barWeight}kg）
                        </div>
                      )}

                      {/* Sets */}
                      <div>
                        {/* Column headers */}
                        <div className="grid grid-cols-12 gap-1 mb-1.5 text-xs text-gray-400 px-1">
                          <div className="col-span-2">セット</div>
                          <div className="col-span-3">重量(kg){record.isSmithMachine ? '*' : ''}</div>
                          <div className="col-span-2">回数</div>
                          <div className="col-span-3">補助回数</div>
                          <div className="col-span-2">合計</div>
                        </div>

                        <div className="space-y-2">
                          {record.sets.map((set, setIdx) => {
                            const totalWeight = record.isSmithMachine
                              ? set.weight + (record.barWeight || 0)
                              : set.weight;

                            // Compare with prev record
                            const prevSet = prevRecord?.sets[setIdx];
                            const prevTotalW = prevSet
                              ? (prevRecord!.isSmithMachine ? prevSet.weight + (prevRecord!.barWeight || 0) : prevSet.weight)
                              : null;
                            const isWeightUp = prevTotalW !== null && totalWeight > prevTotalW;
                            const isRepsUp = prevSet !== null && prevSet !== undefined && set.reps > (prevSet.reps || 0);

                            return (
                              <div key={setIdx} className="space-y-1">
                                <div className="grid grid-cols-12 gap-1 items-center">
                                  <div className="col-span-2 text-xs text-gray-500 font-medium pl-1">
                                    {set.setNumber}
                                  </div>
                                  <div className="col-span-3 relative">
                                    <input
                                      type="number"
                                      value={set.weight || ''}
                                      onChange={e => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                                      className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none text-center transition-colors ${
                                        isWeightUp ? 'border-[#BBD168] bg-[#BBD168]/5 focus:border-[#99CEA0]' : 'border-gray-200 focus:border-[#99CEA0]'
                                      }`}
                                      min="0"
                                      step="0.5"
                                      placeholder="0"
                                    />
                                    {isWeightUp && (
                                      <span className="absolute -top-1 -right-1 text-[9px] bg-[#BBD168] text-white rounded-full px-1 leading-tight">↑</span>
                                    )}
                                  </div>
                                  <div className="col-span-2 relative">
                                    <input
                                      type="number"
                                      value={set.reps || ''}
                                      onChange={e => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                                      className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none text-center transition-colors ${
                                        isRepsUp ? 'border-[#BBD168] bg-[#BBD168]/5 focus:border-[#99CEA0]' : 'border-gray-200 focus:border-[#99CEA0]'
                                      }`}
                                      min="0"
                                      placeholder="0"
                                    />
                                    {isRepsUp && (
                                      <span className="absolute -top-1 -right-1 text-[9px] bg-[#BBD168] text-white rounded-full px-1 leading-tight">↑</span>
                                    )}
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="number"
                                      value={set.assistReps || ''}
                                      onChange={e => updateSet(exIdx, setIdx, { assistReps: Number(e.target.value) || undefined })}
                                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#99CEA0] text-center"
                                      min="0"
                                      placeholder="-"
                                    />
                                  </div>
                                  <div className="col-span-2 flex items-center gap-1 pl-1">
                                    <span className={`text-xs font-medium ${isWeightUp ? 'text-[#7ab070]' : 'text-gray-600'}`}>
                                      {totalWeight}kg
                                    </span>
                                    {record.sets.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeSet(exIdx, setIdx)}
                                        className="ml-auto text-gray-300 hover:text-red-400 flex-shrink-0"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Prev reference row */}
                                {prevSet && (
                                  <div className="grid grid-cols-12 gap-1 px-1">
                                    <div className="col-span-2" />
                                    <div className="col-span-3 text-center text-xs text-gray-300">
                                      {prevRecord!.isSmithMachine ? prevSet.weight + (prevRecord!.barWeight || 0) : prevSet.weight}
                                    </div>
                                    <div className="col-span-2 text-center text-xs text-gray-300">{prevSet.reps}</div>
                                    <div className="col-span-3 text-center text-xs text-gray-300">
                                      {prevSet.assistReps ? `+${prevSet.assistReps}` : ''}
                                    </div>
                                    <div className="col-span-2 text-xs text-gray-300 pl-1">前回</div>
                                  </div>
                                )}

                                {/* Assist memo per set */}
                                {(set.assistReps && set.assistReps > 0) && (
                                  <div className="pl-2">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                      {ASSIST_PRESETS.filter(p => p !== '補助なし').map(preset => (
                                        <button
                                          key={preset}
                                          type="button"
                                          onClick={() => updateSet(exIdx, setIdx, {
                                            assistMemo: set.assistMemo === preset ? undefined : preset
                                          })}
                                          className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${
                                            set.assistMemo === preset
                                              ? 'border-orange-300 bg-orange-50 text-orange-600'
                                              : 'border-gray-200 text-gray-400 hover:border-orange-200'
                                          }`}
                                        >
                                          {preset}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => addSet(exIdx)}
                          className="mt-2 text-xs text-[#99CEA0] hover:text-[#7ab070] flex items-center gap-1"
                        >
                          <Plus size={12} />
                          セットを追加
                        </button>
                      </div>

                      <div>
                        <input
                          value={record.notes}
                          onChange={e => updateExercise(exIdx, { notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#99CEA0]"
                          placeholder="メモ（フォーム、感覚など）"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-gray-700 mb-3">セッションメモ</h3>
          <textarea
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] text-sm resize-none"
            rows={3}
            placeholder="セッション全体の所感、次回への引き継ぎなど"
          />
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
            セッションを保存
          </button>
        </div>
      </form>
    </div>
  );
}
