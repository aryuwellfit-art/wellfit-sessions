export type UserRole = 'admin' | 'area_manager' | 'trainer';
export type PlanType = 'monthly' | 'ticket';
export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'other';
export type ConditionLevel = 1 | 2 | 3 | 4 | 5;
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type MachineType = 'smith' | 'cable' | 'free_weight' | 'plate_loaded' | 'selectorized' | 'other';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  barWeight?: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  machines: Machine[];
  active: boolean;
  createdAt: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  storeIds: string[];
  active: boolean;
  createdAt: string;
  memo?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  notes: string;
}

export interface CounselingSheet {
  goals: string;
  healthIssues: string;
  injuries: string;
  exerciseHistory: string;
  currentActivity: string;
  diet: string;
  sleepHours: string;
  stressLevel: string;
  medications: string;
  notes: string;
  completedAt: string;
}

/** コース定義 */
export interface Course {
  id: string;
  name: string;
  sessionMinutes: number;      // 1回あたりのセッション時間（分）
  totalSessions?: number;      // チケット/集中コースの総回数
  monthlyCount?: number;       // 月額コースの月間回数
  planType: 'monthly' | 'ticket' | 'intensive' | 'nano';
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  nameKana: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  storeId: string;
  primaryTrainerId: string;
  startDate: string;
  planType: PlanType;
  courseId?: string;           // NEW: 受講コース
  // Monthly plan
  monthlyFee?: number;
  monthlyFrequency?: number;
  // Ticket plan
  ticketTotal?: number;
  ticketUsed?: number;
  ticketStartDate?: string;
  ticketExpiryDate?: string;
  ticketFee?: number;
  // Common
  paymentHistory: Payment[];
  counselingSheet?: CounselingSheet;
  notes: string;
  active: boolean;
  createdAt: string;
}

export interface SetRecord {
  setNumber: number;
  weight: number;
  reps: number;
  assistReps?: number;         // NEW: 補助回数
  assistMemo?: string;         // NEW: 補助メモ（ネガティブあり等）
  completed: boolean;
}

export interface ExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  isSmithMachine: boolean;
  barWeight?: number;
  sets: SetRecord[];
  notes: string;
}

export interface Session {
  id: string;
  clientId: string;
  trainerId: string;
  storeId: string;
  date: string;
  sessionNumber: number;
  courseId?: string;                  // NEW: セッション時のコース
  sessionDurationMinutes?: number;    // NEW: セッション時間（分）- コースから自動設定
  condition: ConditionLevel;
  conditionNotes: string;
  stretchingDone: boolean;
  stretchingNotes: string;
  exercises: ExerciseRecord[];
  notes: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  bodyPart: string;
  isSmithMachineCompatible: boolean;
  defaultBarWeight?: number;
  notes?: string;
}

export interface AppState {
  stores: Store[];
  trainers: Trainer[];
  clients: Client[];
  sessions: Session[];
  exercises: Exercise[];
  courses: Course[];
}

/** 月次集計: トレーナー別 */
export interface TrainerMonthlyStat {
  trainerId: string;
  trainerName: string;
  role: UserRole;
  storeIds: string[];
  sessionCount: number;
  totalMinutes: number;
}

/** 月次集計: 店舗別 */
export interface StoreMonthlyStat {
  storeId: string;
  storeName: string;
  sessionCount: number;
  uniqueClientCount: number;
  totalMinutes: number;
}

/** 未訪問アラート */
export interface InactiveClientAlert {
  clientId: string;
  clientName: string;
  storeId: string;
  primaryTrainerId: string;
  lastVisitDate: string;
  daysSince: number;
}
