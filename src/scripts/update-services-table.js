import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', '..', 'database', 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🔧 Actualizando tabla de servicios...');

try {
  // Verificar si las columnas ya existen
  const tableInfo = db.prepare("PRAGMA table_info(services)").all();
  const columnNames = tableInfo.map(column => column.name);

  // Agregar sessions_included si no existe
  if (!columnNames.includes('sessions_included')) {
    db.prepare('ALTER TABLE services ADD COLUMN sessions_included INTEGER DEFAULT 8').run();
    console.log('✅ Campo sessions_included agregado (default: 8)');
  } else {
    console.log('ℹ️ Campo sessions_included ya existe');
  }

  // Agregar pricing_type si no existe
  if (!columnNames.includes('pricing_type')) {
    db.prepare('ALTER TABLE services ADD COLUMN pricing_type TEXT DEFAULT "sessions"').run();
    console.log('✅ Campo pricing_type agregado (default: "sessions")');
  } else {
    console.log('ℹ️ Campo pricing_type ya existe');
  }

  // Actualizar todos los servicios existentes para tener los valores por defecto
  const updateStmt = db.prepare(`
    UPDATE services
    SET sessions_included = 8, pricing_type = 'sessions'
    WHERE sessions_included IS NULL OR pricing_type IS NULL
  `);

  const updateResult = updateStmt.run();
  console.log(`✅ Actualizado ${updateResult.changes} servicios con valores por defecto`);

  // Mostrar estructura actualizada
  console.log('\n📋 Estructura actualizada de la tabla services:');
  const updatedTableInfo = db.prepare("PRAGMA table_info(services)").all();
  updatedTableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.dflt_value ? `(default: ${column.dflt_value})` : ''}`);
  });

  console.log('\n✅ Actualización de la tabla services completada exitosamente!');

} catch (error) {
  console.error('❌ Error actualizando la tabla:', error.message);
} finally {
  db.close();
}