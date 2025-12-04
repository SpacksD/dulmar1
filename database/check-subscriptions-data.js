// Script para verificar el estado de las subscripciones
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📊 VERIFICANDO DATOS DE SUBSCRIPCIONES\n');

// 1. Subscripciones activas
const activeSubs = db.prepare(`
  SELECT
    s.id,
    s.child_name,
    s.status,
    s.weekly_schedule,
    COUNT(ses.id) as sessions_count
  FROM subscriptions s
  LEFT JOIN sessions ses ON s.id = ses.subscription_id
  WHERE s.status = 'active'
  GROUP BY s.id
`).all();

console.log(`📋 SUBSCRIPCIONES ACTIVAS: ${activeSubs.length}\n`);

activeSubs.forEach(sub => {
  console.log(`\nID: ${sub.id} - ${sub.child_name}`);
  console.log(`   Status: ${sub.status}`);
  console.log(`   Sessions existentes: ${sub.sessions_count}`);
  console.log(`   Weekly Schedule: ${sub.weekly_schedule || 'NO CONFIGURADO'}`);

  if (sub.weekly_schedule) {
    try {
      const schedule = JSON.parse(sub.weekly_schedule);
      const days = Object.keys(schedule).filter(k => schedule[k] !== null);
      console.log(`   Días configurados: ${days.length > 0 ? days.join(', ') : 'NINGUNO'}`);
    } catch (e) {
      console.log(`   ERROR parseando schedule: ${e.message}`);
    }
  }
});

console.log('\n' + '='.repeat(60));

db.close();
