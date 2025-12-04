// =====================================================
// SCRIPT PARA ELIMINAR LA TABLA schedule_slots
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🗑️  Eliminando tabla schedule_slots...\n');

try {
  // Verificar si la tabla existe
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='schedule_slots'
  `).get();

  if (!tableExists) {
    console.log('ℹ️  La tabla schedule_slots no existe en la base de datos');
    db.close();
    process.exit(0);
  }

  // Eliminar la tabla
  db.prepare('DROP TABLE schedule_slots').run();

  console.log('✅ Tabla schedule_slots eliminada exitosamente');

  // Verificar que se eliminó
  const checkAgain = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='schedule_slots'
  `).get();

  if (!checkAgain) {
    console.log('✅ Verificación: La tabla ya no existe en la base de datos');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('\n🔒 Base de datos cerrada');
}
