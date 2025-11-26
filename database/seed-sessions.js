// =====================================================
// SCRIPT PARA GENERAR SESIONES BASADAS EN SUBSCRIPCIONES
// Crea sesiones automáticas usando el weekly_schedule de cada subscripción
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Iniciando generación de sesiones...\\n');

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtiene todos los días de un mes específico que coinciden con un día de la semana
 * @param {number} year - Año
 * @param {number} month - Mes (1-12)
 * @param {number} dayOfWeek - Día de la semana (0=Domingo, 6=Sábado)
 * @returns {number[]} Array de días del mes
 */
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

/**
 * Obtiene el nombre del día de la semana
 * @param {number} dayOfWeek - Día de la semana (0-6)
 * @returns {string} Nombre del día
 */
function getDayName(dayOfWeek) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek] || 'Desconocido';
}

/**
 * Genera sesiones para una subscripción basándose en su weekly_schedule
 * @param {Object} subscription - Datos de la subscripción
 * @returns {Array} Array de objetos de sesión para insertar
 */
function generateSessionsForSubscription(subscription) {
  const sessions = [];

  try {
    // Parsear el weekly_schedule
    const weeklySchedule = JSON.parse(subscription.weekly_schedule || '{}');

    // Generar sesiones para el mes de inicio y los siguientes 2 meses
    // Esto da suficiente data para que el staff pueda gestionar
    const monthsToGenerate = 3;
    let globalSessionNumber = 1;

    for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
      let currentMonth = subscription.start_month + monthOffset;
      let currentYear = subscription.start_year;

      // Ajustar año si el mes excede 12
      while (currentMonth > 12) {
        currentMonth -= 12;
        currentYear += 1;
      }

      // Recolectar todas las sesiones del mes para numerarlas correctamente
      const monthSessions = [];

      // Para cada día de la semana que tenga un horario asignado
      for (const [dayOfWeek, scheduleSlotId] of Object.entries(weeklySchedule)) {
        if (scheduleSlotId === null || scheduleSlotId === undefined) continue;

        const dayNum = parseInt(dayOfWeek);

        // Obtener información del schedule slot
        const slotInfo = db.prepare(`
          SELECT id, start_time, end_time
          FROM schedule_slots
          WHERE id = ?
        `).get(scheduleSlotId);

        if (!slotInfo) {
          console.warn(`   ⚠️  Schedule slot ${scheduleSlotId} no encontrado para subscripción ${subscription.id}`);
          continue;
        }

        // Obtener todos los días de este mes que coinciden con este día de la semana
        const daysInMonth = getDaysInMonth(currentYear, currentMonth, dayNum);

        // Para cada día, crear una sesión
        for (const day of daysInMonth) {
          const sessionDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Calcular duración desde los tiempos o usar duración del servicio
          let durationMinutes = subscription.service_duration || 60;

          if (slotInfo.start_time && slotInfo.end_time) {
            const [startHour, startMin] = slotInfo.start_time.split(':').map(Number);
            const [endHour, endMin] = slotInfo.end_time.split(':').map(Number);
            durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          }

          monthSessions.push({
            subscription_id: subscription.id,
            session_date: sessionDate,
            session_time: slotInfo.start_time,
            duration_minutes: durationMinutes,
            status: 'scheduled'
          });
        }
      }

      // Ordenar por fecha y asignar números de sesión
      monthSessions.sort((a, b) => a.session_date.localeCompare(b.session_date));

      monthSessions.forEach((session, index) => {
        sessions.push({
          ...session,
          session_number: index + 1
        });
      });
    }

  } catch (error) {
    console.error(`   ✗ Error generando sesiones para subscripción ${subscription.id}:`, error.message);
  }

  return sessions;
}

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

try {
  // 1. Obtener todas las suscripciones activas
  console.log('📋 Paso 1: Obteniendo suscripciones activas...\\n');

  const subscriptions = db.prepare(`
    SELECT
      s.id,
      s.subscription_code,
      s.user_id,
      s.service_id,
      s.child_name,
      s.start_month,
      s.start_year,
      s.weekly_schedule,
      s.sessions_per_month,
      sv.name as service_name,
      sv.duration as service_duration
    FROM subscriptions s
    LEFT JOIN services sv ON s.service_id = sv.id
    WHERE s.status = 'active'
    ORDER BY s.id
  `).all();

  console.log(`✓ Encontradas ${subscriptions.length} suscripciones activas\\n`);

  if (subscriptions.length === 0) {
    console.log('⚠️  No hay suscripciones activas. El script terminará.');
    process.exit(0);
  }

  // 2. Verificar sesiones existentes
  console.log('📋 Paso 2: Verificando sesiones existentes...\\n');

  const existingSessions = db.prepare(`
    SELECT subscription_id, COUNT(*) as count
    FROM sessions
    GROUP BY subscription_id
  `).all();

  const sessionsBySubscription = new Map(
    existingSessions.map(row => [row.subscription_id, row.count])
  );

  console.log(`✓ Encontradas ${existingSessions.length} subscripciones con sesiones existentes\\n`);

  // 3. Generar sesiones para cada subscripción
  console.log('📋 Paso 3: Generando sesiones...\\n');

  const insertSession = db.prepare(`
    INSERT INTO sessions (
      subscription_id,
      session_date,
      session_time,
      session_number,
      duration_minutes,
      status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalSessionsCreated = 0;
  const subscriptionsSummary = [];

  for (const subscription of subscriptions) {
    const existingCount = sessionsBySubscription.get(subscription.id) || 0;

    console.log(`\\n🔹 Procesando: ${subscription.child_name} - ${subscription.service_name}`);
    console.log(`   Código: ${subscription.subscription_code}`);
    console.log(`   Mes inicio: ${subscription.start_month}/${subscription.start_year}`);
    console.log(`   Sesiones existentes: ${existingCount}`);

    // Si ya tiene sesiones, preguntar si regenerar (por ahora skip)
    if (existingCount > 0) {
      console.log(`   ⏭️  Saltando - ya tiene sesiones generadas`);
      subscriptionsSummary.push({
        subscription_code: subscription.subscription_code,
        child_name: subscription.child_name,
        created: 0,
        existing: existingCount,
        status: 'skipped'
      });
      continue;
    }

    // Generar sesiones
    const sessionsToCreate = generateSessionsForSubscription(subscription);

    if (sessionsToCreate.length === 0) {
      console.log(`   ⚠️  No se pudieron generar sesiones (verificar weekly_schedule)`);
      subscriptionsSummary.push({
        subscription_code: subscription.subscription_code,
        child_name: subscription.child_name,
        created: 0,
        existing: 0,
        status: 'no_schedule'
      });
      continue;
    }

    // Insertar sesiones en la base de datos
    let createdCount = 0;

    try {
      db.transaction(() => {
        for (const session of sessionsToCreate) {
          insertSession.run(
            session.subscription_id,
            session.session_date,
            session.session_time,
            session.session_number,
            session.duration_minutes,
            session.status
          );
          createdCount++;
        }
      })();

      totalSessionsCreated += createdCount;
      const avgPerMonth = Math.round(sessionsToCreate.length / 3);
      console.log(`   ✓ ${createdCount} sesiones creadas (~${avgPerMonth} por mes x 3 meses)`);

      subscriptionsSummary.push({
        subscription_code: subscription.subscription_code,
        child_name: subscription.child_name,
        created: createdCount,
        existing: 0,
        status: 'success'
      });

    } catch (error) {
      console.error(`   ✗ Error insertando sesiones:`, error.message);
      subscriptionsSummary.push({
        subscription_code: subscription.subscription_code,
        child_name: subscription.child_name,
        created: 0,
        existing: 0,
        status: 'error'
      });
    }
  }

  // 4. Mostrar estadísticas finales
  console.log('\\n\\n📊 ESTADÍSTICAS FINALES:\\n');
  console.log('═'.repeat(70));

  const finalStats = db.prepare(`
    SELECT
      COUNT(DISTINCT s.id) as total_subscriptions,
      COUNT(DISTINCT ses.id) as total_sessions,
      COUNT(DISTINCT CASE WHEN ses.session_date = DATE('now') THEN ses.id END) as today_sessions,
      COUNT(DISTINCT CASE WHEN ses.session_date > DATE('now') THEN ses.id END) as future_sessions,
      COUNT(DISTINCT CASE WHEN ses.session_date < DATE('now') THEN ses.id END) as past_sessions
    FROM subscriptions s
    LEFT JOIN sessions ses ON s.id = ses.subscription_id
    WHERE s.status = 'active'
  `).get();

  console.log(`   📋 Suscripciones activas: ${finalStats.total_subscriptions}`);
  console.log(`   📅 Total de sesiones: ${finalStats.total_sessions}`);
  console.log(`   🆕 Sesiones creadas ahora: ${totalSessionsCreated}`);
  console.log(`   🕐 Sesiones hoy: ${finalStats.today_sessions}`);
  console.log(`   📆 Sesiones futuras: ${finalStats.future_sessions}`);
  console.log(`   📜 Sesiones pasadas: ${finalStats.past_sessions}`);

  console.log('\\n═'.repeat(70));

  // Resumen por subscripción
  console.log('\\n📋 RESUMEN POR SUBSCRIPCIÓN:\\n');

  subscriptionsSummary.forEach(summary => {
    const statusIcon = {
      'success': '✅',
      'skipped': '⏭️',
      'no_schedule': '⚠️',
      'error': '❌'
    }[summary.status] || '❓';

    const statusText = {
      'success': 'Creadas',
      'skipped': 'Ya existían',
      'no_schedule': 'Sin horario',
      'error': 'Error'
    }[summary.status] || 'Desconocido';

    console.log(`${statusIcon} ${summary.child_name} (${summary.subscription_code}): ${summary.created + summary.existing} sesiones - ${statusText}`);
  });

  console.log('\\n🎉 ¡Proceso completado exitosamente!\\n');
  console.log('💡 Ahora puedes:');
  console.log('   1. Iniciar sesión como staff (staff@dulmar.com)');
  console.log('   2. Ver sesiones en el Dashboard (/staff/dashboard)');
  console.log('   3. Gestionar asistencia (/staff/attendance)');
  console.log('   4. Ver perfiles completos (/staff/children)\\n');

} catch (error) {
  console.error('❌ Error durante el proceso:', error);
  console.error(error.stack);
} finally {
  db.close();
}
