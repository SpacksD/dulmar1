const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('🔍 Revisando distribución de sesiones...\n');

// Total de sesiones
const total = db.prepare(`SELECT COUNT(*) as count FROM sessions`).get();
console.log(`Total de sesiones: ${total.count}`);

// Rango de fechas
const range = db.prepare(`
  SELECT
    MIN(session_date) as primera,
    MAX(session_date) as ultima,
    DATE('now') as hoy
  FROM sessions
`).get();

console.log(`Primera sesión: ${range.primera}`);
console.log(`Última sesión: ${range.ultima}`);
console.log(`Fecha de hoy: ${range.hoy}\n`);

// Sesiones por rango
const pasadas = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE session_date < DATE('now')
  AND status != 'cancelled'
`).get();

const hoy = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE session_date = DATE('now')
  AND status != 'cancelled'
`).get();

const futuras = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE session_date > DATE('now')
  AND status != 'cancelled'
`).get();

console.log(`📊 Distribución:`);
console.log(`   Sesiones pasadas: ${pasadas.count}`);
console.log(`   Sesiones hoy: ${hoy.count}`);
console.log(`   Sesiones futuras: ${futuras.count}\n`);

// Últimos 30 días
const ultimos30 = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE session_date >= DATE('now', '-30 days')
  AND session_date <= DATE('now')
  AND status != 'cancelled'
`).get();

console.log(`Sesiones últimos 30 días: ${ultimos30.count}`);

// Próximos 30 días
const proximos30 = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE session_date >= DATE('now')
  AND session_date <= DATE('now', '+30 days')
  AND status != 'cancelled'
`).get();

console.log(`Sesiones próximos 30 días: ${proximos30.count}\n`);

// Ejemplo de sesiones
const ejemplos = db.prepare(`
  SELECT session_date, session_time, status, COUNT(*) as count
  FROM sessions
  GROUP BY session_date, session_time, status
  ORDER BY session_date DESC
  LIMIT 10
`).all();

console.log(`📅 Ejemplos de sesiones (últimas 10 fechas):`);
ejemplos.forEach(s => {
  console.log(`   ${s.session_date} ${s.session_time} - ${s.status} (${s.count} sesiones)`);
});

db.close();
