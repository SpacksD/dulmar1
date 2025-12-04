// =====================================================
// SCRIPT PARA MIGRAR SUBSCRIPCIONES EXISTENTES
// Crea child_profiles y sessions para subscripciones que ya existen
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Iniciando migración de subscripciones existentes...\n');

// =====================================================
// PASO 1: Crear child_profiles faltantes
// =====================================================

console.log('📋 PASO 1: Creando child_profiles faltantes...');

const subscriptionsWithoutProfiles = db.prepare(`
  SELECT
    s.id as subscription_id,
    s.child_age,
    s.special_requests,
    s.user_id
  FROM subscriptions s
  LEFT JOIN child_profiles cp ON s.id = cp.subscription_id
  WHERE cp.id IS NULL
  AND s.status IN ('pending', 'active')
`).all();

console.log(`   Encontradas ${subscriptionsWithoutProfiles.length} subscripciones sin child_profile`);

if (subscriptionsWithoutProfiles.length > 0) {
  const createProfileStmt = db.prepare(`
    INSERT INTO child_profiles (
      subscription_id, birth_date, special_needs,
      allergies, medical_conditions, medications,
      emergency_contacts, updated_by
    ) VALUES (?, ?, ?, '[]', '[]', '[]', '[]', ?)
  `);

  let created = 0;
  for (const sub of subscriptionsWithoutProfiles) {
    try {
      // Calcular fecha de nacimiento aproximada basada en la edad
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - sub.child_age);
      const birthDateStr = birthDate.toISOString().split('T')[0];

      createProfileStmt.run(
        sub.subscription_id,
        birthDateStr,
        sub.special_requests || null,
        sub.user_id || 1 // Si no hay user_id, usar 1 (admin)
      );
      created++;
    } catch (error) {
      console.error(`   ❌ Error creando profile para subscription ${sub.subscription_id}:`, error.message);
    }
  }

  console.log(`   ✅ Creados ${created} child_profiles\n`);
} else {
  console.log('   ✅ Todos los profiles ya existen\n');
  const created = 0; // Define variable for summary
}

// =====================================================
// PASO 2: Generar sessions para subscripciones activas
// =====================================================

console.log('📅 PASO 2: Generando sessions para subscripciones activas...');

// Función auxiliar para obtener días del mes
function getDaysInMonth(year, month, dayOfWeek) {
  const dates = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    if (date.getDay() === dayOfWeek) {
      dates.push(date.getDate());
    }
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

// Función para generar sessions
function generateSessionsForSubscription(subscription) {
  try {
    const weeklySchedule = JSON.parse(subscription.weekly_schedule || '{}');

    // Verificar si hay slots en el weekly_schedule
    const hasSlots = Object.values(weeklySchedule).some(slotId => slotId !== null);
    if (!hasSlots) {
      console.log(`   ⚠️  Subscription ${subscription.id}: No tiene horarios configurados (weekly_schedule vacío)`);
      return 0;
    }

    const sessions = [];
    const monthsToGenerate = 3;

    // Obtener la numeración de sesión inicial (última sesión + 1)
    const lastSession = db.prepare(`
      SELECT MAX(session_number) as last_number
      FROM sessions
      WHERE subscription_id = ?
    `).get(subscription.id);

    let globalSessionNumber = (lastSession?.last_number || 0) + 1;

    for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
      let currentMonth = subscription.start_month + monthOffset;
      let currentYear = subscription.start_year;

      // Ajustar año si el mes excede 12
      while (currentMonth > 12) {
        currentMonth -= 12;
        currentYear += 1;
      }

      const monthSessions = [];

      // Para cada día de la semana en el weekly_schedule
      for (const [dayOfWeek, slotId] of Object.entries(weeklySchedule)) {
        if (!slotId) continue;

        // Obtener info del schedule_slot
        const slot = db.prepare(`
          SELECT start_time, end_time FROM schedule_slots WHERE id = ?
        `).get(slotId);

        if (!slot) {
          console.log(`   ⚠️  Schedule slot ${slotId} no encontrado para subscription ${subscription.id}`);
          continue;
        }

        // Obtener todos los días del mes que coinciden con este día de la semana
        const daysInMonth = getDaysInMonth(currentYear, currentMonth, parseInt(dayOfWeek));

        for (const day of daysInMonth) {
          const sessionDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Verificar si la sesión ya existe
          const existingSession = db.prepare(`
            SELECT id FROM sessions
            WHERE subscription_id = ?
            AND session_date = ?
            AND session_time = ?
          `).get(subscription.id, sessionDate, slot.start_time);

          if (!existingSession) {
            monthSessions.push({
              subscription_id: subscription.id,
              session_date: sessionDate,
              session_time: slot.start_time,
              duration_minutes: subscription.service_duration || 60,
              status: 'scheduled'
            });
          }
        }
      }

      // Ordenar sesiones del mes por fecha
      monthSessions.sort((a, b) => a.session_date.localeCompare(b.session_date));

      // Asignar números de sesión y agregar al array principal
      monthSessions.forEach(session => {
        sessions.push({ ...session, session_number: globalSessionNumber++ });
      });
    }

    if (sessions.length === 0) {
      return 0;
    }

    // Insertar todas las sesiones usando una transacción
    const insertStmt = db.prepare(`
      INSERT INTO sessions (
        subscription_id, session_date, session_time,
        session_number, duration_minutes, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((sessionsToInsert) => {
      for (const session of sessionsToInsert) {
        insertStmt.run(
          session.subscription_id,
          session.session_date,
          session.session_time,
          session.session_number,
          session.duration_minutes,
          session.status
        );
      }
    });

    insertMany(sessions);

    return sessions.length;
  } catch (error) {
    console.error(`   ❌ Error generando sesiones para subscription ${subscription.id}:`, error.message);
    return 0;
  }
}

// Obtener subscripciones activas
const activeSubscriptions = db.prepare(`
  SELECT s.*, srv.duration as service_duration
  FROM subscriptions s
  LEFT JOIN services srv ON s.service_id = srv.id
  WHERE s.status = 'active'
`).all();

console.log(`   Encontradas ${activeSubscriptions.length} subscripciones activas`);

let totalSessionsCreated = 0;
let subscriptionsProcessed = 0;
let subscriptionsSkipped = 0;

for (const subscription of activeSubscriptions) {
  const sessionsCreated = generateSessionsForSubscription(subscription);

  if (sessionsCreated > 0) {
    console.log(`   ✅ Subscription ${subscription.id}: ${sessionsCreated} sesiones creadas`);
    totalSessionsCreated += sessionsCreated;
    subscriptionsProcessed++;
  } else {
    subscriptionsSkipped++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE MIGRACIÓN');
console.log('='.repeat(60));
console.log(`✅ Child profiles creados: ${subscriptionsWithoutProfiles.length - (subscriptionsWithoutProfiles.length - created)}`);
console.log(`✅ Subscripciones procesadas: ${subscriptionsProcessed}`);
console.log(`⚠️  Subscripciones omitidas (sin horarios o ya tienen sesiones): ${subscriptionsSkipped}`);
console.log(`✅ Total de sesiones creadas: ${totalSessionsCreated}`);
console.log('='.repeat(60));

db.close();
console.log('\n🔒 Base de datos cerrada');
console.log('✅ Migración completada exitosamente\n');
