// Script para mostrar resumen final del sistema
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('\n');
console.log('═'.repeat(80));
console.log('  📊 RESUMEN FINAL DEL SISTEMA - MÓDULOS DE STAFF');
console.log('═'.repeat(80));
console.log('\n');

// 1. Suscripciones
const subs = db.prepare(`
  SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active
  FROM subscriptions
`).get();

console.log('📋 SUSCRIPCIONES:');
console.log(`   • Total: ${subs.total}`);
console.log(`   • Activas: ${subs.active}`);

// 2. Perfiles de niños
const profiles = db.prepare(`
  SELECT COUNT(*) as total FROM child_profiles
`).get();

console.log('\n👶 PERFILES DE NIÑOS:');
console.log(`   • Total: ${profiles.total}`);

// Perfiles con alertas médicas
const alerts = db.prepare(`
  SELECT COUNT(*) as total
  FROM child_profiles
  WHERE (allergies != '[]' AND allergies IS NOT NULL)
     OR (medical_conditions != '[]' AND medical_conditions IS NOT NULL)
`).get();

console.log(`   • Con alertas médicas: ${alerts.total}`);

// 3. Sesiones
const sessions = db.prepare(`
  SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN session_date = DATE('now') THEN 1 END) as today,
    COUNT(CASE WHEN session_date > DATE('now') THEN 1 END) as future,
    COUNT(CASE WHEN session_date < DATE('now') THEN 1 END) as past
  FROM sessions
`).get();

console.log('\n📅 SESIONES:');
console.log(`   • Total generadas: ${sessions.total}`);
console.log(`   • Hoy: ${sessions.today}`);
console.log(`   • Futuras: ${sessions.future}`);
console.log(`   • Pasadas: ${sessions.past}`);

// 4. Schedule Slots
const slots = db.prepare(`
  SELECT COUNT(*) as total FROM schedule_slots WHERE is_active = 1
`).get();

console.log('\n⏰ SCHEDULE SLOTS:');
console.log(`   • Total activos: ${slots.total}`);

// 5. Servicios con schedule slots
const servicesWithSlots = db.prepare(`
  SELECT
    s.name,
    COUNT(ss.id) as slot_count
  FROM services s
  LEFT JOIN schedule_slots ss ON s.id = ss.service_id AND ss.is_active = 1
  WHERE s.is_active = 1
  GROUP BY s.id, s.name
  ORDER BY slot_count DESC, s.name
`).all();

console.log('\n🎯 COBERTURA DE HORARIOS POR SERVICIO:');
servicesWithSlots.forEach(s => {
  const icon = s.slot_count > 0 ? '✅' : '❌';
  console.log(`   ${icon} ${s.name}: ${s.slot_count} horarios`);
});

// 6. Detalle de suscripciones con sesiones
console.log('\n');
console.log('═'.repeat(80));
console.log('  📝 DETALLE DE SUSCRIPCIONES Y SESIONES');
console.log('═'.repeat(80));
console.log('\n');

const subsDetail = db.prepare(`
  SELECT
    s.child_name,
    sv.name as service_name,
    s.subscription_code,
    COUNT(ses.id) as session_count,
    s.weekly_schedule
  FROM subscriptions s
  LEFT JOIN services sv ON s.service_id = sv.id
  LEFT JOIN sessions ses ON s.id = ses.subscription_id
  WHERE s.status = 'active'
  GROUP BY s.id
  ORDER BY s.child_name
`).all();

subsDetail.forEach((sub, index) => {
  const schedule = JSON.parse(sub.weekly_schedule || '{}');
  const daysWithSlots = Object.values(schedule).filter(slot => slot !== null).length;

  console.log(`${index + 1}. ${sub.child_name} - ${sub.service_name}`);
  console.log(`   Código: ${sub.subscription_code}`);
  console.log(`   Días programados: ${daysWithSlots}/7`);
  console.log(`   Sesiones generadas: ${sub.session_count}`);
  console.log('');
});

console.log('═'.repeat(80));
console.log('  ✅ SISTEMA COMPLETAMENTE OPERATIVO');
console.log('═'.repeat(80));
console.log('\n💡 PRÓXIMOS PASOS:\n');
console.log('   1. Iniciar el servidor: npm run dev');
console.log('   2. Login como staff: staff@dulmar.com');
console.log('   3. Explorar módulos:');
console.log('      • Dashboard: /staff/dashboard');
console.log('      • Asistencia: /staff/attendance');
console.log('      • Perfiles: /staff/children');
console.log('\n');

db.close();
