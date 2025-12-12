-- =====================================================
-- SCRIPT PARA CREAR TABLA schedule_slots
-- Ejecutar en producción para restaurar la tabla eliminada
-- =====================================================

-- Crear tabla schedule_slots
CREATE TABLE IF NOT EXISTS schedule_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  service_id INTEGER,
  max_capacity INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON schedule_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_service ON schedule_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_active ON schedule_slots(is_active);
