// Script para verificar el estado de las suscripciones
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📋 Verificando suscripciones...\n');

const subscriptions = db.prepare(`
  SELECT
    s.id,
    s.subscription_code,
    s.child_name,
    s.weekly_schedule,
    s.preferred_days,
    s.start_month,
    s.start_year,
    sv.name as service_name
  FROM subscriptions s
  LEFT JOIN services sv ON s.service_id = sv.id
  WHERE s.status = 'active'
  ORDER BY s.id
`).all();

subscriptions.forEach(sub => {
  console.log(`\n🔹 ${sub.child_name} - ${sub.service_name}`);
  console.log(`   Código: ${sub.subscription_code}`);
  console.log(`   weekly_schedule: ${sub.weekly_schedule || 'NULL'}`);
  console.log(`   preferred_days: ${sub.preferred_days || 'NULL'}`);
});

db.close();
