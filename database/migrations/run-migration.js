/**
 * Script para ejecutar migraciones de base de datos
 * Uso: node database/migrations/run-migration.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'early_stimulation.db');
const migrationPath = path.join(__dirname, '001_staff_modules.sql');

console.log('📦 Iniciando migración de base de datos...');
console.log(`📁 Base de datos: ${dbPath}`);
console.log(`📄 Migración: ${migrationPath}`);

try {
  // Conectar a la base de datos
  const db = new Database(dbPath);

  // Leer archivo SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('\n📋 Ejecutando migración...\n');

  // Ejecutar el SQL completo
  try {
    db.exec(migrationSQL);
    console.log('✅ Migración SQL ejecutada');
  } catch (err) {
    // Si es un error de "tabla ya existe", está OK
    if (err.message.includes('already exists')) {
      console.log('⚠️  Algunas tablas ya existen (skip)');
    } else {
      throw err;
    }
  }

  // Verificar tablas creadas
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name IN ('child_profiles', 'child_observations', 'attendance_records', 'daily_staff_notes', 'staff_availability')
    ORDER BY name
  `).all();

  console.log('\n✅ Migración completada exitosamente!\n');
  console.log('📊 Tablas de staff disponibles:');
  tables.forEach(table => console.log(`   ✓ ${table.name}`));

  // Verificar tablas existentes del sistema
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log('\n📦 Total de tablas en el sistema:', allTables.length);

  db.close();

  console.log('\n🎉 ¡Listo para usar los módulos de staff!');

} catch (error) {
  console.error('\n❌ Error durante la migración:', error.message);
  console.error('\n📝 Stack trace:');
  console.error(error.stack);
  process.exit(1);
}
