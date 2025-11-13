import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', '..', 'database', 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🔍 Verificando estructura de la tabla subscriptions...');

try {
  // Verificar estructura actual
  const tableInfo = db.prepare("PRAGMA table_info(subscriptions)").all();
  const columnNames = tableInfo.map(column => column.name);

  console.log('\n📋 Estructura actual de la tabla subscriptions:');
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.dflt_value ? `(default: ${column.dflt_value})` : ''}`);
  });

  console.log('\n🔍 Verificando campos relacionados al horario:');
  if (columnNames.includes('preferred_days')) {
    console.log('✅ Campo preferred_days encontrado');
  } else {
    console.log('❌ Campo preferred_days NO encontrado');
  }

  if (columnNames.includes('preferred_times')) {
    console.log('✅ Campo preferred_times encontrado');
  } else {
    console.log('❌ Campo preferred_times NO encontrado');
  }

  if (columnNames.includes('weekly_schedule')) {
    console.log('✅ Campo weekly_schedule encontrado');
  } else {
    console.log('❌ Campo weekly_schedule NO encontrado - NECESITA AGREGARSE');
  }

  if (columnNames.includes('selected_schedule_slot')) {
    console.log('✅ Campo selected_schedule_slot encontrado');
  } else {
    console.log('❌ Campo selected_schedule_slot NO encontrado');
  }

} catch (error) {
  console.error('❌ Error verificando la tabla:', error.message);
} finally {
  db.close();
}