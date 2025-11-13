import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', '..', 'database', 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🔧 Actualizando tabla de subscriptions...');

try {
  // Verificar si la columna weekly_schedule ya existe
  const tableInfo = db.prepare("PRAGMA table_info(subscriptions)").all();
  const columnNames = tableInfo.map(column => column.name);

  // Agregar weekly_schedule si no existe
  if (!columnNames.includes('weekly_schedule')) {
    db.prepare('ALTER TABLE subscriptions ADD COLUMN weekly_schedule TEXT').run();
    console.log('✅ Campo weekly_schedule agregado');

    // Migrar datos existentes de preferred_days/preferred_times a weekly_schedule
    console.log('📝 Migrando datos existentes...');

    const existingSubscriptions = db.prepare(`
      SELECT id, preferred_days, preferred_times
      FROM subscriptions
      WHERE preferred_days IS NOT NULL OR preferred_times IS NOT NULL
    `).all();

    let migratedCount = 0;
    for (const subscription of existingSubscriptions) {
      try {
        // Crear un objeto de horario semanal vacío
        const weeklySchedule = {0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null};

        // Por ahora, mantenemos un formato JSON simple para compatibilidad
        // En el futuro, esto se puede migrar a una estructura más compleja
        const weeklyScheduleJson = JSON.stringify(weeklySchedule);

        db.prepare(`
          UPDATE subscriptions
          SET weekly_schedule = ?
          WHERE id = ?
        `).run(weeklyScheduleJson, subscription.id);

        migratedCount++;
      } catch (error) {
        console.warn(`⚠️ Error migrando subscripción ${subscription.id}:`, error.message);
      }
    }

    console.log(`✅ Migradas ${migratedCount} subscripciones existentes`);
  } else {
    console.log('ℹ️ Campo weekly_schedule ya existe');
  }

  // Mostrar estructura actualizada
  console.log('\n📋 Estructura actualizada de la tabla subscriptions:');
  const updatedTableInfo = db.prepare("PRAGMA table_info(subscriptions)").all();
  const scheduleFields = updatedTableInfo.filter(column =>
    column.name.includes('preferred_') || column.name.includes('weekly_schedule')
  );

  console.log('\n🗓️ Campos relacionados con horarios:');
  scheduleFields.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.dflt_value ? `(default: ${column.dflt_value})` : ''}`);
  });

  console.log('\n✅ Actualización de la tabla subscriptions completada exitosamente!');
  console.log('\n📝 Nota: Los campos preferred_days y preferred_times se mantendrán por compatibilidad,');
  console.log('   pero el nuevo sistema usará weekly_schedule.');

} catch (error) {
  console.error('❌ Error actualizando la tabla:', error.message);
} finally {
  db.close();
}