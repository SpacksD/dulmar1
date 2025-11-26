-- =====================================================
-- MIGRACIÓN 001: Módulos para Staff
-- Fecha: 2025-11-22
-- Descripción: Crea tablas y campos para funcionalidad de staff
-- =====================================================

-- =====================================================
-- 1. CHILD PROFILES (Perfiles de Niños)
-- =====================================================

CREATE TABLE IF NOT EXISTS child_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL UNIQUE,
  photo_url VARCHAR(500),
  birth_date DATE NOT NULL,

  -- Medical Information (JSON arrays para flexibilidad)
  allergies TEXT, -- JSON: [{"allergen": "lactose", "severity": "moderate", "notes": "..."}]
  medical_conditions TEXT, -- JSON: [{"condition": "asthma", "treatment": "...", "notes": "..."}]
  medications TEXT, -- JSON: [{"medication": "...", "dosage": "...", "frequency": "...", "notes": "..."}]
  special_needs TEXT,

  -- Emergency Contacts (JSON array)
  emergency_contacts TEXT, -- JSON: [{"name": "...", "relation": "...", "phone": "...", "is_primary": true}]

  -- Preferences
  dietary_restrictions TEXT,
  favorite_activities TEXT,
  behavioral_notes TEXT,

  -- Developmental Milestones (JSON array)
  milestones TEXT, -- JSON: [{"milestone": "...", "date_achieved": "...", "notes": "...", "category": "physical"}]

  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_subscription ON child_profiles(subscription_id);

-- =====================================================
-- 2. CHILD OBSERVATIONS (Observaciones del Staff)
-- =====================================================

CREATE TABLE IF NOT EXISTS child_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_profile_id INTEGER NOT NULL,
  session_id INTEGER,
  staff_id INTEGER NOT NULL,
  observation_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'physical', 'cognitive', 'social', 'emotional', 'language'
  observation_text TEXT NOT NULL,
  is_important BOOLEAN DEFAULT 0,
  shared_with_parent BOOLEAN DEFAULT 0,
  parent_viewed BOOLEAN DEFAULT 0,
  parent_viewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (child_profile_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id),

  CHECK (category IN ('physical', 'cognitive', 'social', 'emotional', 'language', 'general'))
);

CREATE INDEX IF NOT EXISTS idx_child_observations_profile ON child_observations(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_child_observations_session ON child_observations(session_id);
CREATE INDEX IF NOT EXISTS idx_child_observations_staff ON child_observations(staff_id);
CREATE INDEX IF NOT EXISTS idx_child_observations_date ON child_observations(observation_date);

-- =====================================================
-- 3. ATTENDANCE RECORDS (Registro de Asistencia)
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL UNIQUE,
  check_in_time DATETIME,
  check_out_time DATETIME,
  checked_in_by INTEGER,
  checked_out_by INTEGER,
  is_late BOOLEAN DEFAULT 0,
  is_early_departure BOOLEAN DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  early_minutes INTEGER DEFAULT 0,
  absence_reason VARCHAR(200),
  absence_notified_parent BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id),
  FOREIGN KEY (checked_out_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_checkin ON attendance_records(check_in_time);

-- =====================================================
-- 4. DAILY STAFF NOTES (Notas Diarias del Staff)
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_staff_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  note_date DATE NOT NULL,
  note_text TEXT,
  mood VARCHAR(20), -- 'excellent', 'good', 'neutral', 'challenging', 'difficult'
  energy_level VARCHAR(20), -- 'high', 'medium', 'low'
  highlights TEXT, -- Highlights of the day
  concerns TEXT, -- Concerns or issues
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,

  CHECK (mood IN ('excellent', 'good', 'neutral', 'challenging', 'difficult')),
  CHECK (energy_level IN ('high', 'medium', 'low')),

  UNIQUE(staff_id, note_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_staff_notes_staff ON daily_staff_notes(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_staff_notes_date ON daily_staff_notes(note_date);

-- =====================================================
-- 5. EXTEND SESSIONS TABLE
-- Agregar campos adicionales para gestión de sesiones
-- =====================================================

-- Verificar y agregar columnas solo si no existen
-- SQLite no soporta IF NOT EXISTS en ALTER TABLE, usar condición
-- Estas columnas se agregarán manualmente si no existen

-- ALTER TABLE sessions ADD COLUMN arrival_time TIME;
-- ALTER TABLE sessions ADD COLUMN departure_time TIME;
-- ALTER TABLE sessions ADD COLUMN materials_prepared BOOLEAN DEFAULT 0;
-- ALTER TABLE sessions ADD COLUMN checked_in_at DATETIME;
-- ALTER TABLE sessions ADD COLUMN checked_out_at DATETIME;
-- ALTER TABLE sessions ADD COLUMN was_late BOOLEAN DEFAULT 0;
-- ALTER TABLE sessions ADD COLUMN overall_mood VARCHAR(20);
-- ALTER TABLE sessions ADD COLUMN energy_level VARCHAR(20);
-- ALTER TABLE sessions ADD COLUMN completed_at DATETIME;

-- =====================================================
-- 6. STAFF AVAILABILITY (Disponibilidad del Staff)
-- Para el módulo de Weekly Schedule
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,

  CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_day ON staff_availability(day_of_week);

-- =====================================================
-- 7. INSERTAR DATOS DE EJEMPLO (opcional)
-- =====================================================

-- Ejemplo: Crear perfil para el primer niño de subscriptions
-- INSERT INTO child_profiles (subscription_id, birth_date, allergies, emergency_contacts)
-- SELECT id, DATE('now', '-2 years'), '[]', '[]'
-- FROM subscriptions
-- WHERE id = 1;

-- =====================================================
-- FIN DE MIGRACIÓN 001
-- =====================================================
