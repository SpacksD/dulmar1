// =====================================================
// SCRIPT PARA GENERAR SESIONES PARA TODAS LAS SUBSCRIPCIONES
// Genera sesiones para todas las subscripciones activas con horarios configurados
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Generando sesiones para todas las subscripciones activas...\n');

// =====================================================
// Función auxiliar para obtener días del mes
// =====================================================
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

// =====================================================
// Función para generar sessions (con horarios por defecto)
// =====================================================
function generateSessionsForSubscription(subscription) {
  try {
    const weeklySchedule = JSON.parse(subscription.weekly_schedule || '{}');

    // Verificar si hay slots en el weekly_schedule
    const hasSlots = Object.values(weeklySchedule).some(slotId => slotId !== null);
    if (!hasSlots) {
      console.log(`   ⚠️  Subscription ${subscription.id} (${subscription.child_name}): Sin horarios configurados`);
      return 0;
    }

    // Horarios por defecto para cada día de la semana
    const defaultTimeSlots = {
      0: '09:00', // Domingo
      1: '08:00', // Lunes
      2: '08:00', // Martes
      3: '09:00', // Miércoles
      4: '08:00', // Jueves
      5: '07:00', // Viernes
      6: '09:00'  // Sábado
    };

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

        // Usar horario por defecto basado en el día de la semana
        const defaultTime = defaultTimeSlots[parseInt(dayOfWeek)] || '09:00';

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
          `).get(subscription.id, sessionDate, defaultTime);

          if (!existingSession) {
            monthSessions.push({
              subscription_id: subscription.id,
              session_date: sessionDate,
              session_time: defaultTime,
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

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

// Obtener TODAS las subscripciones activas
const activeSubscriptions = db.prepare(`
  SELECT s.*, srv.duration as service_duration
  FROM subscriptions s
  LEFT JOIN services srv ON s.service_id = srv.id
  WHERE s.status = 'active'
`).all();

console.log(`📋 Encontradas ${activeSubscriptions.length} subscripciones activas\n`);

if (activeSubscriptions.length === 0) {
  console.log('ℹ️  No hay subscripciones activas para procesar\n');
  db.close();
  process.exit(0);
}

console.log('Procesando subscripciones:');
console.log('='.repeat(60));

let totalSessionsCreated = 0;
let subscriptionsProcessed = 0;
let subscriptionsSkipped = 0;

for (const subscription of activeSubscriptions) {
  const sessionsCreated = generateSessionsForSubscription(subscription);

  if (sessionsCreated > 0) {
    console.log(`✅ ${subscription.child_name} (ID ${subscription.id}): ${sessionsCreated} sesiones creadas`);
    totalSessionsCreated += sessionsCreated;
    subscriptionsProcessed++;
  } else {
    console.log(`⏭️  ${subscription.child_name} (ID ${subscription.id}): Sin nuevas sesiones (ya existen o sin horarios)`);
    subscriptionsSkipped++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE GENERACIÓN');
console.log('='.repeat(60));
console.log(`✅ Subscripciones con sesiones generadas: ${subscriptionsProcessed}`);
console.log(`⏭️  Subscripciones omitidas: ${subscriptionsSkipped}`);
console.log(`✅ Total de sesiones creadas: ${totalSessionsCreated}`);
console.log('='.repeat(60));

db.close();
console.log('\n🔒 Base de datos cerrada');
console.log('✅ Proceso completado exitosamente\n');
