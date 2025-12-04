// Script para verificar sesiones de HOY
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📅 VERIFICANDO SESIONES DE HOY\n');

// Obtener la fecha de hoy
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ...

console.log(`📌 Fecha de hoy: ${todayStr}`);
console.log(`📌 Día de la semana: ${dayOfWeek} (${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek]})\n`);

// Buscar sesiones para hoy
const todaySessions = db.prepare(`
  SELECT
    s.id as session_id,
    s.session_date,
    s.session_time,
    s.status,
    sub.child_name,
    srv.name as service_name
  FROM sessions s
  LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
  LEFT JOIN services srv ON sub.service_id = srv.id
  WHERE s.session_date = ?
  ORDER BY s.session_time
`).all(todayStr);

console.log(`🔍 Sesiones encontradas para HOY (${todayStr}): ${todaySessions.length}\n`);

if (todaySessions.length > 0) {
  console.log('Lista de sesiones:');
  console.log('='.repeat(80));
  todaySessions.forEach(session => {
    console.log(`  ID: ${session.session_id}`);
    console.log(`  Niño: ${session.child_name}`);
    console.log(`  Servicio: ${session.service_name}`);
    console.log(`  Hora: ${session.session_time}`);
    console.log(`  Estado: ${session.status}`);
    console.log('-'.repeat(80));
  });
} else {
  console.log('❌ No hay sesiones programadas para hoy\n');

  // Mostrar próximas sesiones
  console.log('📅 Próximas sesiones (siguientes 7 días):');
  console.log('='.repeat(80));

  const upcomingSessions = db.prepare(`
    SELECT
      s.session_date,
      s.session_time,
      sub.child_name,
      srv.name as service_name
    FROM sessions s
    LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
    LEFT JOIN services srv ON sub.service_id = srv.id
    WHERE s.session_date > ?
    ORDER BY s.session_date, s.session_time
    LIMIT 10
  `).all(todayStr);

  if (upcomingSessions.length > 0) {
    upcomingSessions.forEach(session => {
      console.log(`  ${session.session_date} ${session.session_time} - ${session.child_name} (${session.service_name})`);
    });
  } else {
    console.log('  No hay sesiones futuras programadas');
  }

  console.log('='.repeat(80));

  // Mostrar rango de fechas de las sesiones existentes
  const dateRange = db.prepare(`
    SELECT
      MIN(session_date) as first_date,
      MAX(session_date) as last_date,
      COUNT(*) as total_sessions
    FROM sessions
  `).get();

  console.log(`\n📊 Información de sesiones en la base de datos:`);
  console.log(`   Primera sesión: ${dateRange.first_date || 'N/A'}`);
  console.log(`   Última sesión: ${dateRange.last_date || 'N/A'}`);
  console.log(`   Total de sesiones: ${dateRange.total_sessions}`);
}

console.log('\n');

db.close();
