import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Store, Trainer, Client, Session, Exercise, Payment, Course } from '../types';
import { supabase } from '@/lib/supabase';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface AppContextType extends AppState {
  currentUser: Trainer | null;
  loading: boolean;
  error: string | null;
  // Auth
  login: (email: string, password: string) => Promise<Trainer | null>;
  logout: () => void;
  // Stores
  addStore: (store: Omit<Store, 'id' | 'createdAt'>) => Promise<void>;
  updateStore: (id: string, data: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  // Trainers
  addTrainer: (trainer: Omit<Trainer, 'id' | 'createdAt'>) => Promise<void>;
  updateTrainer: (id: string, data: Partial<Trainer>) => Promise<void>;
  deleteTrainer: (id: string) => Promise<void>;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Sessions
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => Promise<void>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  // Exercises
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  updateExercise: (id: string, data: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  // Courses
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  // Payments
  addPayment: (clientId: string, payment: Omit<Payment, 'id' | 'clientId'>) => Promise<void>;
  updatePayment: (clientId: string, paymentId: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (clientId: string, paymentId: string) => Promise<void>;
  // Helpers
  getClientSessions: (clientId: string) => Session[];
  getThisMonthSessions: (clientId: string) => Session[];
  getStoreById: (id: string) => Store | undefined;
  getTrainerById: (id: string) => Trainer | undefined;
  getClientById: (id: string) => Client | undefined;
  getCourseById: (id: string) => Course | undefined;
  refetch: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const SESSION_UID_KEY = 'fitlab_uid';
const SESSION_ROLE_KEY = 'fitlab_role';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    stores: [], trainers: [], clients: [], sessions: [], exercises: [], courses: [],
  });
  const [currentUser, setCurrentUser] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: stores },
        { data: trainers },
        { data: clientsRaw },
        { data: sessionsRaw },
        { data: exercisesRaw },
        { data: courses }
      ] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('trainers').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('sessions').select('*'),
        supabase.from('exercises').select('*'),
        supabase.from('courses').select('*'),
      ]);

      // Mappings
      const clients: Client[] = (clientsRaw || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        nameKana: c.name_kana,
        birthDate: c.birth_date,
        gender: c.gender,
        phone: c.phone,
        email: c.email,
        address: c.address,
        storeId: c.store_id,
        primaryTrainerId: c.primary_trainer_id,
        startDate: c.start_date,
        planType: c.plan_type,
        courseId: c.course_id,
        monthlyFee: c.monthly_fee,
        monthlyFrequency: c.monthly_frequency,
        ticketTotal: c.ticket_total,
        ticketUsed: c.ticket_used,
        ticketStartDate: c.ticket_start_date,
        ticketExpiryDate: c.ticket_expiry_date,
        ticketFee: c.ticket_fee,
        paymentHistory: c.payment_history || [],
        counselingSheet: c.counseling_sheet,
        notes: c.notes,
        active: c.active,
        createdAt: c.created_at,
      }));

      const sessions: Session[] = (sessionsRaw || []).map((s: any) => ({
        id: s.id,
        clientId: s.client_id,
        trainerId: s.trainer_id,
        storeId: s.store_id,
        date: s.date,
        sessionNumber: s.session_number,
        courseId: s.course_id,
        sessionDurationMinutes: s.session_duration_minutes,
        condition: s.condition,
        conditionNotes: s.condition_notes,
        stretchingDone: s.stretching_done,
        stretchingNotes: s.stretching_notes,
        exercises: s.exercises || [],
        notes: s.notes,
        createdAt: s.created_at,
      }));

      const exercises: Exercise[] = (exercisesRaw || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        bodyPart: e.body_part,
        isSmithMachineCompatible: e.is_smith_machine_compatible,
        defaultBarWeight: e.default_bar_weight,
        notes: e.notes,
      }));

      const trainersMapped: Trainer[] = (trainers || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        password: t.password,
        role: t.role,
        storeIds: t.store_ids || [],
        active: t.active,
        createdAt: t.created_at,
        memo: t.memo,
      }));

      const storesMapped: Store[] = (stores || []).map((s: any) => ({
        ...s,
        createdAt: s.created_at,
      }));

      setState({
        stores: storesMapped,
        trainers: trainersMapped,
        clients,
        sessions,
        exercises,
        courses: courses || [],
      });

      // Restore current user
      const uid = sessionStorage.getItem(SESSION_UID_KEY);
      if (uid) {
        const user = trainersMapped.find(t => t.id === uid);
        if (user) setCurrentUser(user);
      }
    } catch (e: any) {
      console.error('fetchAll error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  // ===== Auth =====
  const login = useCallback(async (email: string, password: string): Promise<Trainer | null> => {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('active', true)
      .single();

    if (error || !data) return null;
    const trainer = data as Trainer;
    setCurrentUser(trainer);
    sessionStorage.setItem(SESSION_UID_KEY, trainer.id);
    sessionStorage.setItem(SESSION_ROLE_KEY, trainer.role);
    return trainer;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_UID_KEY);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
  }, []);

  // ===== Stores =====
  const addStore = useCallback(async (store: Omit<Store, 'id' | 'createdAt'>) => {
    const id = generateId();
    const created_at = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('stores')
      .insert([{ ...store, id, created_at }])
      .select()
      .single();
    if (error) throw error;
    setState(prev => ({ ...prev, stores: [...prev.stores, data as Store] }));
  }, []);

  const updateStore = useCallback(async (id: string, data: Partial<Store>) => {
    const { data: updated, error } = await supabase
      .from('stores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setState(prev => ({ ...prev, stores: prev.stores.map(s => s.id === id ? updated as Store : s) }));
  }, []);

  const deleteStore = useCallback(async (id: string) => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, stores: prev.stores.filter(s => s.id !== id) }));
  }, []);

  // ===== Trainers =====
  const addTrainer = useCallback(async (trainer: Omit<Trainer, 'id' | 'createdAt'>) => {
    const id = generateId();
    const created_at = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('trainers')
      .insert([{
        id,
        name: trainer.name,
        email: trainer.email,
        password: trainer.password,
        role: trainer.role,
        store_ids: trainer.storeIds,
        active: trainer.active,
        memo: trainer.memo,
        created_at
      }])
      .select()
      .single();
    if (error) throw error;
    setState(prev => ({ ...prev, trainers: [...prev.trainers, data as Trainer] }));
  }, []);

  const updateTrainer = useCallback(async (id: string, data: Partial<Trainer>) => {
    const updateData: any = { ...data };
    if (data.storeIds) {
      updateData.store_ids = data.storeIds;
      delete updateData.storeIds;
    }
    const { data: updated, error } = await supabase
      .from('trainers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const trainer = updated as Trainer;
    setState(prev => ({ ...prev, trainers: prev.trainers.map(t => t.id === id ? trainer : t) }));
    if (currentUser?.id === id) setCurrentUser(trainer);
  }, [currentUser]);

  const deleteTrainer = useCallback(async (id: string) => {
    const { error } = await supabase.from('trainers').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, trainers: prev.trainers.filter(t => t.id !== id) }));
  }, []);

  // ===== Clients =====
  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const id = generateId();
    const created_at = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        id,
        name: client.name,
        name_kana: client.nameKana,
        birth_date: client.birthDate,
        gender: client.gender,
        phone: client.phone,
        email: client.email,
        address: client.address,
        store_id: client.storeId,
        primary_trainer_id: client.primaryTrainerId,
        start_date: client.startDate,
        plan_type: client.planType,
        course_id: client.courseId,
        monthly_fee: client.monthlyFee,
        monthly_frequency: client.monthlyFrequency,
        ticket_total: client.ticketTotal,
        ticket_used: client.ticketUsed,
        ticket_start_date: client.ticketStartDate,
        ticket_expiry_date: client.ticketExpiryDate,
        ticket_fee: client.ticketFee,
        payment_history: client.paymentHistory,
        counseling_sheet: client.counselingSheet,
        notes: client.notes,
        active: client.active,
        created_at
      }])
      .select()
      .single();
    if (error) throw error;
    fetchAll(); // Refresh to get mapped data
  }, [fetchAll]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    const mapping: any = { ...data };
    if (data.nameKana) { mapping.name_kana = data.nameKana; delete mapping.nameKana; }
    if (data.birthDate) { mapping.birth_date = data.birthDate; delete mapping.birthDate; }
    if (data.storeId) { mapping.store_id = data.storeId; delete mapping.storeId; }
    if (data.primaryTrainerId) { mapping.primary_trainer_id = data.primaryTrainerId; delete mapping.primaryTrainerId; }
    if (data.startDate) { mapping.start_date = data.startDate; delete mapping.startDate; }
    if (data.planType) { mapping.plan_type = data.planType; delete mapping.planType; }
    if (data.courseId) { mapping.course_id = data.courseId; delete mapping.courseId; }
    if (data.monthlyFee) { mapping.monthly_fee = data.monthlyFee; delete mapping.monthlyFee; }
    if (data.monthlyFrequency) { mapping.monthly_frequency = data.monthlyFrequency; delete mapping.monthlyFrequency; }
    if (data.ticketTotal) { mapping.ticket_total = data.ticketTotal; delete mapping.ticketTotal; }
    if (data.ticketUsed) { mapping.ticket_used = data.ticketUsed; delete mapping.ticketUsed; }
    if (data.ticketStartDate) { mapping.ticket_start_date = data.ticketStartDate; delete mapping.ticketStartDate; }
    if (data.ticketExpiryDate) { mapping.ticket_expiry_date = data.ticketExpiryDate; delete mapping.ticketExpiryDate; }
    if (data.ticketFee) { mapping.ticket_fee = data.ticketFee; delete mapping.ticketFee; }
    if (data.paymentHistory) { mapping.payment_history = data.paymentHistory; delete mapping.paymentHistory; }
    if (data.counselingSheet) { mapping.counseling_sheet = data.counselingSheet; delete mapping.counselingSheet; }

    const { error } = await supabase.from('clients').update(mapping).eq('id', id);
    if (error) throw error;
    fetchAll();
  }, [fetchAll]);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
  }, []);

  // ===== Sessions =====
  const addSession = useCallback(async (session: Omit<Session, 'id' | 'createdAt'>) => {
    const id = generateId();
    const { error } = await supabase
      .from('sessions')
      .insert([{
        id,
        client_id: session.clientId,
        trainer_id: session.trainerId,
        store_id: session.storeId,
        date: session.date,
        session_number: session.sessionNumber,
        course_id: session.courseId,
        session_duration_minutes: session.sessionDurationMinutes,
        condition: session.condition,
        condition_notes: session.conditionNotes,
        stretching_done: session.stretchingDone,
        stretching_notes: session.stretchingNotes,
        exercises: session.exercises,
        notes: session.notes
      }]);
    if (error) throw error;
    fetchAll();
  }, [fetchAll]);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    const mapping: any = { ...data };
    if (data.clientId) { mapping.client_id = data.clientId; delete mapping.clientId; }
    if (data.trainerId) { mapping.trainer_id = data.trainerId; delete mapping.trainerId; }
    if (data.storeId) { mapping.store_id = data.storeId; delete mapping.storeId; }
    if (data.sessionNumber) { mapping.session_number = data.sessionNumber; delete mapping.sessionNumber; }
    if (data.courseId) { mapping.course_id = data.courseId; delete mapping.courseId; }
    if (data.sessionDurationMinutes) { mapping.session_duration_minutes = data.sessionDurationMinutes; delete mapping.sessionDurationMinutes; }
    if (data.conditionNotes) { mapping.condition_notes = data.conditionNotes; delete mapping.conditionNotes; }
    if (data.stretchingDone) { mapping.stretching_done = data.stretchingDone; delete mapping.stretchingDone; }
    if (data.stretchingNotes) { mapping.stretching_notes = data.stretchingNotes; delete mapping.stretchingNotes; }

    const { error } = await supabase.from('sessions').update(mapping).eq('id', id);
    if (error) throw error;
    fetchAll();
  }, [fetchAll]);

  const deleteSession = useCallback(async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
  }, []);

  // ===== Exercises =====
  const addExercise = useCallback(async (exercise: Omit<Exercise, 'id'>) => {
    const id = generateId();
    const { data: created, error } = await supabase
      .from('exercises')
      .insert([{
        id,
        name: exercise.name,
        category: exercise.category,
        body_part: exercise.bodyPart,
        is_smith_machine_compatible: exercise.isSmithMachineCompatible,
        default_bar_weight: exercise.defaultBarWeight,
        notes: exercise.notes
      }])
      .select()
      .single();
    if (error) throw error;
    fetchAll();
  }, [fetchAll]);

  const updateExercise = useCallback(async (id: string, data: Partial<Exercise>) => {
    const mapping: any = { ...data };
    if (data.bodyPart) { mapping.body_part = data.bodyPart; delete mapping.bodyPart; }
    if (data.isSmithMachineCompatible) { mapping.is_smith_machine_compatible = data.isSmithMachineCompatible; delete mapping.isSmithMachineCompatible; }
    if (data.defaultBarWeight) { mapping.default_bar_weight = data.defaultBarWeight; delete mapping.defaultBarWeight; }

    const { error } = await supabase.from('exercises').update(mapping).eq('id', id);
    if (error) throw error;
    fetchAll();
  }, [fetchAll]);

  const deleteExercise = useCallback(async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== id) }));
  }, []);

  // ===== Courses =====
  const addCourse = useCallback(async (course: Omit<Course, 'id'>) => {
    const id = generateId();
    const { data: created, error } = await supabase
      .from('courses')
      .insert([{
        id,
        name: course.name,
        session_minutes: course.sessionMinutes,
        total_sessions: course.totalSessions,
        monthly_count: course.monthlyCount,
        plan_type: course.planType,
        active: course.active
      }])
      .select()
      .single();
    if (error) throw error;
    setState(prev => ({ ...prev, courses: [...prev.courses, created as Course] }));
  }, []);

  const updateCourse = useCallback(async (id: string, data: Partial<Course>) => {
    const mapping: any = { ...data };
    if (data.sessionMinutes) { mapping.session_minutes = data.sessionMinutes; delete mapping.sessionMinutes; }
    if (data.totalSessions) { mapping.total_sessions = data.totalSessions; delete mapping.totalSessions; }
    if (data.monthlyCount) { mapping.monthly_count = data.monthlyCount; delete mapping.monthlyCount; }
    if (data.planType) { mapping.plan_type = data.planType; delete mapping.planType; }

    const { data: updated, error } = await supabase
      .from('courses')
      .update(mapping)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setState(prev => ({ ...prev, courses: prev.courses.map(c => c.id === id ? updated as Course : c) }));
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
    setState(prev => ({ ...prev, courses: prev.courses.filter(c => c.id !== id) }));
  }, []);

  // ===== Payments (embedded in client) =====
  const addPayment = useCallback(async (clientId: string, payment: Omit<Payment, 'id' | 'clientId'>) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    const newPayment: Payment = { ...payment, id: generateId(), clientId };
    const updatedHistory = [...client.paymentHistory, newPayment];
    await updateClient(clientId, { paymentHistory: updatedHistory });
  }, [state.clients, updateClient]);

  const updatePayment = useCallback(async (clientId: string, paymentId: string, data: Partial<Payment>) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedHistory = client.paymentHistory.map(p => p.id === paymentId ? { ...p, ...data } : p);
    await updateClient(clientId, { paymentHistory: updatedHistory });
  }, [state.clients, updateClient]);

  const deletePayment = useCallback(async (clientId: string, paymentId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedHistory = client.paymentHistory.filter(p => p.id !== paymentId);
    await updateClient(clientId, { paymentHistory: updatedHistory });
  }, [state.clients, updateClient]);

  // ===== Helpers =====
  const getClientSessions = useCallback((clientId: string) => {
    return state.sessions.filter(s => s.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.sessions]);

  const getThisMonthSessions = useCallback((clientId: string) => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return state.sessions.filter(s => s.clientId === clientId && s.date.startsWith(prefix));
  }, [state.sessions]);

  const getStoreById = useCallback((id: string) => state.stores.find(s => s.id === id), [state.stores]);
  const getTrainerById = useCallback((id: string) => state.trainers.find(t => t.id === id), [state.trainers]);
  const getClientById = useCallback((id: string) => state.clients.find(c => c.id === id), [state.clients]);
  const getCourseById = useCallback((id: string) => state.courses.find(c => c.id === id), [state.courses]);

  const value: AppContextType = {
    ...state,
    currentUser,
    loading,
    error,
    login, logout,
    addStore, updateStore, deleteStore,
    addTrainer, updateTrainer, deleteTrainer,
    addClient, updateClient, deleteClient,
    addSession, updateSession, deleteSession,
    addExercise, updateExercise, deleteExercise,
    addCourse, updateCourse, deleteCourse,
    addPayment, updatePayment, deletePayment,
    getClientSessions, getThisMonthSessions,
    getStoreById, getTrainerById, getClientById, getCourseById,
    refetch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
