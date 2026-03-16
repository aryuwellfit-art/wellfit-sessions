-- 1. テーブルの削除（初期化用）
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS courses;

-- 2. テーブル作成
-- 種目マスタ
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  body_part TEXT,
  is_smith_machine_compatible BOOLEAN DEFAULT false,
  default_bar_weight NUMERIC,
  notes TEXT
);

-- コース定義
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  session_minutes INTEGER,
  total_sessions INTEGER,
  monthly_count INTEGER,
  plan_type TEXT,
  active BOOLEAN DEFAULT true
);

-- 店舗
CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  machines JSONB, -- マシンリストをJSONで保持
  active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);

-- トレーナー
CREATE TABLE trainers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  store_ids TEXT[], -- 配列形式
  active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE,
  memo TEXT
);

-- 顧客
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_kana TEXT,
  birth_date DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  store_id TEXT REFERENCES stores(id),
  primary_trainer_id TEXT REFERENCES trainers(id),
  start_date DATE,
  plan_type TEXT,
  course_id TEXT REFERENCES courses(id),
  monthly_fee NUMERIC,
  monthly_frequency INTEGER,
  ticket_total INTEGER,
  ticket_used INTEGER,
  ticket_start_date DATE,
  ticket_expiry_date DATE,
  ticket_fee NUMERIC,
  payment_history JSONB, -- 支払い履歴をJSONで保持
  counseling_sheet JSONB, -- カウンセリングシートをJSONで保持
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);

-- セッション（トレーニング記録）
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  trainer_id TEXT REFERENCES trainers(id),
  store_id TEXT REFERENCES stores(id),
  date DATE NOT NULL,
  session_number INTEGER,
  course_id TEXT,
  session_duration_minutes INTEGER,
  condition INTEGER,
  condition_notes TEXT,
  stretching_done BOOLEAN,
  stretching_notes TEXT,
  exercises JSONB, -- 種目ごとのセット記録をJSONで保持
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 初期データの投入
-- (initialData.tsの内容を反映)

-- 種目
INSERT INTO exercises (id, name, category, body_part, is_smith_machine_compatible, default_bar_weight) VALUES
('ex1', 'ベンチプレス', 'chest', '胸', true, 20),
('ex2', 'インクラインベンチプレス', 'chest', '胸上部', true, 20),
('ex3', 'スクワット', 'legs', '大腿四頭筋', true, 20),
('ex4', 'デッドリフト', 'back', '背中/ハムストリングス', false, NULL),
('ex5', 'ショルダープレス', 'shoulders', '三角筋', true, 20),
('ex6', 'ラットプルダウン', 'back', '広背筋', false, NULL),
('ex7', 'シーテッドロウ', 'back', '背中', false, NULL),
('ex8', 'レッグプレス', 'legs', '大腿四頭筋', false, NULL),
('ex9', 'チェストフライ', 'chest', '胸', false, NULL),
('ex10', 'レッグカール', 'legs', 'ハムストリングス', false, NULL),
('ex11', 'レッグエクステンション', 'legs', '大腿四頭筋', false, NULL),
('ex12', 'バイセップカール', 'arms', '上腕二頭筋', false, NULL),
('ex13', 'トライセップスプレスダウン', 'arms', '上腕三頭筋', false, NULL),
('ex14', 'ヒップアブダクション', 'legs', '臀部/外転筋', false, NULL),
('ex15', 'カーフレイズ', 'legs', '下腿三頭筋', true, 20);

-- コース
INSERT INTO courses (id, name, session_minutes, monthly_count, plan_type, active) VALUES
('c01', 'ショート月4回', 40, 4, 'monthly', true),
('c02', 'ショート月8回', 40, 8, 'monthly', true),
('c03', 'ショート月12回', 40, 12, 'monthly', true),
('c04', 'ベーシック月4回', 60, 4, 'monthly', true),
('c05', 'ベーシック月8回', 60, 8, 'monthly', true),
('c06', 'ベーシック月12回', 60, 12, 'monthly', true);

INSERT INTO courses (id, name, session_minutes, total_sessions, plan_type, active) VALUES
('c10', '短期集中コース16回', 70, 16, 'intensive', true),
('c14', 'ショートチケット12回', 40, 12, 'ticket', true),
('c17', 'ベーシックチケット24回', 60, 24, 'ticket', true);

-- 店舗
INSERT INTO stores (id, name, address, phone, machines, active, created_at) VALUES
('store1', 'FitLab 渋谷店', '東京都渋谷区道玄坂1-2-3', '03-1234-5678', '[{"id": "m1", "name": "スミスマシン", "type": "smith", "barWeight": 20}, {"id": "m2", "name": "ケーブルマシン", "type": "cable"}, {"id": "m3", "name": "レッグプレスマシン", "type": "plate_loaded"}]', true, '2023-01-15'),
('store2', 'FitLab 新宿店', '東京都新宿区西新宿2-8-1', '03-2345-6789', '[{"id": "m4", "name": "スミスマシン (15kg)", "type": "smith", "barWeight": 15}, {"id": "m5", "name": "ケーブルクロスオーバー", "type": "cable"}, {"id": "m6", "name": "レッグカールマシン", "type": "selectorized"}]', true, '2023-03-20');

-- トレーナー
INSERT INTO trainers (id, name, email, password, role, store_ids, active, created_at, memo) VALUES
('trainer0', '管理者', 'admin@fitlab.jp', 'admin1234', 'admin', ARRAY['store1', 'store2', 'store3'], true, '2023-01-01', 'システム管理者'),
('trainer1', '田中 健太', 'tanaka@fitlab.jp', 'trainer1234', 'trainer', ARRAY['store1'], true, '2023-01-15', 'NSCA-CPT取得'),
('trainer2', '鈴木 美咲', 'suzuki@fitlab.jp', 'trainer1234', 'trainer', ARRAY['store1', 'store2'], true, '2023-02-01', 'NESTA指導員');

-- 顧客
INSERT INTO clients (id, name, name_kana, birth_date, gender, phone, email, address, store_id, primary_trainer_id, start_date, plan_type, course_id, monthly_fee, monthly_frequency, active, created_at, payment_history) VALUES
('client1', '山田 太郎', 'ヤマダ タロウ', '1985-03-15', 'male', '090-1234-5678', 'yamada@example.com', '東京都渋谷区1-1-1', 'store1', 'trainer1', '2024-01-10', 'monthly', 'c05', 30000, 8, true, '2024-01-10', '[]');

-- セッション (例1件)
INSERT INTO sessions (id, client_id, trainer_id, store_id, date, session_number, course_id, session_duration_minutes, condition, condition_notes, stretching_done, exercises, notes) VALUES
('ses-seed-1', 'client1', 'trainer1', 'store1', CURRENT_DATE, 1, 'c05', 60, 4, '調子良好', true, '[]', '初回接続テストデータ');
