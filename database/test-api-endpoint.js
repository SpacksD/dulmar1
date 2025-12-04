// Script para probar que la función generateSessionsForSubscription funciona correctamente
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🧪 PROBANDO LÓGICA DE GENERACIÓN DE SESIONES\n');

// Importar la función desde el archivo TypeScript (simulación)
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

// Obtener una subscripción de prueba
const subscription = db.prepare(`
  SELECT s.*, srv.duration as service_duration
  FROM subscriptions s
  LEFT JOIN services srv ON s.service_id = srv.id
  WHERE s.status = 'active'
  AND s.weekly_schedule IS NOT NULL
  LIMIT 1
`).get();

if (!subscription) {
  console.log('❌ No hay subscripciones activas con horarios configurados');
  db.close();
  process.exit(1);
}

console.log(`📋 Subscripción de prueba: ${subscription.child_name} (ID: ${subscription.id})`);
console.log(`   Weekly Schedule: ${subscription.weekly_schedule}\n`);

const weeklySchedule = JSON.parse(subscription.weekly_schedule || '{}');
const hasSlots = Object.values(weeklySchedule).some(slotId => slotId !== null);

console.log(`✓ Tiene horarios configurados: ${hasSlots ? 'SÍ' : 'NO'}`);

if (hasSlots) {
  console.log('\n📅 Horarios por día de la semana:');
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  Object.entries(weeklySchedule).forEach(([day, slotId]) => {
    if (slotId) {
      console.log(`   ${dayNames[parseInt(day)]}: slot ${slotId}`);
    }
  });

  console.log('\n🔄 Verificando generación de sesiones...');

  // Horarios por defecto
  const defaultTimeSlots = {
    0: '09:00', 1: '08:00', 2: '08:00', 3: '09:00',
    4: '08:00', 5: '07:00', 6: '09:00'
  };

  let totalDays = 0;
  const monthsToGenerate = 3;

  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    let currentMonth = subscription.start_month + monthOffset;
    let currentYear = subscription.start_year;

    while (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }

    for (const [dayOfWeek, slotId] of Object.entries(weeklySchedule)) {
      if (!slotId) continue;

      const daysInMonth = getDaysInMonth(currentYear, currentMonth, parseInt(dayOfWeek));
      totalDays += daysInMonth.length;

      if (monthOffset === 0) {
        const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const dayName = dayNames[parseInt(dayOfWeek)];
        console.log(`   ${monthName} - ${dayName}: ${daysInMonth.length} días`);
      }
    }
  }

  console.log(`\n✅ Total de sesiones que se generarían: ${totalDays}`);
}

console.log('\n📊 Estado actual de sesiones en la BD:');
const currentSessions = db.prepare(`
  SELECT COUNT(*) as count FROM sessions WHERE subscription_id = ?
`).get(subscription.id);

console.log(`   Sesiones existentes para esta subscripción: ${currentSessions.count}`);

db.close();
console.log('\n✅ Prueba completada');
