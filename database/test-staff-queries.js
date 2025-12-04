// Script para probar las queries de staff con sesiones sin asignar
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🧪 PROBANDO QUERIES DE STAFF\n');

const today = new Date().toISOString().split('T')[0];
console.log(`📌 Fecha de hoy: ${today}\n`);

// =====================================================
// TEST 1: getTodaySessions SIN staffId (admin view)
// =====================================================
console.log('TEST 1: getTodaySessions() sin staffId (vista admin)');
console.log('='.repeat(80));

const sessionsAllQuery = `
  SELECT
    s.id,
    s.conducted_by,
    s.session_time,
    sub.child_name,
    srv.name as service_name
  FROM sessions s
  LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
  LEFT JOIN services srv ON sub.service_id = srv.id
  LEFT JOIN attendance_records ar ON s.id = ar.session_id
  WHERE s.session_date = ?
    AND s.status IN ('scheduled', 'confirmed')
  ORDER BY s.session_time ASC
`;

const allSessions = db.prepare(sessionsAllQuery).all(today);
console.log(`Sesiones encontradas: ${allSessions.length}\n`);

if (allSessions.length > 0) {
  allSessions.forEach(s => {
    console.log(`  ${s.session_time} - ${s.child_name} (${s.service_name}) [staff: ${s.conducted_by || 'NO ASIGNADO'}]`);
  });
} else {
  console.log('  ❌ No se encontraron sesiones');
}

console.log('\n');

// =====================================================
// TEST 2: getTodaySessions CON staffId (staff view)
// =====================================================
console.log('TEST 2: getTodaySessions() con staffId=1 (vista staff)');
console.log('='.repeat(80));

const staffId = 1;

const sessionsStaffQuery = `
  SELECT
    s.id,
    s.conducted_by,
    s.session_time,
    sub.child_name,
    srv.name as service_name
  FROM sessions s
  LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
  LEFT JOIN services srv ON sub.service_id = srv.id
  LEFT JOIN attendance_records ar ON s.id = ar.session_id
  WHERE s.session_date = ?
    AND s.status IN ('scheduled', 'confirmed')
    AND (s.conducted_by = ? OR s.conducted_by IS NULL)
  ORDER BY s.session_time ASC
`;

const staffSessions = db.prepare(sessionsStaffQuery).all(today, staffId);
console.log(`Sesiones encontradas: ${staffSessions.length}\n`);

if (staffSessions.length > 0) {
  staffSessions.forEach(s => {
    console.log(`  ${s.session_time} - ${s.child_name} (${s.service_name}) [staff: ${s.conducted_by || 'NO ASIGNADO'}]`);
  });
} else {
  console.log('  ❌ No se encontraron sesiones');
}

console.log('\n');

// =====================================================
// TEST 3: getDashboardStats CON staffId
// =====================================================
console.log('TEST 3: getDashboardStats() con staffId=1');
console.log('='.repeat(80));

const statsQuery = `
  SELECT
    COUNT(*) as today_sessions,
    SUM(CASE WHEN ar.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as checked_in,
    SUM(CASE WHEN ar.absence_reason IS NOT NULL THEN 1 ELSE 0 END) as absent,
    SUM(CASE WHEN ar.check_in_time IS NULL AND ar.absence_reason IS NULL THEN 1 ELSE 0 END) as pending
  FROM sessions s
  LEFT JOIN attendance_records ar ON s.id = ar.session_id
  WHERE s.session_date = ?
    AND (s.conducted_by = ? OR s.conducted_by IS NULL)
`;

const stats = db.prepare(statsQuery).get(today, staffId);
console.log('Estadísticas:');
console.log(`  Total sesiones: ${stats.today_sessions}`);
console.log(`  Presentes: ${stats.checked_in}`);
console.log(`  Ausentes: ${stats.absent}`);
console.log(`  Pendientes: ${stats.pending}`);

console.log('\n');

// =====================================================
// RESUMEN
// =====================================================
console.log('='.repeat(80));
console.log('📊 RESUMEN');
console.log('='.repeat(80));

if (allSessions.length > 0 && staffSessions.length > 0) {
  console.log('✅ Las queries funcionan correctamente');
  console.log('✅ El staff puede ver sesiones sin asignar (conducted_by = NULL)');
} else {
  console.log('❌ Las queries NO están devolviendo sesiones');
  console.log('   Verifica que haya sesiones para hoy con conducted_by = NULL');
}

console.log('='.repeat(80));
console.log('');

db.close();
