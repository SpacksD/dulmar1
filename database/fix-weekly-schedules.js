// =====================================================
// SCRIPT PARA ARREGLAR WEEKLY_SCHEDULES VACÍOS
// Asigna schedule slots automáticamente basándose en preferred_days
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Iniciando reparación de weekly_schedules...\n');

// Mapeo de nombres de días a números (0=Domingo, 6=Sábado)
const dayNameToNumber = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6
};

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Verifica si un weekly_schedule está vacío (todos null)
 */
function isWeeklyScheduleEmpty(weeklySchedule) {
  if (!weeklySchedule) return true;

  try {
    const schedule = JSON.parse(weeklySchedule);
    return Object.values(schedule).every(slotId => slotId === null || slotId === undefined);
  } catch {
    return true;
  }
}

/**
 * Encuentra un schedule slot disponible para un servicio en un día específico
 */
function findAvailableSlot(serviceId, dayOfWeek) {
  const slot = db.prepare(`
    SELECT id, start_time, end_time
    FROM schedule_slots
    WHERE service_id = ?
      AND day_of_week = ?
      AND is_active = 1
    ORDER BY start_time
    LIMIT 1
  `).get(serviceId, dayOfWeek);

  return slot;
}

/**
 * Construye un weekly_schedule basado en preferred_days
 */
function buildWeeklySchedule(serviceId, preferredDaysJson) {
  const weeklySchedule = {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null
  };

  try {
    const preferredDays = JSON.parse(preferredDaysJson || '[]');

    for (const dayName of preferredDays) {
      const dayNumber = dayNameToNumber[dayName.toLowerCase()];

      if (dayNumber !== undefined) {
        const slot = findAvailableSlot(serviceId, dayNumber);

        if (slot) {
          weeklySchedule[dayNumber] = slot.id;
          console.log(`      ✓ ${dayName}: Slot ${slot.id} (${slot.start_time})`);
        } else {
          console.log(`      ⚠️  ${dayName}: No hay slots disponibles`);
        }
      }
    }
  } catch (error) {
    console.error('   Error parseando preferred_days:', error.message);
  }

  return weeklySchedule;
}

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

try {
  // 1. Obtener suscripciones con weekly_schedule vacío
  console.log('📋 Paso 1: Buscando suscripciones con weekly_schedule vacío...\n');

  const subscriptions = db.prepare(`
    SELECT
      s.id,
      s.subscription_code,
      s.child_name,
      s.service_id,
      s.weekly_schedule,
      s.preferred_days,
      sv.name as service_name
    FROM subscriptions s
    LEFT JOIN services sv ON s.service_id = sv.id
    WHERE s.status = 'active'
    ORDER BY s.id
  `).all();

  const subsToFix = subscriptions.filter(sub => isWeeklyScheduleEmpty(sub.weekly_schedule));

  console.log(`✓ Encontradas ${subscriptions.length} suscripciones activas`);
  console.log(`✓ ${subsToFix.length} necesitan reparación\n`);

  if (subsToFix.length === 0) {
    console.log('✅ No hay suscripciones que reparar!');
    process.exit(0);
  }

  // 2. Reparar cada suscripción
  console.log('📋 Paso 2: Reparando suscripciones...\n');

  const updateStmt = db.prepare(`
    UPDATE subscriptions
    SET weekly_schedule = ?
    WHERE id = ?
  `);

  let fixedCount = 0;
  const results = [];

  for (const sub of subsToFix) {
    console.log(`\n🔹 ${sub.child_name} - ${sub.service_name}`);
    console.log(`   Código: ${sub.subscription_code}`);
    console.log(`   Días preferidos: ${sub.preferred_days}`);
    console.log(`   Asignando slots:`);

    const newWeeklySchedule = buildWeeklySchedule(sub.service_id, sub.preferred_days);
    const hasSlots = Object.values(newWeeklySchedule).some(slotId => slotId !== null);

    if (hasSlots) {
      try {
        updateStmt.run(JSON.stringify(newWeeklySchedule), sub.id);
        fixedCount++;
        console.log(`   ✅ Weekly schedule actualizado`);

        results.push({
          subscription_code: sub.subscription_code,
          child_name: sub.child_name,
          status: 'fixed',
          slots_assigned: Object.values(newWeeklySchedule).filter(s => s !== null).length
        });
      } catch (error) {
        console.log(`   ❌ Error actualizando: ${error.message}`);
        results.push({
          subscription_code: sub.subscription_code,
          child_name: sub.child_name,
          status: 'error',
          slots_assigned: 0
        });
      }
    } else {
      console.log(`   ⚠️  No se encontraron slots disponibles para este servicio`);
      results.push({
        subscription_code: sub.subscription_code,
        child_name: sub.child_name,
        status: 'no_slots',
        slots_assigned: 0
      });
    }
  }

  // 3. Resumen
  console.log('\n\n📊 RESUMEN:\n');
  console.log('═'.repeat(70));
  console.log(`   ✅ Suscripciones reparadas: ${fixedCount}`);
  console.log(`   ⚠️  Sin slots disponibles: ${results.filter(r => r.status === 'no_slots').length}`);
  console.log(`   ❌ Errores: ${results.filter(r => r.status === 'error').length}`);
  console.log('═'.repeat(70));

  console.log('\n📋 DETALLE POR SUSCRIPCIÓN:\n');
  results.forEach(r => {
    const icon = {
      'fixed': '✅',
      'no_slots': '⚠️',
      'error': '❌'
    }[r.status] || '❓';

    console.log(`${icon} ${r.child_name} (${r.subscription_code}): ${r.slots_assigned} slots asignados`);
  });

  console.log('\n🎉 ¡Proceso completado!\n');

  if (fixedCount > 0) {
    console.log('💡 Próximo paso:');
    console.log('   Ejecuta: node seed-sessions.js');
    console.log('   Para generar las sesiones de las suscripciones reparadas\n');
  }

} catch (error) {
  console.error('❌ Error durante el proceso:', error);
  console.error(error.stack);
} finally {
  db.close();
}
