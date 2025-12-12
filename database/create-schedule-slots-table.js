// =====================================================
// SCRIPT PARA CREAR TABLA schedule_slots EN PRODUCCIÓN
// Ejecutar: node database/create-schedule-slots-table.js
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Creando tabla schedule_slots...\n');

try {
  // Crear tabla schedule_slots
  const createTableSQL = `
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
    )
  `;

  db.exec(createTableSQL);
  console.log('✅ Tabla schedule_slots creada exitosamente');

  // Crear índices
  console.log('\n📋 Creando índices...');

  db.exec('CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON schedule_slots(day_of_week)');
  console.log('✅ Índice idx_schedule_slots_day creado');

  db.exec('CREATE INDEX IF NOT EXISTS idx_schedule_slots_service ON schedule_slots(service_id)');
  console.log('✅ Índice idx_schedule_slots_service creado');

  db.exec('CREATE INDEX IF NOT EXISTS idx_schedule_slots_active ON schedule_slots(is_active)');
  console.log('✅ Índice idx_schedule_slots_active creado');

  // Verificar que la tabla se creó correctamente
  const tableInfo = db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type='table' AND name='schedule_slots'
  `).get();

  if (tableInfo) {
    console.log('\n✅ Verificación: Tabla creada correctamente');
    console.log('\n📋 Estructura de la tabla:');
    console.log(tableInfo.sql);
  }

  // Mostrar información de índices
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='index' AND tbl_name='schedule_slots'
  `).all();

  console.log('\n📋 Índices creados:');
  indexes.forEach(idx => console.log(`   - ${idx.name}`));

  console.log('\n✅ Proceso completado exitosamente\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Base de datos cerrada');
}
