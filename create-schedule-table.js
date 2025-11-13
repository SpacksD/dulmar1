import Database from 'better-sqlite3';
import path from 'path';

// Configuración de la base de datos
const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
const db = new Database(dbPath);

// Solo crear la tabla schedule_slots si no existe
const createScheduleSlotsTable = `
  CREATE TABLE IF NOT EXISTS schedule_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    service_id INTEGER,
    max_capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  )
`;

console.log('🗃️ Creando solo la tabla schedule_slots...');

try {
  db.exec(createScheduleSlotsTable);
  console.log('✅ Tabla schedule_slots creada exitosamente');

  // Crear índices para esta tabla
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON schedule_slots(day_of_week)',
    'CREATE INDEX IF NOT EXISTS idx_schedule_slots_service ON schedule_slots(service_id)',
    'CREATE INDEX IF NOT EXISTS idx_schedule_slots_active ON schedule_slots(is_active)'
  ];

  for (const indexSql of indexes) {
    db.exec(indexSql);
    console.log('✅ Índice creado para schedule_slots');
  }

  console.log('🎉 Tabla schedule_slots configurada exitosamente');

} catch (error) {
  console.error('❌ Error creando tabla schedule_slots:', error);
} finally {
  db.close();
}